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

export function isOverdue(dueDate: string | null | undefined, status: InvoiceStatus) {
  if (!dueDate || status === 'paid' || status === 'cancelled' || status === 'draft') return false
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

/**
 * Derives the display status of an invoice. A 'pending' invoice whose due date
 * has passed is shown as 'overdue' without needing a background job to flip it.
 */
export function effectiveStatus(invoice: {
  status: InvoiceStatus
  due_date?: string | null
}): InvoiceStatus {
  if (invoice.status === 'pending' && isOverdue(invoice.due_date, invoice.status)) {
    return 'overdue'
  }
  return invoice.status
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Computes the next invoice number for the current year from the highest
 * existing sequence, avoiding collisions when drafts are deleted or
 * invoices are created concurrently.
 */
export function nextInvoiceNumber(prefix: string, existingNumbers: string[]) {
  const year = new Date().getFullYear()
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const n of existingNumbers) {
    const m = n.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`
}
