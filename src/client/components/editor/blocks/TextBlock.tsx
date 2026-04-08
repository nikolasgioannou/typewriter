import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { BlockType } from '@shared/notebook'
import { SlashCommandMenu } from '@client/components/editor/SlashMenu'

interface TextBlockProps {
  content: string
  onChange: (content: string) => void
  onEnter: () => void
  onBackspace: () => void
  onSlashSelect: (type: BlockType) => void
}

export function TextBlock({
  content,
  onChange,
  onEnter,
  onBackspace,
  onSlashSelect,
}: TextBlockProps) {
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const anchorRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      const text = e.getText()

      if (slashOpen) {
        const slashIdx = text.lastIndexOf('/')
        if (slashIdx === -1) {
          handleSlashClose()
        } else {
          setSlashFilter(text.slice(slashIdx + 1))
        }
      }

      onChange(e.getHTML())
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (slashOpen) {
          if (
            event.key === 'Enter' ||
            event.key === 'ArrowDown' ||
            event.key === 'ArrowUp' ||
            event.key === 'Escape'
          ) {
            return true
          }
          if (event.key === 'Backspace') {
            const text = editor?.getText() ?? ''
            const slashIdx = text.lastIndexOf('/')
            if (slashIdx === text.length - 1) {
              handleSlashClose()
            }
            return false
          }
          return false
        }

        if (event.key === 'Enter' && !event.shiftKey) {
          onEnter()
          return true
        }
        if (event.key === 'Backspace' && editor?.isEmpty) {
          onBackspace()
          return true
        }
        return false
      },
      handleTextInput: (_view, _from, _to, text) => {
        if (text === '/' && !slashOpen) {
          if (containerRef.current) {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              const rect = range.getBoundingClientRect()
              const containerRect = containerRef.current.getBoundingClientRect()
              if (anchorRef.current) {
                anchorRef.current.style.left = `${rect.left - containerRect.left}px`
                anchorRef.current.style.top = `${rect.bottom - containerRect.top}px`
              }
            }
          }
          setSlashFilter('')
          setTimeout(() => setSlashOpen(true), 0)
        }
        return false
      },
    },
  })

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      editor?.commands.clearContent()
      setSlashOpen(false)
      setSlashFilter('')
      onSlashSelect(type)
    },
    [onSlashSelect, editor]
  )

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false)
    setSlashFilter('')
  }, [])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div ref={containerRef} className="prose-sm text-fg-primary relative max-w-none">
      <EditorContent editor={editor} />
      <SlashCommandMenu
        open={slashOpen}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
        anchorRef={anchorRef}
        filter={slashFilter}
      />
    </div>
  )
}
