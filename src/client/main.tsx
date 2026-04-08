import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { trpc } from '@lib/trpc'
import { Editor } from '@client/components/editor/Editor'
import { Shell } from '@client/components/layout/Shell'
import { useRouting } from '@hooks/useRouting'

function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/trpc' })],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppRouting />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

function AppRouting() {
  useRouting()

  return (
    <Shell>
      <Editor />
    </Shell>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
