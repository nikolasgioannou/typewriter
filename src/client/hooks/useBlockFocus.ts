import { useCallback, useRef } from 'react'

export function useBlockFocus() {
  const blockRefsMap = useRef<Map<string, HTMLElement>>(new Map())

  const registerBlock = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      blockRefsMap.current.set(id, el)
    } else {
      blockRefsMap.current.delete(id)
    }
  }, [])

  const focusBlock = useCallback((id: string) => {
    const el = blockRefsMap.current.get(id)
    if (el) {
      const focusable = el.querySelector<HTMLElement>(
        '[contenteditable], textarea, .cm-content, input'
      )
      if (focusable) {
        focusable.focus()
        const selection = window.getSelection()
        if (selection && focusable.childNodes.length > 0) {
          const range = document.createRange()
          range.selectNodeContents(focusable)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    }
  }, [])

  return { registerBlock, focusBlock }
}
