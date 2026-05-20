import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getGreeting } from '@/lib/utils'
import { TrendingUp, FileText, Clock, User, ArrowRight, Plus } from 'lucide-react'
import type { Currency, Invoice } from '@/lib/types'

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

  const all = (invoices ?? []) as Invoice[]
  const paid = all.filter((i) => i.status === 'paid')
  const pending = all.filter((i) => i.status === 'pending')
  const overdue = all.filter((i) => i.status === 'overdue')
  const draft = all.filter((i) => i.status === 'draft')

  const totalRevenue = paid.reduce((s, i) => s + (i.total ?? 0), 0)
  const outstanding = [...pending, ...overdue].reduce((s, i) => s + (i.total ?? 0), 0)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toUpperCase()

  const firstName = company.name.split(' ')[0]
  const currency = (company.currency as Currency) ?? 'INR'

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue, currency),
      sub: `${paid.length} paid invoice${paid.length !== 1 ? 's' : ''}`,
      icon: TrendingUp,
    },
    {
      label: 'Total Invoices',
      value: String(all.length),
      sub: `${pending.length} pending`,
      icon: FileText,
    },
    {
      label: 'Outstanding',
      value: formatCurrency(outstanding, currency),
      sub: `${overdue.length} overdue`,
      icon: Clock,
    },
    {
      label: 'Draft',
      value: String(draft.length),
      sub: 'awaiting issue',
      icon: User,
    },
  ]

  const recent = all.slice(0, 6)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {firstName}.</h1>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
              <Icon className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
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
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table>
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice', 'Customer', 'Date', 'Due', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(invoice.customer as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.issue_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.due_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total, invoice.currency as Currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Quick Actions</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: '/invoices/new', title: 'Create Invoice', sub: 'New tax or proforma' },
            { href: '/customers', title: 'Add Customer', sub: 'Manage your clients' },
            { href: '/products', title: 'Add Product', sub: 'Reusable line items' },
          ].map(({ href, title, sub }) => (
            <Link
              key={href}
              href={href}
              className="border border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
