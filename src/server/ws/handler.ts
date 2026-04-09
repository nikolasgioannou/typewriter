import type { ServerWebSocket } from 'bun'

import * as kernel from '@server/kernel/manager'
import type { KernelOutput } from '@server/kernel/manager'
import type { ClientMessage, ServerMessage } from '@shared/ws'

function send(ws: ServerWebSocket, msg: ServerMessage) {
  ws.send(JSON.stringify(msg))
}

async function streamOutputs(
  ws: ServerWebSocket,
  blockId: string,
  outputs: AsyncGenerator<KernelOutput>,
  getExecutionCount?: () => number
) {
  try {
    for await (const output of outputs) {
      if (output.type === 'done') {
        send(ws, {
          type: 'done',
          blockId,
          executionCount: getExecutionCount?.() ?? 0,
          durationMs: output.durationMs,
        })
      } else {
        send(ws, {
          type: 'output',
          blockId,
          output: {
            type: output.type as 'stdout' | 'stderr' | 'return' | 'error',
            text: output.text ?? '',
            timestamp: Date.now(),
          },
        })
      }
    }
  } catch (err) {
    send(ws, {
      type: 'error',
      blockId,
      error: err instanceof Error ? err.message : 'Kernel error',
    })
  }
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
      await streamOutputs(
        ws,
        msg.blockId,
        kernel.runCode(msg.notebookId, msg.blockId, msg.code),
        () => kernel.getExecutionCount(msg.notebookId, msg.blockId)
      )
    }

    if (msg.type === 'shell') {
      await streamOutputs(
        ws,
        msg.blockId,
        kernel.runShell(msg.notebookId, msg.blockId, msg.command)
      )
    }

    if (msg.type === 'eval') {
      let gotData = false
      try {
        for await (const output of kernel.runCode(
          msg.notebookId,
          msg.blockId,
          `__tw[${JSON.stringify(msg.expression)}]`
        )) {
          if (output.type === 'return' && output.text) {
            gotData = true
            try {
              send(ws, { type: 'data', blockId: msg.blockId, data: JSON.parse(output.text) })
            } catch {
              send(ws, { type: 'data', blockId: msg.blockId, data: output.text })
            }
          }
          if (output.type === 'error') {
            gotData = true
            send(ws, { type: 'error', blockId: msg.blockId, error: output.text ?? 'Unknown error' })
          }
        }
      } catch (err) {
        gotData = true
        send(ws, {
          type: 'error',
          blockId: msg.blockId,
          error: err instanceof Error ? err.message : 'Eval error',
        })
      }
      if (!gotData) {
        send(ws, { type: 'data', blockId: msg.blockId, data: null })
      }
    }

    if (msg.type === 'list_vars') {
      const listCode = `Object.keys(globalThis).filter(k => !__builtinKeys.has(k) && !k.startsWith('__') && k !== 'require')`
      try {
        for await (const output of kernel.runCode(msg.notebookId, msg.blockId, listCode)) {
          if (output.type === 'return' && output.text) {
            try {
              send(ws, {
                type: 'vars',
                blockId: msg.blockId,
                vars: JSON.parse(output.text) as string[],
              })
            } catch {
              send(ws, { type: 'vars', blockId: msg.blockId, vars: [] })
            }
          }
        }
      } catch {
        send(ws, { type: 'vars', blockId: msg.blockId, vars: [] })
      }
    }

    if (msg.type === 'restart') {
      await kernel.restart(msg.notebookId)
      send(ws, { type: 'kernel_ready', notebookId: msg.notebookId })
    }
  },
}
