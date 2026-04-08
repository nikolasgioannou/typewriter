import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import homepage from '@client/index.html'
import { appRouter } from '@server/api/router'
import { shutdown } from '@server/kernel/manager'
import { wsHandler } from '@server/ws/handler'

const basePort = Number(process.env['PORT'] ?? 8888)

const serverOptions = {
  routes: {
    '/': homepage,
    '/:notebookId': homepage,
  },
  async fetch(req: Request, server: { upgrade: (req: Request) => boolean }) {
    const url = new URL(req.url)

    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req)
      if (upgraded) return undefined
      return new Response('WebSocket upgrade failed', { status: 400 })
    }

    if (url.pathname.startsWith('/trpc')) {
      return fetchRequestHandler({
        endpoint: '/trpc',
        req,
        router: appRouter,
        createContext: () => ({}),
      })
    }

    return new Response('Not found', { status: 404 })
  },
  websocket: wsHandler,
  development: process.env['NODE_ENV'] !== 'production' ? { hmr: true, console: true } : false,
}

function startServer(port: number, maxAttempts = 10): ReturnType<typeof Bun.serve> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return Bun.serve({ ...serverOptions, port: port + attempt })
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

const server = startServer(basePort)

const url = `http://localhost:${server.port}`

console.log(
  ['', 'typewriter', `local       ${url}`, 'kernel      ready', '', 'Ctrl+C to stop', ''].join('\n')
)

// Auto-open browser
if (process.env['NO_OPEN'] !== '1') {
  const platform = process.platform
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'
  Bun.spawn([cmd, url], { stdout: 'ignore', stderr: 'ignore' })
}

process.on('SIGINT', () => {
  shutdown()
  process.exit(0)
})
