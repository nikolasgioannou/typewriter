import { cn } from '@lib/cn'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'border-border bg-bg-primary z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))

DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
      'focus:bg-bg-tertiary focus:text-fg-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
))

DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('bg-border -mx-1 my-1 h-px', className)}
    {...props}
  />
))

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'
