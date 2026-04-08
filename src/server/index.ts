import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import homepage from '@client/index.html'
import { appRouter } from '@server/api/router'
import { shutdown } from '@server/kernel/manager'
import { wsHandler } from '@server/ws/handler'

const port = Number(process.env['PORT'] ?? 3000)

const server = Bun.serve({
  port,
  routes: {
    '/': homepage,
  },
  async fetch(req, server) {
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
  development: {
    hmr: true,
    console: true,
  },
})

console.log(`
  typewriter
  local       http://localhost:${server.port}
  kernel      ready

  Ctrl+C to stop
`)

process.on('SIGINT', () => {
  shutdown()
  process.exit(0)
})
