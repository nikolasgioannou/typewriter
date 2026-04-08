import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useCallback, useEffect, useRef } from 'react'

import type { BlockType } from '@shared/notebook'
import { useAutosave } from '@hooks/useAutosave'
import { useBlockFocus } from '@hooks/useBlockFocus'
import { useBlockSelection } from '@hooks/useBlockSelection'
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
    appendBlock,
    removeBlock,
    reorderBlocks,
  } = useNotebookStore()
  const { runningBlock, runBlock } = useKernelStore()
  const { registerBlock, focusBlock, blockRefsMap } = useBlockFocus()
  const { selectedIds, clearSelection, handleMouseDown, selectionOverlayStyle } =
    useBlockSelection(blockRefsMap)
  const titleRef = useRef<HTMLInputElement>(null)

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

  // Delete selected blocks on Backspace/Delete, clear on Escape
  useEffect(() => {
    if (selectedIds.size === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        for (const id of selectedIds) {
          removeBlock(id)
        }
        clearSelection()
      }
      if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, removeBlock, clearSelection])

  // Clear selection when clicking into a block's editable area
  useEffect(() => {
    if (selectedIds.size === 0) return

    const handleFocusIn = () => {
      clearSelection()
    }

    window.addEventListener('focusin', handleFocusIn)
    return () => window.removeEventListener('focusin', handleFocusIn)
  }, [selectedIds, clearSelection])

  const handleClickBelow = useCallback(() => {
    if (!notebook) return

    const lastBlock = notebook.blocks[notebook.blocks.length - 1]

    if (
      lastBlock &&
      lastBlock.type === 'text' &&
      !lastBlock.content.replace(/<[^>]*>/g, '').trim()
    ) {
      focusBlock(lastBlock.id)
      return
    }

    const newId = appendBlock('text')
    setTimeout(() => focusBlock(newId), 100)
  }, [notebook, appendBlock, focusBlock])

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
    setTimeout(() => focusBlock(newId), 100)
  }

  const handleRemoveBlock = (blockId: string) => {
    const idx = blockIds.indexOf(blockId)
    removeBlock(blockId)
    const prevId = blockIds[idx - 1]
    if (prevId) {
      setTimeout(() => focusBlock(prevId), 100)
    } else {
      setTimeout(() => {
        titleRef.current?.focus()
        const len = titleRef.current?.value.length ?? 0
        titleRef.current?.setSelectionRange(len, len)
      }, 100)
    }
  }

  return (
    <div
      className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-8 pl-14"
      onMouseDown={handleMouseDown}
    >
      <input
        ref={titleRef}
        type="text"
        value={notebook.title}
        onChange={(e) => updateTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const input = e.currentTarget
            const pos = input.selectionStart ?? notebook.title.length
            const before = notebook.title.slice(0, pos)
            const after = notebook.title.slice(pos)
            updateTitle(before)
            const newId = appendBlock('text')
            const blocks = useNotebookStore.getState().notebook?.blocks
            if (blocks) {
              reorderBlocks(blocks.length - 1, 0)
            }
            if (after) {
              updateBlock(newId, { content: after })
            }
            setTimeout(() => focusBlock(newId), 100)
          }
        }}
        className="text-fg-primary placeholder:text-fg-tertiary mb-4 w-full bg-transparent text-4xl font-bold"
        placeholder="Untitled"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {notebook.blocks.map((block) => (
            <BlockWrapper
              key={block.id}
              id={block.id}
              isSelected={selectedIds.has(block.id)}
              registerRef={(el) => registerBlock(block.id, el)}
            >
              {block.type === 'code' && (
                <CodeBlock
                  content={block.content}
                  outputs={block.outputs ?? []}
                  executionCount={block.executionCount}
                  isRunning={runningBlock === block.id}
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
                  onSlashSelect={(type) => updateBlock(block.id, { type, content: '' })}
                />
              )}
              {(block.type === 'heading1' ||
                block.type === 'heading2' ||
                block.type === 'heading3') && (
                <HeadingBlock
                  content={block.content}
                  level={block.type as 'heading1' | 'heading2' | 'heading3'}
                  onChange={(content) => updateBlock(block.id, { content })}
                  onEnter={() => handleAddBlock(block.id, 'text')}
                  onBackspace={() => handleRemoveBlock(block.id)}
                />
              )}
              {block.type === 'divider' && <DividerBlock />}
            </BlockWrapper>
          ))}
        </SortableContext>
      </DndContext>

      <div className="min-h-32 flex-1 cursor-text" onClick={handleClickBelow} />

      {selectionOverlayStyle && <div style={selectionOverlayStyle} />}
    </div>
  )
}
