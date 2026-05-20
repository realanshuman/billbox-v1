import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { effectiveStatus } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { InvoicesTable, type InvoiceRow } from './invoices-client'
import type { Invoice, InvoiceStatus } from '@/lib/types'

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

const tabs: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

export default async function InvoicesPage({ searchParams }: Props) {
  const { status, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, currency, invoice_prefix')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, name)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const raw = (invoices ?? []) as (Invoice & { customer: { name: string } | null })[]
  const allNumbers = raw.map((i) => i.number)

  // Map to rows with derived (display) status.
  let rows: InvoiceRow[] = raw.map((i) => ({
    id: i.id,
    company_id: i.company_id,
    number: i.number,
    type: i.type,
    status: i.status,
    displayStatus: effectiveStatus(i),
    issue_date: i.issue_date,
    due_date: i.due_date,
    currency: i.currency,
    total: i.total,
    customerName: i.customer?.name ?? '—',
  }))

  // Filter by tab using the derived status.
  if (status) rows = rows.filter((r) => r.displayStatus === (status as InvoiceStatus))

  // Search by number or customer.
  if (q) {
    const needle = q.toLowerCase()
    rows = rows.filter(
      (r) => r.number.toLowerCase().includes(needle) || r.customerName.toLowerCase().includes(needle)
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">{raw.length} total</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search invoices..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </form>
        <div className="flex items-center gap-1 border border-gray-200 rounded p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/invoices?status=${tab.value}` : '/invoices'}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                status === tab.value || (!status && !tab.value)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <InvoicesTable invoices={rows} prefix={company.invoice_prefix ?? 'INV'} allNumbers={allNumbers} />
    </div>
  )
}
