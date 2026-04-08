import * as Popover from '@radix-ui/react-popover'
import { Code2, Heading1, Heading2, Heading3, Minus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { BlockType } from '@shared/notebook'
import { cn } from '@lib/cn'

interface SlashMenuItem {
  type: BlockType
  label: string
  aliases: string[]
  icon: React.ReactNode
}

const menuItems: SlashMenuItem[] = [
  {
    type: 'heading1',
    label: 'Heading 1',
    aliases: ['heading 1', 'h1', '#'],
    icon: <Heading1 size={16} />,
  },
  {
    type: 'heading2',
    label: 'Heading 2',
    aliases: ['heading 2', 'h2', '##'],
    icon: <Heading2 size={16} />,
  },
  {
    type: 'heading3',
    label: 'Heading 3',
    aliases: ['heading 3', 'h3', '###'],
    icon: <Heading3 size={16} />,
  },
  {
    type: 'code',
    label: 'Code',
    aliases: ['code', 'typescript', 'ts', '```'],
    icon: <Code2 size={16} />,
  },
  {
    type: 'divider',
    label: 'Divider',
    aliases: ['divider', 'hr', 'line', '---'],
    icon: <Minus size={16} />,
  },
]

interface SlashCommandMenuProps {
  open: boolean
  onSelect: (type: BlockType) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  filter: string
}

export function SlashCommandMenu({
  open,
  onSelect,
  onClose,
  anchorRef,
  filter,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = menuItems.filter((item) =>
    item.aliases.some((a) => a.includes(filter.toLowerCase()))
  )

  useEffect(() => {
    setSelectedIndex(0)
    if (filter && filtered.length === 0) {
      onClose()
    }
  }, [filter, filtered.length, onClose])

  const handleSelect = useCallback(
    (type: BlockType) => {
      onSelect(type)
      onClose()
    },
    [onSelect, onClose]
  )

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = filtered[selectedIndex]
        if (item) handleSelect(item.type)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, filtered, selectedIndex, handleSelect, onClose])

  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.children[selectedIndex] as HTMLElement | undefined
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (filtered.length === 0) return null

  return (
    <Popover.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Popover.Anchor asChild>
        <span
          ref={anchorRef as React.RefObject<HTMLSpanElement>}
          style={{ position: 'absolute', pointerEvents: 'none' }}
        />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="bg-bg-primary border-border z-50 w-64 overflow-hidden rounded-lg border shadow-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div ref={listRef} role="menu" className="max-h-72 overflow-y-auto p-1">
            {filtered.map((item, i) => (
              <div
                key={item.type}
                role="menuitem"
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors select-none',
                  i === selectedIndex
                    ? 'bg-bg-tertiary text-fg-primary'
                    : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
                )}
                onMouseEnter={() => setSelectedIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(item.type)
                }}
              >
                <span className="bg-bg-tertiary text-fg-tertiary border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
