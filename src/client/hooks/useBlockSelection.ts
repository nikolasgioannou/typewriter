import { useCallback, useEffect, useRef, useState } from 'react'

interface SelectionRect {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

function rectsIntersect(
  a: { top: number; bottom: number; left: number; right: number },
  b: { top: number; bottom: number; left: number; right: number }
) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

export function useBlockSelection(blockRefsMap: React.RefObject<Map<string, HTMLElement>>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dragRect, setDragRect] = useState<SelectionRect | null>(null)
  const isDragging = useRef(false)

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (
      target.closest('[contenteditable]') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('button') ||
      target.closest('.cm-editor')
    ) {
      return
    }

    isDragging.current = true
    setDragRect({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    })
    setSelectedIds(new Set())
    e.preventDefault()
  }, [])

  const computeSelected = useCallback(
    (rect: SelectionRect) => {
      const box = {
        left: Math.min(rect.startX, rect.currentX),
        right: Math.max(rect.startX, rect.currentX),
        top: Math.min(rect.startY, rect.currentY),
        bottom: Math.max(rect.startY, rect.currentY),
      }

      const next = new Set<string>()
      const refs = blockRefsMap.current
      if (!refs) return

      for (const [id, el] of refs) {
        if (rectsIntersect(box, el.getBoundingClientRect())) {
          next.add(id)
        }
      }

      setSelectedIds(next)
    },
    [blockRefsMap]
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      setDragRect((prev) => {
        if (!prev) return prev
        const updated = { ...prev, currentX: e.clientX, currentY: e.clientY }
        computeSelected(updated)
        return updated
      })
    }

    const onMouseUp = () => {
      isDragging.current = false
      setDragRect(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [computeSelected])

  const selectionOverlayStyle = dragRect
    ? ({
        position: 'fixed',
        left: Math.min(dragRect.startX, dragRect.currentX),
        top: Math.min(dragRect.startY, dragRect.currentY),
        width: Math.abs(dragRect.currentX - dragRect.startX),
        height: Math.abs(dragRect.currentY - dragRect.startY),
        backgroundColor: 'hsl(var(--accent) / 0.08)',
        border: '1px solid hsl(var(--accent) / 0.25)',
        pointerEvents: 'none',
        zIndex: 9999,
      } as const)
    : null

  return {
    selectedIds,
    clearSelection,
    handleMouseDown,
    selectionOverlayStyle,
  }
}
