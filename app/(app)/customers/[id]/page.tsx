import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, effectiveStatus } from '@/lib/utils'
import { FileText } from 'lucide-react'
import type { Currency, Customer, Invoice } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, currency')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (!customer) notFound()
  const c = customer as Customer

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', company.id)
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const list = (invoices ?? []) as Invoice[]
  const currency = (company.currency as Currency) ?? 'INR'

  const paid = list.filter((i) => i.status === 'paid')
  const totalBilled = list.filter((i) => i.status !== 'cancelled' && i.status !== 'draft').reduce((s, i) => s + i.total, 0)
  const totalPaid = paid.reduce((s, i) => s + i.total, 0)
  const outstanding = totalBilled - totalPaid

  const addressLines = [c.address, [c.city, c.state].filter(Boolean).join(', '), c.country].filter(Boolean) as string[]

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/customers" className="text-gray-400 hover:text-gray-700 transition-colors text-sm">← Back</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{c.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Billed', value: formatCurrency(totalBilled, currency) },
          { label: 'Total Paid', value: formatCurrency(totalPaid, currency) },
          { label: 'Outstanding', value: formatCurrency(outstanding, currency) },
        ].map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-100 rounded-xl p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Contact</p>
          <p className="text-sm text-gray-700">{c.email}</p>
          {c.phone && <p className="text-sm text-gray-700">{c.phone}</p>}
          {c.tax_id && <p className="text-sm text-gray-500 mt-1">GST: {c.tax_id}</p>}
        </div>
        <div className="border border-gray-100 rounded-xl p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Address</p>
          {addressLines.length ? (
            addressLines.map((l, i) => <p key={i} className="text-sm text-gray-700">{l}</p>)
          ) : (
            <p className="text-sm text-gray-400">No address on file</p>
          )}
        </div>
      </div>

      {/* Invoices */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Invoices ({list.length})</p>
      {list.length === 0 ? (
        <div className="border border-gray-100 rounded-xl p-12 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No invoices for this customer yet.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden overflow-x-auto">
          <table>
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'Date', 'Due', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-gray-900 hover:underline">{inv.number}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(inv.issue_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatCurrency(inv.total, currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={effectiveStatus(inv)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
