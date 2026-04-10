/* eslint-disable @typescript-eslint/no-explicit-any */

import { createRequire } from 'node:module'

const __tw = globalThis as any
const __builtinKeys = new Set(Object.keys(globalThis))
// Track which variables each block (by id) declared
const __blockVars = new Map<string, string[]>()
const require = createRequire(process.cwd() + '/')
;(__tw as any).require = require
;(__tw as any).__builtinKeys = __builtinKeys
;(__tw as any).__blockVars = __blockVars

const originalStdoutWrite = process.stdout.write.bind(process.stdout)
const originalStderrWrite = process.stderr.write.bind(process.stderr)

function emit(data: Record<string, unknown>) {
  originalStdoutWrite(JSON.stringify(data) + '\n')
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

function extractDeclaredNames(code: string): string[] {
  const names: string[] = []
  code.replace(/^(?:var|let|const)\s+(\w+)\s*=/gm, (_match, name) => {
    names.push(name as string)
    return _match
  })
  code.replace(/^function\s+(\w+)\s*\(/gm, (_match, name) => {
    names.push(name as string)
    return _match
  })
  return names
}

function rewriteDeclarations(code: string): string {
  return code.replace(/^(var|let|const)\s+(\w+)\s*=/gm, (_match, _keyword, name) => {
    return `var ${name} = __tw.${name} =`
  })
}

function rewriteImports(code: string): string {
  return code.replace(
    /^import\s+(?:(\*\s+as\s+(\w+))|(\{[^}]+\})|(\w+))\s+from\s+(['"][^'"]+['"])/gm,
    (_match, star, starName, named, defaultName, source) => {
      // Use require.resolve to find the package from the notebook's node_modules
      const resolved = `require.resolve(${source})`
      if (star) return `const ${starName} = await import(${resolved})`
      if (named) return `const ${named} = await import(${resolved})`
      if (defaultName) return `const ${defaultName} = (await import(${resolved})).default`
      return _match
    }
  )
}

// Output buffer — accumulates as raw strings
let stdoutBuffer = ''
let stderrBuffer = ''
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

  if (stdoutBuffer) {
    emit({ type: 'stdout', text: stdoutBuffer.replace(/\n$/, ''), id: currentId })
    stdoutBuffer = ''
  }
  if (stderrBuffer) {
    emit({ type: 'stderr', text: stderrBuffer.replace(/\n$/, ''), id: currentId })
    stderrBuffer = ''
  }
}

async function execute(id: string, code: string) {
  const startTime = performance.now()
  currentId = id
  stdoutBuffer = ''
  stderrBuffer = ''

  console.log = (...args: unknown[]) => {
    const line = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    stdoutBuffer += (stdoutBuffer && !stdoutBuffer.endsWith('\n') ? '\n' : '') + line + '\n'
    scheduleFlush()
  }

  console.error = (...args: unknown[]) => {
    const line = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    stderrBuffer += (stderrBuffer && !stderrBuffer.endsWith('\n') ? '\n' : '') + line + '\n'
    scheduleFlush()
  }

  // Intercept process.stdout.write / process.stderr.write for libraries that write directly
  process.stdout.write = ((chunk: unknown) => {
    const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk as ArrayBuffer).toString()
    stdoutBuffer += text
    scheduleFlush()
    return true
  }) as typeof process.stdout.write

  process.stderr.write = ((chunk: unknown) => {
    const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk as ArrayBuffer).toString()
    stderrBuffer += text
    scheduleFlush()
    return true
  }) as typeof process.stderr.write

  try {
    // Before running, delete variables this block previously declared
    // so removed declarations don't persist
    const prevVars = __blockVars.get(id) ?? []
    const newVarNames = extractDeclaredNames(code)

    for (const name of prevVars) {
      if (!newVarNames.includes(name)) {
        Reflect.deleteProperty(__tw, name)
      }
    }

    // Track what this block declares now
    __blockVars.set(id, newVarNames)

    const withImports = rewriteImports(code)
    const rewritten = rewriteDeclarations(withImports)
    // Add __tw assignments after each function declaration
    const withFunctions = rewritten.replace(
      /^(function\s+(\w+)\s*\()/gm,
      (_match, decl, name) => `__tw.${name} = ${name};\n${decl}`
    )
    const withReturn = wrapForReturn(withFunctions)
    // Transpile TypeScript to JavaScript (strip type annotations)
    const transpiler = new Bun.Transpiler({ loader: 'ts' })
    const js = transpiler.transformSync(`(async () => {\n${withReturn}\n})()`)
    const result = await (0, eval)(js)

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
    process.stdout.write = originalStdoutWrite
    process.stderr.write = originalStderrWrite
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
