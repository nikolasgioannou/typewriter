import { javascript } from '@codemirror/lang-javascript'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { useCallback, useEffect, useRef } from 'react'

import type { Output } from '@shared/notebook'
import { cn } from '@lib/cn'
import { Badge, Button, Kbd } from '@ui/index'

interface CodeBlockProps {
  content: string
  outputs: Output[]
  executionCount?: number
  isRunning: boolean
  isStale: boolean
  onChange: (content: string) => void
  onRun: () => void
}

const outputTypeLabel: Record<string, string> = {
  stdout: 'out',
  stderr: 'err',
  return: 'return',
  error: 'error',
}

export function CodeBlock({
  content,
  outputs,
  executionCount,
  isRunning,
  isStale,
  onChange,
  onRun,
}: CodeBlockProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const handleRun = useCallback(() => {
    onRun()
    return true
  }, [onRun])

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        javascript({ typescript: true }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        keymap.of([{ key: 'Mod-Enter', run: () => handleRun() }]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            fontSize: '13px',
            backgroundColor: 'transparent',
          },
          '.cm-content': {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            padding: '8px 0',
            caretColor: 'var(--color-fg-primary)',
          },
          '.cm-line': {
            padding: '0 12px',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--color-fg-tertiary)',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--color-fg-primary)',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'var(--color-accent) !important',
            opacity: '0.2',
          },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  const countLabel = executionCount != null ? `[${executionCount}]` : '[ ]'

  return (
    <div
      className={cn(
        'border-border bg-bg-secondary overflow-hidden rounded-lg border',
        isRunning && 'border-l-accent border-l-2'
      )}
    >
      <div className="border-border flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-fg-tertiary font-mono text-xs">typescript</span>
          <span className="text-fg-tertiary font-mono text-xs">{countLabel}</span>
          {isStale && <Badge variant="warning">stale</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter</Kbd>
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

      <div ref={editorRef} />

      {outputs.length > 0 && (
        <div className={cn('border-border border-t px-3 py-2', isStale && 'opacity-50')}>
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
