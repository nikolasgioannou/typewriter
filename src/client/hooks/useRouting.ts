import { useEffect } from 'react'

import { useNotebookStore } from '@store/notebook.store'

function getNotebookIdFromUrl(): string | null {
  const path = window.location.pathname.slice(1)
  return path || null
}

export function useRouting() {
  const { activeNotebookId, setActiveNotebook } = useNotebookStore()

  // Read notebook ID from URL on mount
  useEffect(() => {
    const id = getNotebookIdFromUrl()
    if (id && id !== activeNotebookId) {
      setActiveNotebook(id)
    }
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const id = getNotebookIdFromUrl()
      useNotebookStore.setState({ activeNotebookId: id })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}
