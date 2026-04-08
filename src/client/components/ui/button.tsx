import { cn } from '@lib/cn'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'default' | 'ghost' | 'destructive'
type Size = 'sm' | 'md'

const variantStyles: Record<Variant, string> = {
  default: 'bg-accent text-accent-fg hover:bg-accent/90',
  ghost: 'hover:bg-bg-tertiary text-fg-secondary hover:text-fg-primary',
  destructive: 'bg-kernel-error text-white hover:bg-kernel-error/90',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-7 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
