const context: Record<string, unknown> = {}

function emit(data: Record<string, unknown>) {
  process.stdout.write(JSON.stringify(data) + '\n')
}

const originalLog = console.log
const originalError = console.error

async function processLine(line: string) {
  let parsed: { id: string; code: string }
  try {
    parsed = JSON.parse(line) as { id: string; code: string }
  } catch {
    return
  }

  const { id, code } = parsed

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
    const asyncBody = `
      with (context) {
        return await (async () => {
          ${code}
        })()
      }
    `
    const fn = new Function('context', asyncBody)
    const result = await fn(context)

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
        await processLine(line)
      }
    }
  }
}

readStdin()
