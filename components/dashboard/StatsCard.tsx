import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning'
  description?: string
}

export function StatsCard({ title, value, icon: Icon, variant = 'default', description }: StatsCardProps) {
  const styles = {
    default: {
      bg: 'bg-card',
      text: 'text-card-foreground',
      icon: 'bg-muted text-muted-foreground',
    },
    primary: {
      bg: 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20',
      text: 'text-foreground',
      icon: 'bg-primary/20 text-primary',
    },
    secondary: {
      bg: 'bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20',
      text: 'text-foreground',
      icon: 'bg-secondary/20 text-secondary',
    },
    accent: {
      bg: 'bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20',
      text: 'text-foreground',
      icon: 'bg-accent/20 text-accent',
    },
    success: {
      bg: 'bg-gradient-to-br from-success/20 to-success/5 border border-success/20',
      text: 'text-foreground',
      icon: 'bg-success/20 text-success',
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20',
      text: 'text-foreground',
      icon: 'bg-warning/20 text-warning',
    },
  }

  const style = styles[variant]

  return (
    <div className={cn('p-5 rounded-xl', style.bg, style.text)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', style.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
