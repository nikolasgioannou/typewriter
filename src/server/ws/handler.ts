import type { ServerWebSocket } from 'bun'

import * as kernel from '@server/kernel/manager'
import type { ClientMessage, ServerMessage } from '@shared/ws'

function send(ws: ServerWebSocket, msg: ServerMessage) {
  ws.send(JSON.stringify(msg))
}

export const wsHandler = {
  async message(ws: ServerWebSocket, raw: string | Buffer) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString()) as ClientMessage
    } catch {
      return
    }

    if (msg.type === 'run') {
      for await (const output of kernel.runCode(msg.notebookId, msg.blockId, msg.code)) {
        if (output.type === 'done') {
          send(ws, {
            type: 'done',
            blockId: msg.blockId,
            executionCount: kernel.getExecutionCount(msg.notebookId, msg.blockId),
            durationMs: output.durationMs,
          })
        } else {
          send(ws, {
            type: 'output',
            blockId: msg.blockId,
            output: {
              type: output.type as 'stdout' | 'stderr' | 'return' | 'error',
              text: output.text ?? '',
              timestamp: Date.now(),
            },
          })
        }
      }
    }

    if (msg.type === 'restart') {
      kernel.restart(msg.notebookId)
      send(ws, { type: 'kernel_ready', notebookId: msg.notebookId })
    }
  },
}
