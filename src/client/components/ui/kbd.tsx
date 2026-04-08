import { cn } from '@lib/cn'
import type { HTMLAttributes } from 'react'

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'border-border bg-bg-tertiary text-fg-tertiary inline-flex h-7 items-center justify-center rounded-md border px-2 font-mono text-xs leading-none',
        className
      )}
      {...props}
    />
  )
}
