import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          size === 'sm' && 'px-3 py-1.5 text-xs rounded',
          size === 'md' && 'px-4 py-2 text-sm rounded',
          size === 'lg' && 'px-6 py-3 text-base rounded',
          variant === 'primary' && 'bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-900',
          variant === 'secondary' && 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-300',
          variant === 'ghost' && 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
          variant === 'danger' && 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus-visible:ring-red-300',
          variant === 'success' && 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 focus-visible:ring-green-300',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
