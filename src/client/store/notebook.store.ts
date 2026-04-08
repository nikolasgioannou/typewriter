import type { Block, BlockType, Notebook } from '@shared/notebook'
import { create } from 'zustand'

import { generateId } from '@lib/utils'

interface NotebookState {
  activeNotebookId: string | null
  notebook: Notebook | null
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null

  setActiveNotebook: (id: string | null) => void
  setNotebook: (notebook: Notebook | null) => void
  updateBlock: (blockId: string, updates: Partial<Block>) => void
  addBlock: (afterBlockId: string, type: BlockType) => string
  removeBlock: (blockId: string) => void
  reorderBlocks: (fromIndex: number, toIndex: number) => void
  updateTitle: (title: string) => void
  markSaving: () => void
  markSaved: () => void
  markDirty: () => void
}

export const useNotebookStore = create<NotebookState>((set) => ({
  activeNotebookId: null,
  notebook: null,
  isDirty: false,
  isSaving: false,
  lastSaved: null,

  setActiveNotebook: (id) => set({ activeNotebookId: id }),

  setNotebook: (notebook) => set({ notebook, isDirty: false }),

  updateBlock: (blockId, updates) =>
    set((state) => {
      if (!state.notebook) return state
      return {
        notebook: {
          ...state.notebook,
          blocks: state.notebook.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
        },
        isDirty: true,
      }
    }),

  addBlock: (afterBlockId, type) => {
    const newId = generateId()
    set((state) => {
      if (!state.notebook) return state
      const index = state.notebook.blocks.findIndex((b) => b.id === afterBlockId)
      const newBlock: Block = { id: newId, type, content: '' }
      const blocks = [...state.notebook.blocks]
      blocks.splice(index + 1, 0, newBlock)
      return { notebook: { ...state.notebook, blocks }, isDirty: true }
    })
    return newId
  },

  removeBlock: (blockId) =>
    set((state) => {
      if (!state.notebook || state.notebook.blocks.length <= 1) return state
      return {
        notebook: {
          ...state.notebook,
          blocks: state.notebook.blocks.filter((b) => b.id !== blockId),
        },
        isDirty: true,
      }
    }),

  reorderBlocks: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.notebook) return state
      const blocks = [...state.notebook.blocks]
      const [moved] = blocks.splice(fromIndex, 1)
      if (!moved) return state
      blocks.splice(toIndex, 0, moved)
      return { notebook: { ...state.notebook, blocks }, isDirty: true }
    }),

  updateTitle: (title) =>
    set((state) => {
      if (!state.notebook) return state
      return { notebook: { ...state.notebook, title }, isDirty: true }
    }),

  markSaving: () => set({ isSaving: true }),
  markSaved: () => set({ isSaving: false, isDirty: false, lastSaved: new Date() }),
  markDirty: () => set({ isDirty: true }),
}))
