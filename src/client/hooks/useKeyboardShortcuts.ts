import { useEffect } from 'react'

import type { Block } from '@shared/notebook'
import { useKernelStore } from '@store/kernel.store'
import { useNotebookStore } from '@store/notebook.store'
import { generateId } from '@lib/utils'

const CLIPBOARD_PREFIX = '__typewriter_blocks__:'

function isEditing(): boolean {
  const el = document.activeElement
  if (!el) return false
  return !!(
    el.closest('[contenteditable]') ||
    el.closest('.cm-editor') ||
    el.closest('input') ||
    el.closest('textarea')
  )
}

function getFocusedBlockId(): string | null {
  const el = document.activeElement
  if (!el) return null
  const blockEl = el.closest('[data-block-id]')
  return blockEl?.getAttribute('data-block-id') ?? null
}

function serializeBlocks(blocks: Block[]): string {
  return CLIPBOARD_PREFIX + JSON.stringify(blocks)
}

function deserializeBlocks(text: string): Block[] | null {
  if (!text.startsWith(CLIPBOARD_PREFIX)) return null
  try {
    const blocks = JSON.parse(text.slice(CLIPBOARD_PREFIX.length)) as Block[]
    // Give each block a fresh ID
    return blocks.map((b) => ({
      ...b,
      id: generateId(),
      outputs: undefined,
      executionCount: undefined,
      durationMs: undefined,
    }))
  } catch {
    return null
  }
}

export function useKeyboardShortcuts(
  activeNotebookId: string | null,
  selectedBlockIds: string[],
  clearSelection: () => void
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!activeNotebookId) return
      const mod = e.metaKey || e.ctrlKey

      // --- Run shortcuts (work while editing) ---

      if ((mod && e.key === 'Enter') || (e.shiftKey && e.key === 'Enter')) {
        const blockId = getFocusedBlockId()
        if (!blockId) return

        const notebook = useNotebookStore.getState().notebook
        if (!notebook) return

        const block = notebook.blocks.find((b) => b.id === blockId)
        if (!block) return

        if (block.type === 'code') {
          e.preventDefault()
          useKernelStore.getState().runBlock(activeNotebookId, blockId, block.content)

          if (e.shiftKey && !mod) {
            const idx = notebook.blocks.findIndex((b) => b.id === blockId)
            const next = notebook.blocks[idx + 1]
            if (next) {
              setTimeout(() => {
                const el = document.querySelector(`[data-block-id="${next.id}"]`)
                const focusable = el?.querySelector<HTMLElement>('[contenteditable], .cm-content')
                focusable?.focus()
              }, 100)
            } else {
              const newId = useNotebookStore.getState().addBlock(blockId, 'code')
              setTimeout(() => {
                const el = document.querySelector(`[data-block-id="${newId}"]`)
                const focusable = el?.querySelector<HTMLElement>('.cm-content')
                focusable?.focus()
              }, 100)
            }
          }
          return
        }

        if (block.type === 'shell') {
          e.preventDefault()
          useKernelStore.getState().runShell(activeNotebookId, blockId, block.content)
          return
        }
      }

      // --- Block-level shortcuts (only when blocks are selected OR not editing) ---

      // Cmd+C — copy blocks to system clipboard
      if (mod && e.key === 'c' && selectedBlockIds.length > 0) {
        e.preventDefault()
        const notebook = useNotebookStore.getState().notebook
        if (!notebook) return
        const blocks = notebook.blocks.filter((b) => selectedBlockIds.includes(b.id))
        navigator.clipboard.writeText(serializeBlocks(blocks))
        return
      }

      // Cmd+X — cut blocks
      if (mod && e.key === 'x' && selectedBlockIds.length > 0) {
        e.preventDefault()
        const notebook = useNotebookStore.getState().notebook
        if (!notebook) return
        const blocks = notebook.blocks.filter((b) => selectedBlockIds.includes(b.id))
        navigator.clipboard.writeText(serializeBlocks(blocks))
        useNotebookStore.getState().removeBlocks(selectedBlockIds)
        clearSelection()
        return
      }

      // Cmd+V — paste (blocks or text, unified)
      if (mod && e.key === 'v') {
        // If editing, let native paste handle it first — we intercept in the paste event instead
        if (isEditing()) return

        e.preventDefault()
        navigator.clipboard.readText().then((text) => {
          const blocks = deserializeBlocks(text)
          if (blocks && blocks.length > 0) {
            const notebook = useNotebookStore.getState().notebook
            if (!notebook) return
            const lastSelected = selectedBlockIds[selectedBlockIds.length - 1]
            const focusedBlock = getFocusedBlockId()
            const afterId =
              lastSelected || focusedBlock || notebook.blocks[notebook.blocks.length - 1]?.id
            if (afterId) {
              useNotebookStore.getState().insertBlocksAfter(afterId, blocks)
            }
            clearSelection()
          }
        })
        return
      }

      // Cmd+Z — undo (only when not editing)
      if (mod && e.key === 'z' && !e.shiftKey && !isEditing()) {
        e.preventDefault()
        useNotebookStore.getState().undo()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeNotebookId, selectedBlockIds, clearSelection])
}
