import { cn } from '@lib/cn'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

export const ScrollArea = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar
      orientation="vertical"
      className="flex touch-none p-0.5 transition-colors select-none data-[orientation=vertical]:w-2.5"
    >
      <ScrollAreaPrimitive.Thumb className="bg-border relative flex-1 rounded-full" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))

ScrollArea.displayName = 'ScrollArea'
