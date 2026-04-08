import type { BlockType } from '@shared/notebook'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/index'

interface SlashMenuProps {
  onSelect: (type: BlockType) => void
  children: React.ReactNode
}

const menuItems: Array<{ type: BlockType; label: string; description: string }> = [
  { type: 'code', label: 'Code', description: 'TypeScript code cell' },
  { type: 'text', label: 'Text', description: 'Plain text block' },
  { type: 'heading1', label: 'Heading 1', description: 'Large heading' },
  { type: 'heading2', label: 'Heading 2', description: 'Medium heading' },
  { type: 'heading3', label: 'Heading 3', description: 'Small heading' },
  { type: 'divider', label: 'Divider', description: 'Horizontal rule' },
]

export function SlashMenu({ onSelect, children }: SlashMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.type} onClick={() => onSelect(item.type)}>
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-fg-tertiary">{item.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
