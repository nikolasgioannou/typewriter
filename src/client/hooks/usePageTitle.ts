import { useEffect, useRef } from 'react'

import { useNotebookStore } from '@store/notebook.store'

export function usePageTitle() {
  const notebook = useNotebookStore((s) => s.notebook)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (!notebook) {
        document.title = 'Typewriter'
      } else {
        document.title = `${notebook.title || 'New notebook'} | Typewriter`
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [notebook?.title])
}
