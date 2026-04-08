import { Badge, Button } from '@ui/index'
import { useNotebookStore } from '@store/notebook.store'
import { useKernelStore } from '@store/kernel.store'

export function Topbar() {
  const { notebook, isSaving, lastSaved, isDirty, updateTitle, activeNotebookId } =
    useNotebookStore()
  const { status, runAll, restartKernel } = useKernelStore()

  if (!notebook || !activeNotebookId) return null

  const kernelStatus = status[activeNotebookId] ?? 'ready'
  const statusVariant =
    kernelStatus === 'ready' ? 'success' : kernelStatus === 'running' ? 'warning' : 'error'

  const saveLabel = isSaving ? 'Saving...' : isDirty ? 'Unsaved' : lastSaved ? 'Saved' : ''

  return (
    <div className="border-border flex h-12 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={notebook.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="text-fg-primary placeholder:text-fg-tertiary bg-transparent text-lg font-semibold outline-none"
          placeholder="Untitled"
        />
        <Badge variant={statusVariant}>{kernelStatus}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {saveLabel && <span className="text-fg-tertiary text-xs">{saveLabel}</span>}
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
