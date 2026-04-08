import { javascript } from '@codemirror/lang-javascript'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { useEffect, useRef, useState } from 'react'

import type { Output } from '@shared/notebook'
import { cn } from '@lib/cn'
import { Button } from '@ui/index'

interface CodeBlockProps {
  content: string
  outputs: Output[]
  executionCount?: number
  isRunning: boolean
  onChange: (content: string) => void
  onRun: () => void
}

const outputTypeLabel: Record<string, string> = {
  stdout: 'out',
  stderr: 'err',
  return: 'return',
  error: 'error',
}

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDark
}

export function CodeBlock({
  content,
  outputs,
  executionCount,
  isRunning,
  onChange,
  onRun,
}: CodeBlockProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isDark = useIsDark()

  useEffect(() => {
    if (!editorRef.current) return

    const highlightExt = isDark
      ? syntaxHighlighting(oneDarkHighlightStyle, { fallback: true })
      : syntaxHighlighting(defaultHighlightStyle, { fallback: true })

    const state = EditorState.create({
      doc: content,
      extensions: [
        javascript({ typescript: true }),
        highlightExt,
        EditorView.lineWrapping,
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
  }, [isDark])

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

      <div ref={editorRef} />

      {outputs.length > 0 && (
        <div className="border-border border-t px-3 py-2">
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
