import { useEffect } from 'react'

import { useKernelStore } from '@store/kernel.store'
import { useNotebookStore } from '@store/notebook.store'

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

export function useKeyboardShortcuts(
  activeNotebookId: string | null,
  selectedBlockIds: string[],
  clearSelection: () => void
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!activeNotebookId) return
      const mod = e.metaKey || e.ctrlKey

      // Cmd+Enter or Shift+Enter — run current block
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

          // Shift+Enter: advance to next block or create new one
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

      // Block-level shortcuts — only when blocks are selected (not editing)
      if (selectedBlockIds.length > 0) {
        // Cmd+C — copy selected blocks
        if (mod && e.key === 'c') {
          e.preventDefault()
          useNotebookStore.getState().copyBlocks(selectedBlockIds)
          return
        }

        // Cmd+X — cut selected blocks
        if (mod && e.key === 'x') {
          e.preventDefault()
          useNotebookStore.getState().cutBlocks(selectedBlockIds)
          clearSelection()
          return
        }
      }

      // Cmd+V — paste blocks (only when not editing)
      if (mod && e.key === 'v' && !isEditing()) {
        const { blockClipboard } = useNotebookStore.getState()
        if (blockClipboard.length > 0) {
          e.preventDefault()
          const lastSelected = selectedBlockIds[selectedBlockIds.length - 1]
          const focusedBlock = getFocusedBlockId()
          useNotebookStore.getState().pasteBlocks(lastSelected || focusedBlock || undefined)
          clearSelection()
          return
        }
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
