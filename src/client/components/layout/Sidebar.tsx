import { FileText, Plus } from 'lucide-react'

import { cn } from '@lib/cn'
import { trpc } from '@lib/trpc'
import { useNotebookStore } from '@store/notebook.store'
import { ScrollArea } from '@ui/index'

export function Sidebar() {
  const { activeNotebookId, setActiveNotebook, setNotebook } = useNotebookStore()
  const { data: notebooks } = trpc.notebooks.list.useQuery()
  const createMutation = trpc.notebooks.create.useMutation()
  const utils = trpc.useUtils()

  const handleCreate = async () => {
    const title = `Untitled ${(notebooks?.length ?? 0) + 1}`
    const notebook = await createMutation.mutateAsync({ title })
    await utils.notebooks.list.invalidate()
    setActiveNotebook(notebook.id)
    setNotebook(notebook)
  }

  return (
    <div className="bg-bg-secondary flex h-full w-[220px] flex-col border-r border-border">
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          <button
            onClick={handleCreate}
            className="text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
          >
            <Plus size={16} />
            New notebook
          </button>
          {notebooks?.map((nb) => (
            <button
              key={nb.id}
              onClick={() => setActiveNotebook(nb.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                activeNotebookId === nb.id
                  ? 'bg-bg-tertiary text-fg-primary'
                  : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
              )}
            >
              <FileText size={16} />
              {nb.title}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
