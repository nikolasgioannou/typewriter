import { cn } from '@lib/cn'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

export const ToggleGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('border-border flex items-center overflow-hidden rounded-md border', className)}
    {...props}
  />
))

ToggleGroup.displayName = 'ToggleGroup'

export const ToggleGroupItem = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'text-fg-tertiary hover:text-fg-secondary data-[state=on]:bg-accent/15 data-[state=on]:text-fg-primary flex h-7 items-center justify-center px-2 transition-colors',
      className
    )}
    {...props}
  />
))

ToggleGroupItem.displayName = 'ToggleGroupItem'
