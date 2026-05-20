import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getGreeting, effectiveStatus } from '@/lib/utils'
import { TrendingUp, FileText, Clock, FileEdit, ArrowRight, Plus } from 'lucide-react'
import type { Currency, Invoice, InvoiceStatus } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, name)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const currency = (company.currency as Currency) ?? 'INR'

  // Derive effective status (pending past due → overdue) for every invoice.
  const all = (invoices ?? []).map((i) => ({
    ...i,
    _status: effectiveStatus(i as Invoice),
  })) as (Invoice & { _status: InvoiceStatus; customer: { name: string } | null })[]

  const paid = all.filter((i) => i._status === 'paid')
  const pending = all.filter((i) => i._status === 'pending')
  const overdue = all.filter((i) => i._status === 'overdue')
  const draft = all.filter((i) => i._status === 'draft')

  const totalRevenue = paid.reduce((s, i) => s + (i.total ?? 0), 0)
  const outstanding = [...pending, ...overdue].reduce((s, i) => s + (i.total ?? 0), 0)

  // This-month vs last-month paid revenue.
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const inRange = (d: string, from: Date, to: Date) => {
    const t = new Date(d).getTime()
    return t >= from.getTime() && t < to.getTime()
  }
  const thisMonthRevenue = paid
    .filter((i) => inRange(i.issue_date, monthStart, now))
    .reduce((s, i) => s + i.total, 0)
  const lastMonthRevenue = paid
    .filter((i) => inRange(i.issue_date, lastMonthStart, monthStart))
    .reduce((s, i) => s + i.total, 0)
  const revenueDelta =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null

  // Aging buckets for outstanding (pending + overdue).
  const outstandingInvoices = [...pending, ...overdue]
  const aging = { current: 0, d30: 0, d60: 0, d90: 0 }
  for (const inv of outstandingInvoices) {
    if (!inv.due_date) { aging.current += inv.total; continue }
    const daysPast = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86_400_000)
    if (daysPast <= 0) aging.current += inv.total
    else if (daysPast <= 30) aging.d30 += inv.total
    else if (daysPast <= 60) aging.d60 += inv.total
    else aging.d90 += inv.total
  }
  const agingMax = Math.max(aging.current, aging.d30, aging.d60, aging.d90, 1)
  const agingRows = [
    { label: 'Not due', value: aging.current, color: 'bg-gray-300' },
    { label: '1–30 days', value: aging.d30, color: 'bg-amber-400' },
    { label: '31–60 days', value: aging.d60, color: 'bg-orange-400' },
    { label: '60+ days', value: aging.d90, color: 'bg-red-400' },
  ]

  // Top customers by paid revenue.
  const byCustomer = new Map<string, number>()
  for (const i of paid) {
    const name = i.customer?.name ?? 'Unknown'
    byCustomer.set(name, (byCustomer.get(name) ?? 0) + i.total)
  }
  const topCustomers = [...byCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const today = now
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
  const firstName = company.name.split(' ')[0]

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue, currency), sub: `${paid.length} paid invoice${paid.length !== 1 ? 's' : ''}`, icon: TrendingUp },
    { label: 'Total Invoices', value: String(all.length), sub: `${pending.length} pending`, icon: FileText },
    { label: 'Outstanding', value: formatCurrency(outstanding, currency), sub: `${overdue.length} overdue`, icon: Clock },
    { label: 'Draft', value: String(draft.length), sub: 'awaiting issue', icon: FileEdit },
  ]

  const recent = all.slice(0, 6)
  const hasOutstanding = outstanding > 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {firstName}.</h1>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">{label}</p>
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                <Icon className="w-3 h-3 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5 leading-none">{value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* This month + Aging */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {/* This month */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-3">This Month</p>
          <div className="flex items-end gap-3 mb-1">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthRevenue, currency)}</p>
            {revenueDelta !== null && (
              <span className={`text-xs font-semibold mb-1 ${revenueDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {revenueDelta >= 0 ? '↑' : '↓'} {Math.abs(revenueDelta)}%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            vs {formatCurrency(lastMonthRevenue, currency)} last month
          </p>
        </div>

        {/* Aging */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Outstanding by Age</p>
          {hasOutstanding ? (
            <div className="space-y-2">
              {agingRows.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${(row.value / agingMax) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 w-20 text-right flex-shrink-0">
                    {formatCurrency(row.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-3">Nothing outstanding — you&apos;re all caught up.</p>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Recent Invoices</p>
          <Link href="/invoices" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="border border-gray-100 rounded-xl p-12 text-center">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No invoices yet.</p>
            <Link href="/invoices/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-900 font-medium hover:underline">
              <Plus className="w-3.5 h-3.5" /> Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden overflow-x-auto shadow-xs">
            <table>
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice', 'Customer', 'Date', 'Due', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{invoice.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.issue_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.due_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(invoice.total, invoice.currency as Currency)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={invoice._status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Top Customers</p>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden shadow-xs">
            {topCustomers.map(([name, total], i) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold w-4 text-center ${i === 0 ? 'text-gray-900' : i === 1 ? 'text-gray-500' : 'text-gray-300'}`}>{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600 uppercase flex-shrink-0">
                    {name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(total, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/invoices/new', title: 'New Invoice', sub: 'Create tax or proforma' },
            { href: '/customers', title: 'Add Customer', sub: 'Manage your clients' },
            { href: '/products', title: 'Add Product', sub: 'Reusable line items' },
          ].map(({ href, title, sub }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white border border-gray-100 rounded-xl p-5 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <p className="text-sm font-semibold text-gray-900 mb-0.5 group-hover:text-gray-700">{title}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
