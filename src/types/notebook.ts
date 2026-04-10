export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'code'
  | 'shell'
  | 'display'
  | 'divider'

export type ChartType = 'table' | 'line' | 'bar' | 'area' | 'scatter' | 'pie'

export interface DisplayConfig {
  variable: string
  chartType: ChartType
  xKey?: string
  yKey?: string
}

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
  displayConfig?: DisplayConfig
}

export interface Notebook {
  id: string
  title: string
  created: number
  updated: number
  blocks: Block[]
}
