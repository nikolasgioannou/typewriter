// Dev entry point — uses Bun's HTML imports with HMR
// Run with: bun --hot src/server/dev.ts

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import homepage from '@client/index.html'
import { appRouter } from '@server/api/router'
import { handleShutdown, printBanner, startServer } from '@server/lib/start-server'
import { wsHandler } from '@server/ws/handler'

const server = startServer({
  routes: {
    '/': homepage,
    '/:notebookId': homepage,
  },
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

    return new Response('Not found', { status: 404 })
  },
  websocket: wsHandler,
  development: {
    hmr: true,
    console: false,
  },
})

printBanner(server.port ?? 8888, 'typewriter (dev)')
handleShutdown()
