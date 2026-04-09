import { useEffect, useRef } from 'react'

import { trpc } from '@lib/trpc'
import { useNotebookStore } from '@store/notebook.store'

export function useAutosave() {
  const isDirty = useNotebookStore((s) => s.isDirty)
  const notebookId = useNotebookStore((s) => s.notebook?.id)
  const saveMutation = trpc.notebooks.save.useMutation()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (!isDirty || !notebookId) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (savingRef.current) return

      const { notebook, isDirty: stillDirty } = useNotebookStore.getState()
      if (!notebook || !stillDirty) return

      savingRef.current = true
      try {
        await saveMutation.mutateAsync({ id: notebook.id, notebook })
        const { isDirty: changedDuring } = useNotebookStore.getState()
        if (!changedDuring) {
          useNotebookStore.setState({ isDirty: false })
        }
      } catch {
        // Will retry on next dirty change
      } finally {
        savingRef.current = false
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, notebookId, saveMutation])
}
