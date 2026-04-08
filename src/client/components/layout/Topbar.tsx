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
    <div className="flex h-12 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={notebook.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="bg-transparent text-lg font-semibold text-fg-primary outline-none placeholder:text-fg-tertiary"
          placeholder="Untitled"
        />
        <Badge variant={statusVariant}>{kernelStatus}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {saveLabel && <span className="text-xs text-fg-tertiary">{saveLabel}</span>}
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
