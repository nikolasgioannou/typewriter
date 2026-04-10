import { useCallback, useEffect, useRef } from 'react'

type HeadingLevel = 'heading1' | 'heading2' | 'heading3'

interface HeadingBlockProps {
  content: string
  level: HeadingLevel
  onChange: (content: string) => void
  onEnter: () => void
  onBackspace: () => void
}

const headingClass: Record<HeadingLevel, string> = {
  heading1: 'text-2xl font-bold',
  heading2: 'text-xl font-semibold',
  heading3: 'text-lg font-medium',
}

const headingPlaceholder: Record<HeadingLevel, string> = {
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
}

export function HeadingBlock({
  content,
  level,
  onChange,
  onEnter,
  onBackspace,
}: HeadingBlockProps) {
  const editableRef = useRef<HTMLDivElement>(null)

  const getText = useCallback(() => editableRef.current?.textContent ?? '', [])

  const handleInput = useCallback(() => {
    onChange(editableRef.current?.textContent ?? '')
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onEnter()
        return
      }
      if (e.key === 'Backspace' && !getText()) {
        e.preventDefault()
        onBackspace()
      }
    },
    [getText, onEnter, onBackspace]
  )

  useEffect(() => {
    if (editableRef.current && editableRef.current.textContent !== content) {
      editableRef.current.textContent = content
    }
  }, [content])

  const isEmpty = !content

  return (
    <div className="relative">
      {isEmpty && (
        <div
          className={`text-fg-tertiary pointer-events-none absolute top-0 left-0 select-none ${headingClass[level]}`}
        >
          {headingPlaceholder[level]}
        </div>
      )}
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        className={`text-fg-primary ${headingClass[level]}`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={(e) => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            range.insertNode(document.createTextNode(text))
            range.collapse(false)
          }
          handleInput()
        }}
      />
    </div>
  )
}
