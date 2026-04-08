import type { Output } from './notebook'

export type ClientMessage =
  | { type: 'run'; notebookId: string; blockId: string; code: string }
  | { type: 'shell'; notebookId: string; blockId: string; command: string }
  | { type: 'eval'; notebookId: string; blockId: string; expression: string }
  | { type: 'list_vars'; notebookId: string; blockId: string }
  | { type: 'restart'; notebookId: string }

export type ServerMessage =
  | { type: 'output'; blockId: string; output: Output }
  | { type: 'done'; blockId: string; executionCount: number; durationMs?: number }
  | { type: 'error'; blockId: string; error: string }
  | { type: 'data'; blockId: string; data: unknown }
  | { type: 'vars'; blockId: string; vars: string[] }
  | { type: 'kernel_ready'; notebookId: string }
