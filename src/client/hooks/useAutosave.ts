import { useEffect, useRef } from 'react'

import { trpc } from '@lib/trpc'
import { useNotebookStore } from '@store/notebook.store'

export function useAutosave() {
  const { notebook, isDirty, markSaving, markSaved } = useNotebookStore()
  const saveMutation = trpc.notebooks.save.useMutation()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty || !notebook) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      markSaving()
      try {
        await saveMutation.mutateAsync({ id: notebook.id, notebook })
        markSaved()
      } catch {
        // Reset saving state so it retries on next change
        useNotebookStore.setState({ isSaving: false })
      }
    }, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, notebook, markSaving, markSaved, saveMutation])
}
