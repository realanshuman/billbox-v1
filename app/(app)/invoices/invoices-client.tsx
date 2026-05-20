'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Copy, Trash2, Eye, Download } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, nextInvoiceNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Currency, InvoiceStatus } from '@/lib/types'

export interface InvoiceRow {
  id: string
  company_id: string
  number: string
  type: string
  status: InvoiceStatus
  displayStatus: InvoiceStatus
  issue_date: string
  due_date?: string | null
  currency: string
  total: number
  customerName: string
}

interface Props {
  invoices: InvoiceRow[]
  prefix: string
  allNumbers: string[]
}

function RowActions({
  invoice,
  prefix,
  allNumbers,
}: {
  invoice: InvoiceRow
  prefix: string
  allNumbers: string[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleDuplicate() {
    setBusy(true)
    const supabase = createClient()
    const { data: full } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', invoice.id)
      .single()
    if (!full) { toast.error('Could not load invoice'); setBusy(false); return }

    const number = nextInvoiceNumber(prefix, allNumbers)
    const { data: created, error } = await supabase
      .from('invoices')
      .insert({
        company_id: full.company_id,
        customer_id: full.customer_id,
        number,
        type: full.type,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: null,
        currency: full.currency,
        subtotal: full.subtotal,
        tax_total: full.tax_total,
        total: full.total,
        notes: full.notes,
      })
      .select()
      .single()

    if (error || !created) { toast.error('Failed to duplicate'); setBusy(false); return }

    const items = (full.items ?? []) as Record<string, unknown>[]
    if (items.length) {
      await supabase.from('invoice_items').insert(
        items.map((it) => ({
          invoice_id: created.id,
          product_id: it.product_id,
          name: it.name,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
          total: it.total,
        }))
      )
    }
    await supabase.from('history').insert({
      company_id: full.company_id,
      invoice_id: created.id,
      action: 'created',
      description: `Invoice ${number} created (duplicate of ${invoice.number})`,
    })
    toast.success('Duplicated as draft')
    router.push(`/invoices/${created.id}`)
    router.refresh()
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${invoice.number}?`,
      message: 'This draft will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Draft deleted')
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
        aria-label="Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
          <Link
            href={`/invoices/${invoice.id}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </Link>
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          {invoice.status === 'draft' && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function InvoicesTable({ invoices, prefix, allNumbers }: Props) {
  function exportCSV() {
    const header = ['Number', 'Customer', 'Type', 'Issue Date', 'Due Date', 'Status', 'Currency', 'Total']
    const rows = invoices.map((i) => [
      i.number,
      i.customerName,
      i.type,
      i.issue_date,
      i.due_date ?? '',
      i.displayStatus,
      i.currency,
      i.total.toFixed(2),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported CSV')
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-xs">
        <p className="text-sm text-gray-400">No invoices found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden overflow-x-auto shadow-xs">
        <table>
          <thead>
            <tr className="border-b border-gray-100">
              {['#', 'Customer', 'Type', 'Date', 'Due', 'Amount', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                    {invoice.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{invoice.customerName}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{invoice.type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.issue_date)}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.due_date)}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {formatCurrency(invoice.total, invoice.currency as Currency)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={invoice.displayStatus} /></td>
                <td className="px-4 py-3">
                  <RowActions invoice={invoice} prefix={prefix} allNumbers={allNumbers} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
