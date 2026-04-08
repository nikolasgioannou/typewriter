import { cn } from '@lib/cn'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

export const ContextMenu = ContextMenuPrimitive.Root
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger

export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        'bg-bg-primary border-border z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))

ContextMenuContent.displayName = 'ContextMenuContent'

export const ContextMenuItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm select-none',
      'focus:bg-bg-tertiary focus:text-fg-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
))

ContextMenuItem.displayName = 'ContextMenuItem'
