import { useEffect, useRef } from 'react'

import { useNotebookStore } from '@store/notebook.store'

export function usePageTitle() {
  const notebook = useNotebookStore((s) => s.notebook)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const title = notebook?.title
      document.title = title ? `${title} | Typewriter` : 'Typewriter'
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [notebook?.title])
}
