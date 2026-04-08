import { Ellipsis, FileText, Plus, Trash2 } from 'lucide-react'

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
  ScrollArea,
} from '@ui/index'

function NotebookMenu({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem className="text-kernel-error" onClick={onDelete}>
          <Trash2 size={14} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Sidebar() {
  const { activeNotebookId, setActiveNotebook, setNotebook } = useNotebookStore()
  const { data: notebooks } = trpc.notebooks.list.useQuery()
  const createMutation = trpc.notebooks.create.useMutation()
  const deleteMutation = trpc.notebooks.delete.useMutation()
  const utils = trpc.useUtils()

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
      <ScrollArea className="flex-1">
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
                    'group flex w-full items-center rounded-md text-sm transition-colors',
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
                    <span className={cn('truncate', !nb.title && 'text-fg-tertiary')}>
                      {nb.title || 'New notebook'}
                    </span>
                  </button>
                  <NotebookMenu onDelete={() => handleDelete(nb.id)}>
                    <IconButton className="mr-1 shrink-0 opacity-0 group-hover:opacity-100">
                      <Ellipsis size={14} />
                    </IconButton>
                  </NotebookMenu>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem className="text-kernel-error" onClick={() => handleDelete(nb.id)}>
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
