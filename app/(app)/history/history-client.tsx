'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Download } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, effectiveStatus } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Currency, InvoiceStatus } from '@/lib/types'

interface RawInvoice {
  id: string
  company_id: string
  number: string
  type: string
  status: InvoiceStatus
  issue_date: string
  due_date?: string | null
  currency: string
  subtotal: number
  tax_total: number
  total: number
  notes?: string | null
  customer: { id: string; name: string } | null
}

interface InvoiceRow extends RawInvoice {
  _status: InvoiceStatus
}

interface Props {
  invoices: RawInvoice[]
  currency: Currency
}

export function HistoryAnalyticsClient({ invoices: raw, currency }: Props) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const withStatus: InvoiceRow[] = raw.map((inv) => ({
    ...inv,
    _status: effectiveStatus(inv),
  }))

  const dateFiltered = withStatus.filter((inv) => {
    if (fromDate && inv.issue_date < fromDate) return false
    if (toDate && inv.issue_date > toDate) return false
    return true
  })

  const paid = dateFiltered.filter((i) => i._status === 'paid')
  const pending = dateFiltered.filter((i) => i._status === 'pending')
  const overdue = dateFiltered.filter((i) => i._status === 'overdue')
  const draft = dateFiltered.filter((i) => i._status === 'draft')

  const totalRevenue = paid.reduce((s, i) => s + i.total, 0)
  const paidTotal = paid.reduce((s, i) => s + i.total, 0)
  const pendingTotal = pending.reduce((s, i) => s + i.total, 0)
  const overdueTotal = overdue.reduce((s, i) => s + i.total, 0)

  // Monthly revenue from paid invoices
  const monthlyMap = new Map<string, { label: string; value: number; sortKey: string }>()
  for (const inv of paid) {
    const d = new Date(inv.issue_date)
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.toLocaleString('en-US', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`
    const existing = monthlyMap.get(sortKey)
    monthlyMap.set(sortKey, { label, value: (existing?.value ?? 0) + inv.total, sortKey })
  }
  const monthlyRevenue = [...monthlyMap.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6)
  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.value), 1)

  // Top customers by paid revenue
  const customerMap = new Map<string, { name: string; count: number; total: number }>()
  for (const inv of paid) {
    const name = inv.customer?.name ?? 'Unknown'
    const e = customerMap.get(name) ?? { name, count: 0, total: 0 }
    customerMap.set(name, { name, count: e.count + 1, total: e.total + inv.total })
  }
  const topCustomers = [...customerMap.values()].sort((a, b) => b.total - a.total).slice(0, 5)

  // Invoice records table (applies search + status filter on top of date filter)
  const tableRecords = dateFiltered.filter((inv) => {
    if (statusFilter && inv._status !== (statusFilter as InvoiceStatus)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!inv.number.toLowerCase().includes(q) && !(inv.customer?.name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  function exportCSV() {
    const header = ['Invoice', 'Type', 'Customer', 'Status', 'Issue Date', 'Due Date', 'Total']
    const rows = tableRecords.map((i) => [
      i.number,
      i.type === 'tax' ? 'Tax Invoice' : 'Proforma',
      i.customer?.name ?? '',
      i._status,
      i.issue_date,
      i.due_date ?? '',
      i.total.toFixed(2),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported CSV')
  }

  return (
    <div>
      {/* Date range + export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-gray-400">{dateFiltered.length} invoice{dateFiltered.length !== 1 ? 's' : ''} in range</span>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 5 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue, currency), sub: null },
          { label: 'Paid',          value: formatCurrency(paidTotal, currency),   sub: `(${paid.length})` },
          { label: 'Pending',       value: formatCurrency(pendingTotal, currency), sub: `(${pending.length})` },
          { label: 'Overdue',       value: formatCurrency(overdueTotal, currency), sub: `(${overdue.length})` },
          { label: 'Draft',         value: `${draft.length} invoice${draft.length !== 1 ? 's' : ''}`, sub: null },
        ].map(({ label, value, sub }) => (
          <div key={label} className="border border-gray-100 rounded-xl p-4">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            <p className="text-base font-bold text-gray-900 leading-tight">
              {value}
              {sub && <span className="text-sm font-normal text-gray-400 ml-1">{sub}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly revenue + Top customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Monthly revenue bar chart */}
        <div className="border border-gray-100 rounded-xl p-5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Monthly Revenue (Paid)</p>
          {monthlyRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No paid invoices in range.</p>
          ) : (
            <div className="space-y-3">
              {monthlyRevenue.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-12 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-500"
                      style={{ width: `${(value / maxMonthly) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 w-24 text-right flex-shrink-0">
                    {formatCurrency(value, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="border border-gray-100 rounded-xl p-5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Top Customers by Revenue</p>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No paid invoices in range.</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-300 w-3 text-center flex-shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.count} invoice{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.total, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Records table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Invoice Records</p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-6"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {tableRecords.length === 0 ? (
          <p className="text-sm text-gray-400 p-8 text-center">No records match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice', 'Customer', 'Status', 'Issue Date', 'Due Date', 'Total'].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-[9px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap ${h === 'Total' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRecords.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-gray-900 hover:underline leading-tight block">
                        {inv.number}
                      </Link>
                      <span className="text-[10px] text-gray-400">{inv.type === 'tax' ? 'Tax Invoice' : 'Proforma'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{inv.customer?.name ?? '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv._status} /></td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(inv.issue_date)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(inv.total, (inv.currency as Currency) ?? currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
