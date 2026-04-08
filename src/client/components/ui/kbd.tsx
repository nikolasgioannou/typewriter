import { cn } from '@lib/cn'
import type { HTMLAttributes } from 'react'

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'text-fg-tertiary inline-flex items-center gap-0.5 font-mono text-xs',
        className
      )}
      {...props}
    />
  )
}
