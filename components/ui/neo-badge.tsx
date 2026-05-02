import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const neoBadgeVariants = cva(
  'inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wide rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary/20 text-primary border border-primary/30',
        secondary: 'bg-secondary/20 text-secondary border border-secondary/30',
        accent: 'bg-accent/20 text-accent border border-accent/30',
        destructive: 'bg-destructive/20 text-destructive border border-destructive/30',
        success: 'bg-success/20 text-success border border-success/30',
        warning: 'bg-warning/20 text-warning border border-warning/30',
        outline: 'bg-muted text-muted-foreground border border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface NeoBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof neoBadgeVariants> {}

function NeoBadge({ className, variant, ...props }: NeoBadgeProps) {
  return (
    <div className={cn(neoBadgeVariants({ variant }), className)} {...props} />
  )
}

export { NeoBadge, neoBadgeVariants }
