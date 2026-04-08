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
import { useInputMode } from '@hooks/useInputMode'
import { useKernel } from '@hooks/useKernel'
import { cn } from '@lib/cn'
import { trpc } from '@lib/trpc'
import { useKernelStore } from '@store/kernel.store'
import { useNotebookStore } from '@store/notebook.store'

import { BlockWrapper } from './BlockWrapper'
import { CodeBlock } from './blocks/CodeBlock'
import { DividerBlock } from './blocks/DividerBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { TextBlock } from './blocks/TextBlock'

const FOCUS_DELAY = 100

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
  const { registerBlock, focusBlock } = useBlockFocus()
  const editorRef = useRef<HTMLDivElement>(null)
  const { selectedBlockIds, clearSelection, handleEditorMouseDown, lassoBox, hasSelection } =
    useBlockSelection(editorRef)
  const isTyping = useInputMode()
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

  // Keyboard: delete selected blocks, escape to clear
  useEffect(() => {
    if (selectedBlockIds.length === 0) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        clearSelection()
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        for (const id of selectedBlockIds) {
          removeBlock(id)
        }
        clearSelection()
        // Focus title after bulk delete
        setTimeout(() => {
          titleRef.current?.focus()
        }, FOCUS_DELAY)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBlockIds, removeBlock, clearSelection])

  // Clear selection when focusing into a block
  useEffect(() => {
    if (selectedBlockIds.length === 0) return

    function handleFocusIn() {
      clearSelection()
    }

    window.addEventListener('focusin', handleFocusIn)
    return () => window.removeEventListener('focusin', handleFocusIn)
  }, [selectedBlockIds, clearSelection])

  const handleClickBelow = useCallback(() => {
    clearSelection()
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
    setTimeout(() => focusBlock(newId), FOCUS_DELAY)
  }, [notebook, appendBlock, focusBlock, clearSelection])

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
    setTimeout(() => focusBlock(newId), FOCUS_DELAY)
  }

  const handleRemoveBlock = (blockId: string) => {
    const idx = blockIds.indexOf(blockId)
    removeBlock(blockId)
    const prevId = blockIds[idx - 1]
    if (prevId) {
      setTimeout(() => focusBlock(prevId), FOCUS_DELAY)
    } else {
      setTimeout(() => {
        titleRef.current?.focus()
        const len = titleRef.current?.value.length ?? 0
        titleRef.current?.setSelectionRange(len, len)
      }, FOCUS_DELAY)
    }
  }

  return (
    <div
      ref={editorRef}
      className={cn('flex min-h-full flex-col', (hasSelection || lassoBox) && 'select-none')}
      onMouseDown={handleEditorMouseDown}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
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
              setTimeout(() => focusBlock(newId), FOCUS_DELAY)
            }
          }}
          className="text-fg-primary placeholder:text-fg-tertiary mb-4 w-full bg-transparent pl-9 text-4xl font-bold"
          placeholder="Untitled"
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {notebook.blocks.map((block) => (
                <BlockWrapper
                  key={block.id}
                  id={block.id}
                  isSelected={selectedBlockIds.includes(block.id)}
                  hideHandle={isTyping}
                  registerRef={(el) => registerBlock(block.id, el)}
                >
                  {block.type === 'code' && (
                    <CodeBlock
                      content={block.content}
                      outputs={block.outputs ?? []}
                      executionCount={block.executionCount}
                      durationMs={block.durationMs}
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
                      onSlashSelect={(type) => {
                        updateBlock(block.id, { type, content: '' })
                        setTimeout(() => focusBlock(block.id), FOCUS_DELAY)
                      }}
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
            </div>
          </SortableContext>
        </DndContext>
        <div
          className="min-h-32 flex-1 cursor-text"
          onMouseDown={(e) => {
            ;(e.currentTarget as HTMLElement).dataset.mouseDownX = String(e.clientX)
            ;(e.currentTarget as HTMLElement).dataset.mouseDownY = String(e.clientY)
          }}
          onMouseUp={(e) => {
            const startX = Number(e.currentTarget.dataset.mouseDownX ?? 0)
            const startY = Number(e.currentTarget.dataset.mouseDownY ?? 0)
            const distance = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY)
            if (distance < 5) {
              handleClickBelow()
            }
          }}
        />
      </div>

      {lassoBox && (
        <div
          className="bg-accent/10 border-accent/30 pointer-events-none fixed z-40 rounded-sm border"
          style={{
            left: lassoBox.left,
            top: lassoBox.top,
            width: lassoBox.right - lassoBox.left,
            height: lassoBox.bottom - lassoBox.top,
          }}
        />
      )}
    </div>
  )
}
