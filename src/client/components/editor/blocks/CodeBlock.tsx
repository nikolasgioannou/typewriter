import { javascript } from '@codemirror/lang-javascript'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { useEffect, useRef, useState } from 'react'

import type { Output } from '@shared/notebook'
import { Button } from '@ui/index'

import { OutputPanel } from './OutputPanel'

interface CodeBlockProps {
  content: string
  outputs: Output[]
  executionCount?: number
  durationMs?: number
  isRunning: boolean
  onChange: (content: string) => void
  onRun: () => void
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
  durationMs,
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
    <div className="border-border bg-bg-secondary overflow-hidden rounded-lg border">
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

      {outputs.length > 0 && <OutputPanel outputs={outputs} durationMs={durationMs} />}
    </div>
  )
}
