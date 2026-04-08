import type { Output } from '@shared/notebook'
import type { ClientMessage, ServerMessage } from '@shared/ws'
import { create } from 'zustand'

import { useNotebookStore } from '@store/notebook.store'

type KernelStatus = 'ready' | 'running' | 'error'

interface KernelState {
  status: Record<string, KernelStatus>
  runningBlock: string | null
  ws: WebSocket | null

  connect: (notebookId: string) => void
  disconnect: () => void
  runBlock: (notebookId: string, blockId: string, code: string) => void
  runAll: (notebookId: string) => void
  restartKernel: (notebookId: string) => void
  setStatus: (notebookId: string, status: KernelStatus) => void
}

function getWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export const useKernelStore = create<KernelState>((set, get) => ({
  status: {},
  runningBlock: null,
  ws: null,

  connect: (notebookId: string) => {
    const existing = get().ws
    if (existing && existing.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(getWsUrl())

    ws.onopen = () => {
      set((state) => ({ status: { ...state.status, [notebookId]: 'ready' } }))
    }

    ws.onmessage = (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(event.data as string) as ServerMessage
      } catch {
        return
      }
      const notebookStore = useNotebookStore.getState()

      if (msg.type === 'output') {
        const block = notebookStore.notebook?.blocks.find((b) => b.id === msg.blockId)
        if (block) {
          const outputs: Output[] = [...(block.outputs ?? []), msg.output]
          notebookStore.updateBlock(msg.blockId, { outputs })
        }
      }

      if (msg.type === 'done') {
        notebookStore.updateBlock(msg.blockId, { executionCount: msg.executionCount })
        set((state) => ({ runningBlock: null, status: { ...state.status, [notebookId]: 'ready' } }))
      }

      if (msg.type === 'error') {
        const errorOutput: Output = {
          type: 'error',
          text: msg.error,
          timestamp: Date.now(),
        }
        const block = notebookStore.notebook?.blocks.find((b) => b.id === msg.blockId)
        if (block) {
          const outputs: Output[] = [...(block.outputs ?? []), errorOutput]
          notebookStore.updateBlock(msg.blockId, { outputs })
        }
        set((state) => ({
          runningBlock: null,
          status: { ...state.status, [notebookId]: 'ready' },
        }))
      }

      if (msg.type === 'kernel_ready') {
        set((state) => ({ status: { ...state.status, [msg.notebookId]: 'ready' } }))
      }
    }

    ws.onerror = () => {
      set((state) => ({ status: { ...state.status, [notebookId]: 'error' } }))
    }

    ws.onclose = () => {
      set((state) => ({
        ws: null,
        runningBlock: null,
        status: { ...state.status, [notebookId]: 'error' },
      }))
    }

    set({ ws })
  },

  disconnect: () => {
    const { ws } = get()
    ws?.close()
    set({ ws: null })
  },

  runBlock: (notebookId, blockId, code) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    useNotebookStore.getState().updateBlock(blockId, { outputs: [] })
    set((state) => ({
      runningBlock: blockId,
      status: { ...state.status, [notebookId]: 'running' },
    }))

    const msg: ClientMessage = { type: 'run', notebookId, blockId, code }
    ws.send(JSON.stringify(msg))
  },

  runAll: (notebookId) => {
    const notebook = useNotebookStore.getState().notebook
    if (!notebook) return

    const codeBlocks = notebook.blocks.filter((b) => b.type === 'code' && b.content.trim())
    if (codeBlocks.length === 0) return

    let idx = 0

    const runNext = () => {
      const block = codeBlocks[idx]
      if (!block) return

      get().runBlock(notebookId, block.id, block.content)

      const unsub = useKernelStore.subscribe((state) => {
        if (state.runningBlock === null) {
          unsub()
          idx++
          if (idx < codeBlocks.length) {
            runNext()
          }
        }
      })
    }

    runNext()
  },

  restartKernel: (notebookId) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const msg: ClientMessage = { type: 'restart', notebookId }
    ws.send(JSON.stringify(msg))
  },

  setStatus: (notebookId, status) =>
    set((state) => ({ status: { ...state.status, [notebookId]: status } })),
}))
