import * as React from 'react'
import { cn } from '@/lib/utils'

export interface NeoInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeoInput = React.forwardRef<HTMLInputElement, NeoInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full bg-input px-4 py-2 text-sm rounded-lg border border-border transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NeoInput.displayName = 'NeoInput'

export { NeoInput }
