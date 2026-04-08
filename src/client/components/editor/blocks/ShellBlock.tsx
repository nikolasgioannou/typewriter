import { Terminal } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

import type { Output } from '@shared/notebook'
import { Button } from '@ui/index'

import { OutputPanel } from './OutputPanel'

interface ShellBlockProps {
  content: string
  outputs: Output[]
  durationMs?: number
  isRunning: boolean
  onChange: (content: string) => void
  onRun: () => void
}

export function ShellBlock({
  content,
  outputs,
  durationMs,
  isRunning,
  onChange,
  onRun,
}: ShellBlockProps) {
  const editableRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)

  const handleInput = useCallback(() => {
    if (isComposing.current) return
    onChange(editableRef.current?.textContent ?? '')
  }, [onChange])

  useEffect(() => {
    if (editableRef.current && editableRef.current.textContent !== content) {
      editableRef.current.textContent = content
    }
  }, [content])

  return (
    <div className="border-border bg-bg-secondary overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-fg-tertiary" />
          <span className="text-fg-tertiary font-mono text-xs">shell</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isRunning ? 'ghost' : 'default'}
            disabled={isRunning}
            onClick={onRun}
          >
            {isRunning ? '● running' : 'Run'}
          </Button>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-fg-tertiary">$</span>
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            className="text-fg-primary min-h-[1.5em] flex-1"
            onInput={handleInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            onCompositionStart={() => {
              isComposing.current = true
            }}
            onCompositionEnd={() => {
              isComposing.current = false
              handleInput()
            }}
          />
        </div>
      </div>

      {outputs.length > 0 && <OutputPanel outputs={outputs} durationMs={durationMs} />}
    </div>
  )
}
