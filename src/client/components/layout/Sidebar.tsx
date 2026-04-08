import { Button, ScrollArea } from '@ui/index'
import { cn } from '@lib/cn'
import { trpc } from '@lib/trpc'
import { useNotebookStore } from '@store/notebook.store'

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

  const handleSelect = async (id: string) => {
    setActiveNotebook(id)
  }

  return (
    <div className="border-border bg-bg-secondary flex h-full w-[220px] flex-col border-r">
      <div className="flex items-center justify-between p-3">
        <span className="text-fg-primary text-sm font-semibold">Notebooks</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 px-2">
          {notebooks?.map((nb) => (
            <button
              key={nb.id}
              onClick={() => handleSelect(nb.id)}
              className={cn(
                'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                activeNotebookId === nb.id
                  ? 'bg-bg-tertiary text-fg-primary'
                  : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
              )}
            >
              {nb.title}
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2">
        <Button variant="ghost" size="sm" className="w-full" onClick={handleCreate}>
          + New notebook
        </Button>
      </div>
    </div>
  )
}
