import { useEffect, useRef } from 'react'

import { trpc } from '@lib/trpc'
import { useNotebookStore } from '@store/notebook.store'

export function useAutosave() {
  const isDirty = useNotebookStore((s) => s.isDirty)
  const notebookId = useNotebookStore((s) => s.notebook?.id)
  const saveMutation = trpc.notebooks.save.useMutation()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty || !notebookId) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      // Read the latest state at save time, not from the closure
      const { notebook, isDirty: stillDirty } = useNotebookStore.getState()
      if (!notebook || !stillDirty) return

      useNotebookStore.setState({ isSaving: true })
      try {
        await saveMutation.mutateAsync({ id: notebook.id, notebook })
        // Only mark saved if nothing changed during the save
        const { isDirty: changedDuring } = useNotebookStore.getState()
        if (!changedDuring) {
          useNotebookStore.setState({ isSaving: false, isDirty: false })
        } else {
          useNotebookStore.setState({ isSaving: false })
        }
      } catch {
        useNotebookStore.setState({ isSaving: false })
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, notebookId, saveMutation])
}
