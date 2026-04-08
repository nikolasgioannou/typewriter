import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

type HeadingLevel = 'heading1' | 'heading2' | 'heading3'

interface HeadingBlockProps {
  content: string
  level: HeadingLevel
  onChange: (content: string) => void
  onEnter: () => void
  onBackspace: () => void
}

const headingClass: Record<HeadingLevel, string> = {
  heading1: 'text-3xl font-bold',
  heading2: 'text-2xl font-semibold',
  heading3: 'text-xl font-medium',
}

export function HeadingBlock({
  content,
  level,
  onChange,
  onEnter,
  onBackspace,
}: HeadingBlockProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder: 'Heading' }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onEnter()
          return true
        }
        if (event.key === 'Backspace' && editor?.isEmpty) {
          onBackspace()
          return true
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className={`text-fg-primary ${headingClass[level]}`}>
      <EditorContent editor={editor} />
    </div>
  )
}
