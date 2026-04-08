import { useEffect } from 'react'

import { useNotebookStore } from '@store/notebook.store'

function getNotebookIdFromUrl(): string | null {
  const path = window.location.pathname.slice(1)
  return path || null
}

export function useRouting() {
  // Read notebook ID from URL on mount
  useEffect(() => {
    const id = getNotebookIdFromUrl()
    if (id) {
      // Set state without pushing to history (URL already correct)
      useNotebookStore.setState({ activeNotebookId: id })
    }
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const id = getNotebookIdFromUrl()
      // Set state without pushing to history (browser already updated URL)
      useNotebookStore.setState({ activeNotebookId: id, notebook: null })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}
