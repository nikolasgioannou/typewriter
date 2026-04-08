import { cn } from '@lib/cn'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Size = 'sm' | 'md'

const sizeStyles: Record<Size, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'sm', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'text-fg-tertiary hover:bg-bg-tertiary hover:text-fg-primary flex cursor-pointer items-center justify-center rounded-md transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeStyles[size],
          className
        )}
        {...props}
      />
    )
  }
)

IconButton.displayName = 'IconButton'
