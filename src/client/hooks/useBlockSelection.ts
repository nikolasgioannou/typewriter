import { useCallback, useEffect, useRef, useState } from 'react'

interface LassoRect {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

function lassoToBox(lasso: LassoRect) {
  return {
    left: Math.min(lasso.startX, lasso.currentX),
    top: Math.min(lasso.startY, lasso.currentY),
    right: Math.max(lasso.startX, lasso.currentX),
    bottom: Math.max(lasso.startY, lasso.currentY),
  }
}

function rectsOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

export function useBlockSelection(editorRef: React.RefObject<HTMLDivElement | null>) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([])
  const [lasso, setLasso] = useState<LassoRect | null>(null)

  const lassoRef = useRef({ active: false, startX: 0, startY: 0 })

  const clearSelection = useCallback(() => {
    setSelectedBlockIds([])
    setLasso(null)
    lassoRef.current = { active: false, startX: 0, startY: 0 }
  }, [])

  const updateLassoSelection = useCallback(
    (lassoRect: LassoRect) => {
      const box = lassoToBox(lassoRect)
      const blockEls = editorRef.current?.querySelectorAll('[data-block-id]')
      if (!blockEls) return

      const ids: string[] = []
      blockEls.forEach((el) => {
        const id = el.getAttribute('data-block-id')
        if (!id) return
        const rect = el.getBoundingClientRect()
        if (rectsOverlap(box, rect)) {
          ids.push(id)
        }
      })
      setSelectedBlockIds(ids)
    },
    [editorRef]
  )

  const handleEditorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('[contenteditable]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('.cm-editor') ||
        target.closest('[role="dialog"]')
      ) {
        if (selectedBlockIds.length > 0) setSelectedBlockIds([])
        return
      }

      lassoRef.current = { active: true, startX: e.clientX, startY: e.clientY }
      setLasso({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY })
      setSelectedBlockIds([])
      window.getSelection()?.removeAllRanges()
    },
    [selectedBlockIds]
  )

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!lassoRef.current.active) return

      const rect: LassoRect = {
        startX: lassoRef.current.startX,
        startY: lassoRef.current.startY,
        currentX: e.clientX,
        currentY: e.clientY,
      }
      setLasso(rect)
      updateLassoSelection(rect)
      window.getSelection()?.removeAllRanges()
    }

    function handleMouseUp() {
      if (lassoRef.current.active) {
        lassoRef.current.active = false
        setLasso(null)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateLassoSelection])

  const lassoBox = lasso ? lassoToBox(lasso) : null

  return {
    selectedBlockIds,
    clearSelection,
    handleEditorMouseDown,
    lassoBox,
    hasSelection: selectedBlockIds.length > 0,
  }
}
