import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency, InvoiceStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Currency = 'INR') {
  const localeMap: Record<Currency, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AUD: 'en-AU',
    CAD: 'en-CA',
  }
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isOverdue(dueDate: string | null | undefined, status: InvoiceStatus) {
  if (!dueDate || status === 'paid' || status === 'cancelled' || status === 'draft') return false
  return new Date(dueDate) < new Date()
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function generateInvoiceNumber(prefix: string, count: number) {
  const year = new Date().getFullYear()
  const num = String(count).padStart(4, '0')
  return `${prefix}-${year}-${num}`
}

export function statusLabel(status: InvoiceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
