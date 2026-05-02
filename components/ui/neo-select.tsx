import * as React from 'react'
import { cn } from '@/lib/utils'

export interface NeoSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const NeoSelect = React.forwardRef<HTMLSelectElement, NeoSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-11 w-full bg-input px-4 py-2 text-sm rounded-lg border border-border transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
NeoSelect.displayName = 'NeoSelect'

export { NeoSelect }
