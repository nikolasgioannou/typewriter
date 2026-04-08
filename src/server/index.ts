import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter } from '@server/api/router'
import { shutdown } from '@server/kernel/manager'
import { wsHandler } from '@server/ws/handler'

const port = Number(process.env['PORT'] ?? 3000)

const server = Bun.serve({
  port,
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

    const filePath = url.pathname === '/' ? '/index.html' : url.pathname
    const file = Bun.file(`public${filePath}`)
    if (await file.exists()) return new Response(file)

    return new Response(Bun.file('public/index.html'))
  },
  websocket: wsHandler,
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
