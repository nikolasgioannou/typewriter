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
      await saveMutation.mutateAsync({ id: notebook.id, notebook })
      markSaved()
    }, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, notebook, markSaving, markSaved, saveMutation])
}
