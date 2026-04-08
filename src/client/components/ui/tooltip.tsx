import { cn } from '@lib/cn'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'bg-fg-primary text-bg-primary animate-in fade-in-0 zoom-in-95 z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs',
      className
    )}
    {...props}
  />
))

TooltipContent.displayName = 'TooltipContent'
