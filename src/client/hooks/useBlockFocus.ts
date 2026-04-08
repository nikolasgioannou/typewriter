import { useCallback, useRef } from 'react'

export function useBlockFocus() {
  const focusedBlockRef = useRef<string | null>(null)
  const blockRefsMap = useRef<Map<string, HTMLElement>>(new Map())

  const registerBlock = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      blockRefsMap.current.set(id, el)
    } else {
      blockRefsMap.current.delete(id)
    }
  }, [])

  const focusBlock = useCallback((id: string) => {
    focusedBlockRef.current = id
    const el = blockRefsMap.current.get(id)
    if (el) {
      const focusable = el.querySelector<HTMLElement>(
        '[contenteditable], textarea, .cm-content, input'
      )
      focusable?.focus()
    }
  }, [])

  const focusBlockByIndex = useCallback(
    (blockIds: string[], currentId: string, direction: 'up' | 'down') => {
      const currentIndex = blockIds.indexOf(currentId)
      if (currentIndex === -1) return

      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const nextId = blockIds[nextIndex]
      if (nextId) {
        focusBlock(nextId)
      }
    },
    [focusBlock]
  )

  return { registerBlock, focusBlock, focusBlockByIndex, focusedBlockRef }
}
