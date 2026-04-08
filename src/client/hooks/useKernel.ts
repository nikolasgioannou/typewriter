import { useEffect, useRef } from 'react'

import { useKernelStore } from '@store/kernel.store'

export function useKernel(notebookId: string | null) {
  const { connect, disconnect } = useKernelStore()
  const connectedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!notebookId) return

    if (connectedRef.current !== notebookId) {
      disconnect()
      connect(notebookId)
      connectedRef.current = notebookId
    }

    return () => {
      disconnect()
      connectedRef.current = null
    }
  }, [notebookId, connect, disconnect])
}
