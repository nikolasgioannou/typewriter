import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

import { GripVertical } from 'lucide-react'

import { cn } from '@lib/cn'

interface BlockWrapperProps {
  id: string
  children: ReactNode
  isSelected: boolean
  registerRef: (el: HTMLElement | null) => void
}

export function BlockWrapper({ id, children, isSelected, registerRef }: BlockWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
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
      className={cn('group flex items-center gap-2', isDragging && 'z-10 opacity-50')}
    >
      <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
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
