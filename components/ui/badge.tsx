import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/lib/types'

const statusStyles: Record<InvoiceStatus, { badge: string; dot: string }> = {
  paid: { badge: 'border-green-300 text-green-700 bg-green-50', dot: 'bg-green-500' },
  pending: { badge: 'border-amber-300 text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  overdue: { badge: 'border-red-300 text-red-600 bg-red-50', dot: 'bg-red-500' },
  cancelled: { badge: 'border-gray-300 text-gray-500 bg-gray-50', dot: 'bg-gray-400' },
  draft: { badge: 'border-gray-300 text-gray-500 bg-gray-50', dot: 'bg-gray-400' },
}

interface StatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = statusStyles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-sm',
        styles.badge,
        className
      )}
    >
      <span className={cn('w-1 h-1 rounded-full', styles.dot)} />
      {status}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'pro'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-sm',
        variant === 'default' && 'bg-gray-900 text-white',
        variant === 'outline' && 'border border-gray-300 text-gray-600',
        variant === 'pro' && 'bg-gray-100 text-gray-700 border border-gray-200',
        className
      )}
    >
      {children}
    </span>
  )
}
