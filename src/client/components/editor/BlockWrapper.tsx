import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

import type { BlockType } from '@shared/notebook'
import { cn } from '@lib/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/index'

import { SlashMenu } from './SlashMenu'

interface BlockWrapperProps {
  id: string
  blockType: BlockType
  children: ReactNode
  onChangeType: (type: BlockType) => void
  onDelete: () => void
  onAddBlock: (type: BlockType) => void
  registerRef: (el: HTMLElement | null) => void
}

export function BlockWrapper({
  id,
  blockType,
  children,
  onChangeType,
  onDelete,
  onAddBlock,
  registerRef,
}: BlockWrapperProps) {
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
      <div className="absolute top-2 -left-10 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <SlashMenu onSelect={onAddBlock}>
          <button className="text-fg-tertiary hover:bg-bg-tertiary hover:text-fg-secondary flex h-6 w-6 items-center justify-center rounded">
            +
          </button>
        </SlashMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-fg-tertiary hover:bg-bg-tertiary hover:text-fg-secondary flex h-6 w-6 cursor-grab items-center justify-center rounded"
              {...attributes}
              {...listeners}
            >
              ⠿
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {blockType !== 'code' && (
              <DropdownMenuItem onClick={() => onChangeType('code')}>Code</DropdownMenuItem>
            )}
            {blockType !== 'text' && (
              <DropdownMenuItem onClick={() => onChangeType('text')}>Text</DropdownMenuItem>
            )}
            {blockType !== 'heading1' && (
              <DropdownMenuItem onClick={() => onChangeType('heading1')}>
                Heading 1
              </DropdownMenuItem>
            )}
            {blockType !== 'divider' && (
              <DropdownMenuItem onClick={() => onChangeType('divider')}>Divider</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-kernel-error" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}
    </div>
  )
}
