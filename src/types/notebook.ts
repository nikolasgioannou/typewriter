export type BlockType = 'text' | 'heading1' | 'heading2' | 'heading3' | 'code' | 'divider'

export type OutputType = 'stdout' | 'stderr' | 'return' | 'error'

export interface Output {
  type: OutputType
  text: string
  timestamp: number
}

export interface Block {
  id: string
  type: BlockType
  content: string
  outputs?: Output[]
  executionCount?: number
  durationMs?: number
}

export interface Notebook {
  id: string
  title: string
  created: number
  updated: number
  blocks: Block[]
}
