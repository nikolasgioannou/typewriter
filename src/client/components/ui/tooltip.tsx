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
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'bg-fg-primary text-bg-primary animate-in fade-in-0 z-50 rounded-md px-2 py-1 text-xs',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))

TooltipContent.displayName = 'TooltipContent'
