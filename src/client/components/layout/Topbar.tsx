import { useKernelStore } from '@store/kernel.store'
import { useNotebookStore } from '@store/notebook.store'
import { Button } from '@ui/index'

export function Topbar() {
  const { activeNotebookId } = useNotebookStore()
  const { runAll, restartKernel } = useKernelStore()

  if (!activeNotebookId) return null

  return (
    <div className="flex h-12 items-center justify-end px-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => restartKernel(activeNotebookId)}>
          Restart
        </Button>
        <Button size="sm" onClick={() => runAll(activeNotebookId)}>
          Run all
        </Button>
      </div>
    </div>
  )
}
