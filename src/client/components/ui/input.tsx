import { cn } from '@lib/cn'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'bg-bg-tertiary text-fg-primary border-border placeholder:text-fg-tertiary rounded-md border px-2 py-1 text-sm',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
