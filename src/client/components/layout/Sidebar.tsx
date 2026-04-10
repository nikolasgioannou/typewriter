import { Copy, Ellipsis, FileText, Plus, Trash2 } from 'lucide-react'

import { cn } from '@lib/cn'
import { trpc } from '@lib/trpc'
import { useNotebookStore } from '@store/notebook.store'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
} from '@ui/index'

function NotebookMenu({
  onDuplicate,
  onDelete,
  children,
}: {
  onDuplicate: () => void
  onDelete: () => void
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy size={14} className="mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem className="text-kernel-error" onClick={onDelete}>
          <Trash2 size={14} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Sidebar() {
  const {
    activeNotebookId,
    setActiveNotebook,
    setNotebook,
    notebook: activeNotebook,
  } = useNotebookStore()
  const { data: notebooks } = trpc.notebooks.list.useQuery()
  const createMutation = trpc.notebooks.create.useMutation()
  const duplicateMutation = trpc.notebooks.duplicate.useMutation()
  const deleteMutation = trpc.notebooks.delete.useMutation()
  const utils = trpc.useUtils()

  const handleDuplicate = async (id: string) => {
    const notebook = await duplicateMutation.mutateAsync({ id })
    await utils.notebooks.list.invalidate()
    setActiveNotebook(notebook.id)
    setNotebook(notebook)
  }

  const handleCreate = async () => {
    const title = ''
    const notebook = await createMutation.mutateAsync({ title })
    await utils.notebooks.list.invalidate()
    setActiveNotebook(notebook.id)
    setNotebook(notebook)
  }

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
    await utils.notebooks.list.invalidate()
    if (activeNotebookId === id) {
      setActiveNotebook(null)
      setNotebook(null)
    }
  }

  return (
    <div className="bg-bg-secondary border-border flex h-full w-[220px] flex-col border-r">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0.5 p-2">
          <button
            onClick={handleCreate}
            className="text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
          >
            <Plus size={16} className="shrink-0" />
            New notebook
          </button>
          {notebooks?.map((nb) => (
            <ContextMenu key={nb.id}>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    'group flex w-full min-w-0 items-center rounded-md text-sm transition-colors',
                    activeNotebookId === nb.id
                      ? 'bg-bg-tertiary text-fg-primary'
                      : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
                  )}
                >
                  <button
                    onClick={() => setActiveNotebook(nb.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5"
                  >
                    <FileText size={16} className="shrink-0" />
                    <span
                      className={cn(
                        'truncate',
                        !(activeNotebookId === nb.id ? activeNotebook?.title : nb.title) &&
                          'text-fg-tertiary'
                      )}
                    >
                      {(activeNotebookId === nb.id ? activeNotebook?.title : nb.title) ||
                        'New notebook'}
                    </span>
                  </button>
                  <NotebookMenu
                    onDuplicate={() => handleDuplicate(nb.id)}
                    onDelete={() => handleDelete(nb.id)}
                  >
                    <IconButton className="mr-1 shrink-0 opacity-0 group-hover:opacity-100">
                      <Ellipsis size={14} />
                    </IconButton>
                  </NotebookMenu>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleDuplicate(nb.id)}>
                  <Copy size={14} className="mr-2" />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuItem className="text-kernel-error" onClick={() => handleDelete(nb.id)}>
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
    </div>
  )
}
