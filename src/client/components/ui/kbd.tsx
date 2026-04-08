import { cn } from '@lib/cn'
import type { HTMLAttributes } from 'react'

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'border-border bg-bg-secondary text-fg-tertiary inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px]',
        className
      )}
      {...props}
    />
  )
}
