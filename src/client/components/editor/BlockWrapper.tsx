import { useSortable } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'

import { GripVertical } from 'lucide-react'

import { cn } from '@lib/cn'

interface BlockWrapperProps {
  id: string
  children: ReactNode
  isSelected: boolean
  hideHandle: boolean
  registerRef: (el: HTMLElement | null) => void
}

export function BlockWrapper({
  id,
  children,
  isSelected,
  hideHandle,
  registerRef,
}: BlockWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        registerRef(el)
      }}
      data-block-id={id}
      style={style}
      className={cn('group flex items-center gap-2', isDragging && 'z-10')}
    >
      <div
        className={cn(
          'shrink-0 transition-opacity',
          hideHandle ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <button
          className="text-fg-tertiary hover:bg-bg-tertiary hover:text-fg-secondary flex h-6 w-6 cursor-grab items-center justify-center rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      </div>

      <div className={cn('min-w-0 flex-1 rounded-md p-1', isSelected && 'bg-accent/10')}>
        {children}
      </div>
    </div>
  )
}
