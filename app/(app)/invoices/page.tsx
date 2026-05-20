import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import type { Currency, Invoice, InvoiceStatus } from '@/lib/types'

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
    .select('id, currency')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  let query = supabase
    .from('invoices')
    .select('*, customer:customers(id, name)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: invoices } = await query
  const all = (invoices ?? []) as Invoice[]

  const filtered = q
    ? all.filter((i) =>
        i.number.toLowerCase().includes(q.toLowerCase()) ||
        (i.customer as { name: string } | null)?.name?.toLowerCase().includes(q.toLowerCase())
      )
    : all

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">{all.length} total</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search invoices..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </form>
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/invoices?status=${tab.value}` : '/invoices'}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-gray-100 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">No invoices found.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table>
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'Customer', 'Type', 'Date', 'Due', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(invoice.customer as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      {invoice.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.issue_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.due_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total, invoice.currency as Currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status as InvoiceStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${invoice.id}`} className="text-xs text-gray-400 hover:text-gray-700">
                      —
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
