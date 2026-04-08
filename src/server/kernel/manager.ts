import type { FileSink } from 'bun'
import { resolve } from 'path'

import { ensureNotebookEnv } from '@server/lib/notebook-env'

export interface KernelOutput {
  type: 'stdout' | 'stderr' | 'return' | 'error' | 'done'
  text?: string
  id: string
  durationMs?: number
}

interface KernelProcess {
  process: ReturnType<typeof Bun.spawn>
  stdin: FileSink
  stdout: ReadableStream<Uint8Array>
  executionCounts: Map<string, number>
}

const kernels = new Map<string, KernelProcess>()

const RUNNER_PATH = resolve(import.meta.dir, 'runner.ts')

async function spawnKernel(notebookId: string): Promise<KernelProcess> {
  const cwd = await ensureNotebookEnv(notebookId)

  const proc = Bun.spawn(['bun', 'run', RUNNER_PATH], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
    cwd,
  })

  return {
    process: proc,
    stdin: proc.stdin as FileSink,
    stdout: proc.stdout as ReadableStream<Uint8Array>,
    executionCounts: new Map(),
  }
}

async function getOrCreate(notebookId: string): Promise<KernelProcess> {
  let kernel = kernels.get(notebookId)
  if (!kernel || kernel.process.exitCode !== null) {
    kernel = await spawnKernel(notebookId)
    kernels.set(notebookId, kernel)
  }
  return kernel
}

export async function* runCode(
  notebookId: string,
  blockId: string,
  code: string
): AsyncGenerator<KernelOutput> {
  const kernel = await getOrCreate(notebookId)

  const message = JSON.stringify({ id: blockId, code }) + '\n'
  kernel.stdin.write(message)
  kernel.stdin.flush()

  const reader = kernel.stdout.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        const parsed = JSON.parse(line) as KernelOutput
        if (parsed.id !== blockId) continue

        if (parsed.type === 'done') {
          const count = (kernel.executionCounts.get(blockId) ?? 0) + 1
          kernel.executionCounts.set(blockId, count)
          yield { ...parsed, id: blockId }
          return
        }

        yield parsed
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function* runShell(
  notebookId: string,
  blockId: string,
  command: string
): AsyncGenerator<KernelOutput> {
  const cwd = await ensureNotebookEnv(notebookId)
  const startTime = performance.now()

  const proc = Bun.spawn(['sh', '-c', command], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, PATH: process.env['PATH'] },
  })

  const stdoutReader = (proc.stdout as ReadableStream<Uint8Array>).getReader()
  const stderrReader = (proc.stderr as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()

  async function* readStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    type: 'stdout' | 'stderr'
  ): AsyncGenerator<KernelOutput> {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      if (text) yield { type, text, id: blockId }
    }
    reader.releaseLock()
  }

  // Interleave stdout and stderr
  const stdoutGen = readStream(stdoutReader, 'stdout')
  const stderrGen = readStream(stderrReader, 'stderr')

  let stdoutDone = false
  let stderrDone = false

  while (!stdoutDone || !stderrDone) {
    const promises: Array<
      Promise<{ gen: 'stdout' | 'stderr'; result: IteratorResult<KernelOutput> }>
    > = []

    if (!stdoutDone) {
      promises.push(stdoutGen.next().then((result) => ({ gen: 'stdout' as const, result })))
    }
    if (!stderrDone) {
      promises.push(stderrGen.next().then((result) => ({ gen: 'stderr' as const, result })))
    }

    const { gen, result } = await Promise.race(promises)

    if (result.done) {
      if (gen === 'stdout') stdoutDone = true
      else stderrDone = true
    } else {
      yield result.value
    }
  }

  await proc.exited
  const durationMs = Math.round(performance.now() - startTime)

  if (proc.exitCode !== 0) {
    yield { type: 'error', text: `Process exited with code ${proc.exitCode}`, id: blockId }
  }

  yield { type: 'done', id: blockId, durationMs }
}

export function getExecutionCount(notebookId: string, blockId: string): number {
  const kernel = kernels.get(notebookId)
  return kernel?.executionCounts.get(blockId) ?? 0
}

export async function restart(notebookId: string) {
  const kernel = kernels.get(notebookId)
  if (kernel) {
    kernel.process.kill()
    kernels.delete(notebookId)
  }
  await getOrCreate(notebookId)
}

export function shutdown() {
  for (const [, kernel] of kernels) {
    kernel.process.kill()
  }
  kernels.clear()
}
