import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface TextBlockProps {
  content: string
  onChange: (content: string) => void
  onEnter: () => void
  onBackspace: () => void
}

export function TextBlock({ content, onChange, onEnter, onBackspace }: TextBlockProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder: 'Type something...' }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
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
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className="prose-sm text-fg-primary max-w-none">
      <EditorContent editor={editor} />
    </div>
  )
}
