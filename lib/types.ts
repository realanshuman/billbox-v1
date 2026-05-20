export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
export type InvoiceType = 'tax' | 'proforma'
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'
export type Plan = 'starter' | 'pro'

export interface Company {
  id: string
  user_id: string
  name: string
  email: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  tax_id?: string
  invoice_prefix: string
  currency: Currency
  plan: Plan
  created_at: string
}

export interface Customer {
  id: string
  company_id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  tax_id?: string
  created_at: string
}

export interface Product {
  id: string
  company_id: string
  name: string
  description?: string
  unit_price: number
  tax_rate: number
  currency: Currency
  created_at: string
}

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  product_id?: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  tax_rate: number
  total: number
}

export interface Invoice {
  id: string
  company_id: string
  customer_id: string
  number: string
  type: InvoiceType
  status: InvoiceStatus
  issue_date: string
  due_date?: string
  currency: Currency
  subtotal: number
  tax_total: number
  total: number
  notes?: string
  created_at: string
  customer?: Customer
  items?: InvoiceItem[]
}

export interface HistoryEntry {
  id: string
  company_id: string
  invoice_id?: string
  action: string
  description: string
  metadata?: Record<string, unknown>
  created_at: string
  invoice?: Pick<Invoice, 'id' | 'number' | 'status'>
}

export interface DashboardStats {
  total_revenue: number
  total_invoices: number
  outstanding: number
  draft_count: number
  paid_count: number
  pending_count: number
  overdue_count: number
}
