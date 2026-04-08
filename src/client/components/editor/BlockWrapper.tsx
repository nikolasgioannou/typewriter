import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

import { cn } from '@lib/cn'

interface BlockWrapperProps {
  id: string
  children: ReactNode
  registerRef: (el: HTMLElement | null) => void
}

export function BlockWrapper({ id, children, registerRef }: BlockWrapperProps) {
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
      style={style}
      className={cn('group relative py-1', isDragging && 'z-10 opacity-50')}
    >
      <div className="absolute top-2 -left-6 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          className="text-fg-tertiary hover:bg-bg-tertiary hover:text-fg-secondary flex h-6 w-6 cursor-grab items-center justify-center rounded"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </div>

      {children}
    </div>
  )
}
