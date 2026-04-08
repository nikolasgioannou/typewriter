import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect } from 'react'

import type { BlockType } from '@shared/notebook'
import { useAutosave } from '@hooks/useAutosave'
import { useBlockFocus } from '@hooks/useBlockFocus'
import { useKernel } from '@hooks/useKernel'
import { trpc } from '@lib/trpc'
import { useKernelStore } from '@store/kernel.store'
import { useNotebookStore } from '@store/notebook.store'

import { BlockWrapper } from './BlockWrapper'
import { CodeBlock } from './blocks/CodeBlock'
import { DividerBlock } from './blocks/DividerBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { TextBlock } from './blocks/TextBlock'

export function Editor() {
  const {
    activeNotebookId,
    notebook,
    setNotebook,
    updateBlock,
    updateTitle,
    addBlock,
    removeBlock,
    reorderBlocks,
  } = useNotebookStore()
  const { runningBlock, runBlock } = useKernelStore()
  const { registerBlock, focusBlock, focusBlockByIndex } = useBlockFocus()

  const { data: notebookData } = trpc.notebooks.byId.useQuery(
    { id: activeNotebookId ?? '' },
    { enabled: !!activeNotebookId }
  )

  useKernel(activeNotebookId)
  useAutosave()

  useEffect(() => {
    if (notebookData && notebookData.id !== notebook?.id) {
      setNotebook(notebookData)
    }
  }, [notebookData, notebook?.id, setNotebook])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  if (!notebook || !activeNotebookId) {
    return (
      <div className="text-fg-tertiary flex h-full items-center justify-center">
        Select or create a notebook to get started
      </div>
    )
  }

  const blockIds = notebook.blocks.map((b) => b.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = blockIds.indexOf(active.id as string)
    const to = blockIds.indexOf(over.id as string)
    if (from !== -1 && to !== -1) {
      reorderBlocks(from, to)
    }
  }

  const handleAddBlock = (afterId: string, type: BlockType) => {
    const newId = addBlock(afterId, type)
    setTimeout(() => focusBlock(newId), 50)
  }

  const handleRemoveBlock = (blockId: string) => {
    const idx = blockIds.indexOf(blockId)
    removeBlock(blockId)
    const prevId = blockIds[idx - 1]
    if (prevId) {
      setTimeout(() => focusBlock(prevId), 50)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pl-14">
      <input
        type="text"
        value={notebook.title}
        onChange={(e) => updateTitle(e.target.value)}
        className="text-fg-primary placeholder:text-fg-tertiary mb-4 w-full bg-transparent text-4xl font-bold outline-none"
        placeholder="Untitled"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {notebook.blocks.map((block) => (
            <BlockWrapper
              key={block.id}
              id={block.id}
              blockType={block.type}
              onChangeType={(type) => updateBlock(block.id, { type, content: '' })}
              onDelete={() => handleRemoveBlock(block.id)}
              onAddBlock={(type) => handleAddBlock(block.id, type)}
              registerRef={(el) => registerBlock(block.id, el)}
            >
              {block.type === 'code' && (
                <CodeBlock
                  content={block.content}
                  outputs={block.outputs ?? []}
                  executionCount={block.executionCount}
                  isRunning={runningBlock === block.id}
                  isStale={false}
                  onChange={(content) => updateBlock(block.id, { content })}
                  onRun={() => runBlock(activeNotebookId, block.id, block.content)}
                />
              )}
              {block.type === 'text' && (
                <TextBlock
                  content={block.content}
                  onChange={(content) => updateBlock(block.id, { content })}
                  onEnter={() => handleAddBlock(block.id, 'text')}
                  onBackspace={() => handleRemoveBlock(block.id)}
                />
              )}
              {(block.type === 'heading1' ||
                block.type === 'heading2' ||
                block.type === 'heading3') && (
                <HeadingBlock
                  content={block.content}
                  level={block.type}
                  onChange={(content) => updateBlock(block.id, { content })}
                  onEnter={() => handleAddBlock(block.id, 'text')}
                  onBackspace={() => {
                    focusBlockByIndex(blockIds, block.id, 'up')
                  }}
                />
              )}
              {block.type === 'divider' && <DividerBlock />}
            </BlockWrapper>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
