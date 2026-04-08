import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import type { Output } from '@shared/notebook'
import { cn } from '@lib/cn'
import { IconButton } from '@ui/index'

const outputTypeLabel: Record<string, string> = {
  stdout: 'out',
  stderr: 'err',
  return: 'return',
  error: 'error',
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

interface OutputPanelProps {
  outputs: Output[]
  durationMs?: number
}

export function OutputPanel({ outputs, durationMs }: OutputPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const lineCount = useMemo(
    () => outputs.reduce((sum, o) => sum + (o.text.match(/\n/g)?.length ?? 0) + 1, 0),
    [outputs]
  )

  const fullText = useMemo(() => outputs.map((o) => o.text).join('\n'), [outputs])

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    },
    [fullText]
  )

  return (
    <div className="border-border border-t">
      <button
        className="text-fg-tertiary hover:text-fg-secondary flex w-full items-center gap-1 px-3 py-1.5 text-xs"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        <span>Output</span>
        {lineCount > 1 && <span className="text-fg-tertiary">({lineCount} lines)</span>}
        <span className="flex-1" />
        {durationMs != null && (
          <span className="text-fg-tertiary mr-2">{formatDuration(durationMs)}</span>
        )}
        <IconButton size="sm" onClick={handleCopy}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </IconButton>
      </button>
      {!collapsed && (
        <div className="max-h-64 overflow-y-auto px-3 pb-2">
          {outputs.map((output, i) => (
            <div key={i} className="flex items-baseline gap-2 py-0.5 font-mono text-xs">
              <span
                className={cn(
                  'w-12 shrink-0 text-right',
                  output.type === 'error' || output.type === 'stderr'
                    ? 'text-kernel-error'
                    : 'text-fg-tertiary'
                )}
              >
                {outputTypeLabel[output.type]}
              </span>
              <pre
                className={cn(
                  'flex-1 break-all whitespace-pre-wrap',
                  output.type === 'error' ? 'text-kernel-error' : 'text-fg-primary'
                )}
              >
                {output.text}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
