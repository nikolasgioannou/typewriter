import type { FileSink } from 'bun'
import { resolve } from 'path'

export interface KernelOutput {
  type: 'stdout' | 'stderr' | 'return' | 'error' | 'done'
  text?: string
  id: string
}

interface KernelProcess {
  process: ReturnType<typeof Bun.spawn>
  stdin: FileSink
  stdout: ReadableStream<Uint8Array>
  executionCounts: Map<string, number>
}

const kernels = new Map<string, KernelProcess>()

const RUNNER_PATH = resolve(import.meta.dir, 'runner.ts')

function spawnKernel(): KernelProcess {
  const proc = Bun.spawn(['bun', 'run', RUNNER_PATH], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  })

  return {
    process: proc,
    stdin: proc.stdin as FileSink,
    stdout: proc.stdout as ReadableStream<Uint8Array>,
    executionCounts: new Map(),
  }
}

function getOrCreate(notebookId: string): KernelProcess {
  let kernel = kernels.get(notebookId)
  if (!kernel || kernel.process.exitCode !== null) {
    kernel = spawnKernel()
    kernels.set(notebookId, kernel)
  }
  return kernel
}

export async function* runCode(
  notebookId: string,
  blockId: string,
  code: string
): AsyncGenerator<KernelOutput> {
  const kernel = getOrCreate(notebookId)

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

export function getExecutionCount(notebookId: string, blockId: string): number {
  const kernel = kernels.get(notebookId)
  return kernel?.executionCounts.get(blockId) ?? 0
}

export function restart(notebookId: string) {
  const kernel = kernels.get(notebookId)
  if (kernel) {
    kernel.process.kill()
    kernels.delete(notebookId)
  }
  getOrCreate(notebookId)
}

export function shutdown() {
  for (const [, kernel] of kernels) {
    kernel.process.kill()
  }
  kernels.clear()
}
