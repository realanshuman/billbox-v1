import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, effectiveStatus } from '@/lib/utils'
import { InvoiceActions } from './invoice-actions'
import type { Currency, Invoice } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*)')
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (!invoice) notFound()

  const inv = invoice as Invoice & { customer: { name: string; email: string; address?: string; city?: string; state?: string; country?: string; tax_id?: string }; items: Invoice['items'] }
  const currency = (inv.currency as Currency) ?? 'INR'
  const displayStatus = effectiveStatus(inv)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <Link href="/invoices" className="text-gray-400 hover:text-gray-700 transition-colors text-sm mt-0.5">
            ←
          </Link>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
              {inv.type === 'tax' ? 'Tax Invoice' : 'Proforma Invoice'}
            </p>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">{inv.number}</h1>
              <StatusBadge status={displayStatus} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {inv.status === 'draft' && (
            <Link
              href={`/invoices/${inv.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          )}
          <InvoiceActions invoice={inv} company={company} />
        </div>
      </div>

      {/* Invoice body */}
      <div id="invoice-content" className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* From / Bill To */}
        <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/60">
          <div className="p-6">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">From</p>
            <p className="text-sm font-semibold text-gray-900">{company.name}</p>
            <p className="text-sm text-gray-500">{company.email}</p>
            {company.address && <p className="text-sm text-gray-500">{company.address}</p>}
            {company.tax_id && <p className="text-sm text-gray-500">GST: {company.tax_id}</p>}
          </div>
          <div className="p-6 border-l border-gray-100">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
            <p className="text-sm font-semibold text-gray-900">{inv.customer?.name}</p>
            <p className="text-sm text-gray-500">{inv.customer?.email}</p>
            {inv.customer?.address && <p className="text-sm text-gray-500">{inv.customer.address}</p>}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/30">
          <div className="p-5">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Issue Date</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(inv.issue_date)}</p>
          </div>
          <div className="p-5 border-l border-gray-100">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Due Date</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(inv.due_date)}</p>
          </div>
          <div className="p-5 border-l border-gray-100">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Currency</p>
            <p className="text-sm font-semibold text-gray-900">{currency}</p>
          </div>
        </div>

        {/* Line items */}
        <table>
          <thead>
            <tr className="border-b border-gray-100">
              {['Item', 'Qty', 'Unit Price', 'Tax', 'Total'].map((h) => (
                <th key={h} className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 ${h === 'Total' ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(inv.items ?? []).map((item, idx) => (
              <tr key={item.id ?? idx} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{formatCurrency(item.unit_price, currency)}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{item.tax_rate}%</td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-100 p-5 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(inv.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax</span>
              <span>{formatCurrency(inv.tax_total, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatCurrency(inv.total, currency)}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="border-t border-gray-100 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-500">{inv.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
