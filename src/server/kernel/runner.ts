/* eslint-disable @typescript-eslint/no-explicit-any */

// Use globalThis as the shared scope for variable persistence
const __tw = globalThis as any

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
  // Rewrite top-level var/let/const to assign to globalThis for persistence
  // This is a simple heuristic that works for common notebook patterns
  return code.replace(
    /^(var|let|const)\s+(\w+)\s*=/gm,
    (_match, _keyword, name) => `__tw.${name} = ${name} =`
  )
}

async function execute(id: string, code: string) {
  console.log = (...args: unknown[]) => {
    emit({
      type: 'stdout',
      text: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      id,
    })
  }

  console.error = (...args: unknown[]) => {
    emit({
      type: 'stderr',
      text: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      id,
    })
  }

  try {
    const rewritten = rewriteDeclarations(code)
    const withReturn = wrapForReturn(rewritten)
    const wrapped = `(async () => {\n${withReturn}\n})()`
    const result = await (0, eval)(wrapped)

    if (result !== undefined) {
      emit({
        type: 'return',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        id,
      })
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    emit({
      type: 'error',
      text: `${error.message}\n${error.stack ?? ''}`,
      id,
    })
  } finally {
    console.log = originalLog
    console.error = originalError
    emit({ type: 'done', id })
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

// Expose __tw globally so eval'd code can access it
__tw.__tw = __tw

readStdin()
