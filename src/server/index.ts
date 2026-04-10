import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { resolve } from 'path'

import { appRouter } from '@server/api/router'
import { handleShutdown, printBanner, startServer } from '@server/lib/start-server'
import { wsHandler } from '@server/ws/handler'

const distDir = resolve(import.meta.dir, '../../dist')

const server = startServer({
  websocket: wsHandler,
  async fetch(req: Request, server: { upgrade: (req: Request, options?: unknown) => boolean }) {
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

    const filePath =
      url.pathname === '/' || /^\/[a-z0-9-]+$/.test(url.pathname) ? '/index.html' : url.pathname
    const file = Bun.file(`${distDir}${filePath}`)
    if (await file.exists()) return new Response(file)
    return new Response(Bun.file(`${distDir}/index.html`))
  },
})

printBanner(server.port ?? 8888)
handleShutdown()
