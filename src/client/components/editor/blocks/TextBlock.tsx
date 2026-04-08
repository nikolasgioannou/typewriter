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

function stripHtml(html: string): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
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
  const [focused, setFocused] = useState(false)
  const anchorRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)

  const getText = useCallback(() => editableRef.current?.textContent ?? '', [])

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      if (editableRef.current) {
        editableRef.current.textContent = ''
      }
      setSlashOpen(false)
      setSlashFilter('')
      onSlashSelect(type)
    },
    [onSlashSelect]
  )

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false)
    setSlashFilter('')
  }, [])

  const positionAnchor = useCallback(() => {
    if (!containerRef.current || !anchorRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    anchorRef.current.style.left = `${rect.left - containerRect.left}px`
    anchorRef.current.style.top = `${rect.bottom - containerRect.top}px`
  }, [])

  const handleInput = useCallback(() => {
    if (isComposing.current) return
    const text = getText()

    if (slashOpen) {
      const slashIdx = text.lastIndexOf('/')
      if (slashIdx === -1) {
        handleSlashClose()
      } else {
        setSlashFilter(text.slice(slashIdx + 1))
      }
    }

    if (!slashOpen && text.endsWith('/')) {
      requestAnimationFrame(() => {
        positionAnchor()
        setSlashFilter('')
        setSlashOpen(true)
      })
    }

    onChange(text)
  }, [onChange, getText, slashOpen, handleSlashClose, positionAnchor])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (slashOpen) {
        if (
          e.key === 'Enter' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowUp' ||
          e.key === 'Escape'
        ) {
          e.preventDefault()
          return
        }
        if (e.key === 'Backspace') {
          const text = getText()
          const slashIdx = text.lastIndexOf('/')
          if (slashIdx === text.length - 1) {
            handleSlashClose()
          }
          return
        }
        return
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onEnter()
        return
      }

      if (e.key === 'Backspace' && !getText()) {
        e.preventDefault()
        onBackspace()
      }
    },
    [slashOpen, getText, onEnter, onBackspace, handleSlashClose]
  )

  useEffect(() => {
    if (editableRef.current) {
      const plainText = stripHtml(content)
      if (editableRef.current.textContent !== plainText) {
        editableRef.current.textContent = plainText
      }
    }
  }, [content])

  const isEmpty = !content || content === '<br>' || content === '<p></p>'

  return (
    <div ref={containerRef} className="relative">
      {isEmpty && focused && (
        <div className="text-fg-tertiary pointer-events-none absolute top-0 left-0 text-sm select-none">
          Type &apos;/&apos; for commands
        </div>
      )}
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        className="text-fg-primary min-h-[1.5em] text-sm"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onCompositionStart={() => {
          isComposing.current = true
        }}
        onCompositionEnd={() => {
          isComposing.current = false
          handleInput()
        }}
      />
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
