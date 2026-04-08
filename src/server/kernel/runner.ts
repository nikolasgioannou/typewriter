/* eslint-disable @typescript-eslint/no-explicit-any */

import { createRequire } from 'node:module'

const __tw = globalThis as any
const require = createRequire(process.cwd() + '/')
;(__tw as any).require = require

function emit(data: Record<string, unknown>) {
  process.stdout.write(JSON.stringify(data) + '\n')
}

const originalLog = console.log
const originalError = console.error

function wrapForReturn(code: string): string {
  const trimmed = code.trimEnd()
  const lines = trimmed.split('\n')
  const lastLine = lines[lines.length - 1]?.trim() ?? ''

  if (
    lastLine.startsWith('var ') ||
    lastLine.startsWith('let ') ||
    lastLine.startsWith('const ') ||
    lastLine.startsWith('function ') ||
    lastLine.startsWith('class ') ||
    lastLine.startsWith('if ') ||
    lastLine.startsWith('for ') ||
    lastLine.startsWith('while ') ||
    lastLine.startsWith('switch ') ||
    lastLine.startsWith('try ') ||
    lastLine.startsWith('return ') ||
    lastLine.startsWith('throw ') ||
    lastLine.startsWith('import ') ||
    lastLine.startsWith('export ') ||
    lastLine === '' ||
    lastLine.endsWith('}')
  ) {
    return code
  }

  lines[lines.length - 1] = `return ${lastLine}`
  return lines.join('\n')
}

function rewriteDeclarations(code: string): string {
  return code.replace(
    /^(var|let|const)\s+(\w+)\s*=/gm,
    (_match, _keyword, name) => `__tw.${name} = ${name} =`
  )
}

function rewriteImports(code: string): string {
  // import x from 'y' → const x = (await import('y')).default
  // import { a, b } from 'y' → const { a, b } = await import('y')
  // import * as x from 'y' → const x = await import('y')
  return code.replace(
    /^import\s+(?:(\*\s+as\s+(\w+))|(\{[^}]+\})|(\w+))\s+from\s+(['"][^'"]+['"])/gm,
    (_match, star, starName, named, defaultName, source) => {
      if (star) return `const ${starName} = await import(${source})`
      if (named) return `const ${named} = await import(${source})`
      if (defaultName) return `const ${defaultName} = (await import(${source})).default`
      return _match
    }
  )
}

// Output buffer — batches console.log/error calls into single messages
let stdoutBuffer: string[] = []
let stderrBuffer: string[] = []
let flushScheduled = false
let currentId: string | null = null

function scheduleFlush() {
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(flushBuffers)
}

function flushBuffers() {
  flushScheduled = false
  if (!currentId) return

  if (stdoutBuffer.length > 0) {
    emit({ type: 'stdout', text: stdoutBuffer.join('\n'), id: currentId })
    stdoutBuffer = []
  }
  if (stderrBuffer.length > 0) {
    emit({ type: 'stderr', text: stderrBuffer.join('\n'), id: currentId })
    stderrBuffer = []
  }
}

async function execute(id: string, code: string) {
  const startTime = performance.now()
  currentId = id
  stdoutBuffer = []
  stderrBuffer = []

  console.log = (...args: unknown[]) => {
    stdoutBuffer.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    scheduleFlush()
  }

  console.error = (...args: unknown[]) => {
    stderrBuffer.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    scheduleFlush()
  }

  try {
    const withImports = rewriteImports(code)
    const rewritten = rewriteDeclarations(withImports)
    const withReturn = wrapForReturn(rewritten)
    const wrapped = `(async () => {\n${withReturn}\n})()`
    const result = await (0, eval)(wrapped)

    // Flush any remaining buffered output before emitting return/done
    flushBuffers()

    if (result !== undefined) {
      emit({
        type: 'return',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        id,
      })
    }
  } catch (err) {
    flushBuffers()
    const error = err instanceof Error ? err : new Error(String(err))
    emit({
      type: 'error',
      text: `${error.message}\n${error.stack ?? ''}`,
      id,
    })
  } finally {
    console.log = originalLog
    console.error = originalError
    currentId = null
    emit({ type: 'done', id, durationMs: Math.round(performance.now() - startTime) })
  }
}

const decoder = new TextDecoder()
let buffer = ''

async function readStdin() {
  for await (const chunk of Bun.stdin.stream()) {
    buffer += decoder.decode(chunk as Uint8Array, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.trim()) {
        const parsed = JSON.parse(line) as { id: string; code: string }
        await execute(parsed.id, parsed.code)
      }
    }
  }
}

__tw.__tw = __tw

readStdin()
