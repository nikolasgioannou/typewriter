import { cn } from '@lib/cn'
import type { HTMLAttributes } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'error'

const variantStyles: Record<Variant, string> = {
  default: 'bg-bg-tertiary text-fg-secondary',
  success: 'bg-kernel-ready/15 text-kernel-ready',
  warning: 'bg-kernel-running/15 text-kernel-running',
  error: 'bg-kernel-error/15 text-kernel-error',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
