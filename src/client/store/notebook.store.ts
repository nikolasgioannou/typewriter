import type { Block, BlockType, Notebook } from '@shared/notebook'
import { create } from 'zustand'

import { generateId } from '@lib/utils'

const MAX_HISTORY = 50
const DEBOUNCE_MS = 500

interface NotebookState {
  activeNotebookId: string | null
  notebook: Notebook | null
  isDirty: boolean
  history: Block[][]

  setActiveNotebook: (id: string | null) => void
  setNotebook: (notebook: Notebook | null) => void
  updateBlock: (blockId: string, updates: Partial<Block>) => void
  addBlock: (afterBlockId: string, type: BlockType) => string
  appendBlock: (type: BlockType) => string
  insertBlocksAfter: (afterBlockId: string, blocks: Block[]) => void
  removeBlock: (blockId: string) => void
  removeBlocks: (blockIds: string[]) => void
  reorderBlocks: (fromIndex: number, toIndex: number) => void
  updateTitle: (title: string) => void
  undo: () => void
}

function pushHistory(state: NotebookState): Block[][] {
  if (!state.notebook) return state.history
  const history = [...state.history, state.notebook.blocks.map((b) => ({ ...b }))]
  if (history.length > MAX_HISTORY) history.shift()
  return history
}

// Debounce timer for content edits — pushes a snapshot before first edit in a batch
let contentEditTimer: ReturnType<typeof setTimeout> | null = null
let lastSnapshotPushed = false

export const useNotebookStore = create<NotebookState>((set) => ({
  activeNotebookId: null,
  notebook: null,
  isDirty: false,
  history: [],

  setActiveNotebook: (id) => {
    set({ activeNotebookId: id })
    const path = id ? `/${id}` : '/'
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
  },

  setNotebook: (notebook) => {
    lastSnapshotPushed = false
    set({ notebook, isDirty: false, history: [] })
  },

  updateBlock: (blockId, updates) =>
    set((state) => {
      if (!state.notebook) return state

      // Push a snapshot before the first edit in a typing batch
      let history = state.history
      if (!lastSnapshotPushed) {
        history = pushHistory(state)
        lastSnapshotPushed = true
      }

      // Reset the debounce timer — after DEBOUNCE_MS of no edits, allow next snapshot
      if (contentEditTimer) clearTimeout(contentEditTimer)
      contentEditTimer = setTimeout(() => {
        lastSnapshotPushed = false
      }, DEBOUNCE_MS)

      return {
        notebook: {
          ...state.notebook,
          blocks: state.notebook.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
        },
        isDirty: true,
        history,
      }
    }),

  addBlock: (afterBlockId, type) => {
    const newId = generateId()
    lastSnapshotPushed = false
    set((state) => {
      if (!state.notebook) return state
      const index = state.notebook.blocks.findIndex((b) => b.id === afterBlockId)
      const newBlock: Block = { id: newId, type, content: '' }
      const blocks = [...state.notebook.blocks]
      blocks.splice(index + 1, 0, newBlock)
      return {
        notebook: { ...state.notebook, blocks },
        isDirty: true,
        history: pushHistory(state),
      }
    })
    return newId
  },

  appendBlock: (type) => {
    const newId = generateId()
    lastSnapshotPushed = false
    set((state) => {
      if (!state.notebook) return state
      const newBlock: Block = { id: newId, type, content: '' }
      return {
        notebook: { ...state.notebook, blocks: [...state.notebook.blocks, newBlock] },
        isDirty: true,
        history: pushHistory(state),
      }
    })
    return newId
  },

  insertBlocksAfter: (afterBlockId, newBlocks) => {
    lastSnapshotPushed = false
    set((state) => {
      if (!state.notebook) return state
      const index = state.notebook.blocks.findIndex((b) => b.id === afterBlockId)
      const blocks = [...state.notebook.blocks]
      blocks.splice(index + 1, 0, ...newBlocks)
      return {
        notebook: { ...state.notebook, blocks },
        isDirty: true,
        history: pushHistory(state),
      }
    })
  },

  removeBlock: (blockId) => {
    lastSnapshotPushed = false
    set((state) => {
      if (!state.notebook) return state
      return {
        notebook: {
          ...state.notebook,
          blocks: state.notebook.blocks.filter((b) => b.id !== blockId),
        },
        isDirty: true,
        history: pushHistory(state),
      }
    })
  },

  removeBlocks: (blockIds) => {
    lastSnapshotPushed = false
    set((state) => {
      if (!state.notebook) return state
      return {
        notebook: {
          ...state.notebook,
          blocks: state.notebook.blocks.filter((b) => !blockIds.includes(b.id)),
        },
        isDirty: true,
        history: pushHistory(state),
      }
    })
  },

  reorderBlocks: (fromIndex, toIndex) => {
    lastSnapshotPushed = false
    set((state) => {
      if (!state.notebook) return state
      const blocks = [...state.notebook.blocks]
      const [moved] = blocks.splice(fromIndex, 1)
      if (!moved) return state
      blocks.splice(toIndex, 0, moved)
      return {
        notebook: { ...state.notebook, blocks },
        isDirty: true,
        history: pushHistory(state),
      }
    })
  },

  updateTitle: (title) =>
    set((state) => {
      if (!state.notebook) return state
      return { notebook: { ...state.notebook, title }, isDirty: true }
    }),

  undo: () => {
    lastSnapshotPushed = false
    if (contentEditTimer) clearTimeout(contentEditTimer)
    set((state) => {
      if (!state.notebook || state.history.length === 0) return state
      const history = [...state.history]
      const previousBlocks = history.pop()
      if (!previousBlocks) return state
      return {
        notebook: { ...state.notebook, blocks: previousBlocks },
        isDirty: true,
        history,
      }
    })
  },
}))
