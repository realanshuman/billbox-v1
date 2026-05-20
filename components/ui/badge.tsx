import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/lib/types'

const statusStyles: Record<InvoiceStatus, string> = {
  paid: 'border-green-300 text-green-700 bg-green-50',
  pending: 'border-amber-300 text-amber-700 bg-amber-50',
  overdue: 'border-red-300 text-red-700 bg-red-50',
  cancelled: 'border-gray-300 text-gray-500 bg-gray-50',
  draft: 'border-gray-300 text-gray-500 bg-gray-50',
}

interface StatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-sm',
        statusStyles[status],
        className
      )}
    >
      + {status}
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
