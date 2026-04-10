import { shutdown } from '@server/kernel/manager'

const DEFAULT_PORT = 8888

export function startServer(options: Record<string, unknown>): ReturnType<typeof Bun.serve> {
  const basePort = Number(process.env['PORT'] ?? DEFAULT_PORT)
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return Bun.serve({
        ...options,
        port: basePort + attempt,
      } as Parameters<typeof Bun.serve>[0])
    } catch (err) {
      const isPortTaken =
        (err instanceof Error && (err as NodeJS.ErrnoException).code === 'EADDRINUSE') ||
        String(err).includes('port')
      if (isPortTaken) continue
      throw err
    }
  }
  throw new Error(
    `Could not find an open port after trying ${basePort}-${basePort + maxAttempts - 1}`
  )
}

export function printBanner(port: number, label = 'typewriter') {
  console.log(
    [
      '',
      label,
      `local       http://localhost:${port}`,
      'kernel      ready',
      '',
      'Ctrl+C to stop',
      '',
    ].join('\n')
  )
}

export function handleShutdown() {
  process.on('SIGINT', () => {
    shutdown()
    process.exit(0)
  })
}
