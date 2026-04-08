import type { Output } from './notebook'

export type ClientMessage =
  | { type: 'run'; notebookId: string; blockId: string; code: string }
  | { type: 'restart'; notebookId: string }

export type ServerMessage =
  | { type: 'output'; blockId: string; output: Output }
  | { type: 'done'; blockId: string; executionCount: number }
  | { type: 'error'; blockId: string; error: string }
  | { type: 'kernel_ready'; notebookId: string }
