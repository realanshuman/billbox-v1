'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/hooks/use-supabase'
import { formatCurrency, nextInvoiceNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Company, Currency } from '@/lib/types'

interface LineItem {
  name: string
  quantity: number
  unit_price: number
  tax_rate: number
  total: number
}

interface Props {
  company: Company
  customers: { id: string; name: string; email: string }[]
  products: { id: string; name: string; unit_price: number; tax_rate: number }[]
  existingNumbers: string[]
}

const CURRENCIES = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
]

const TAX_RATES = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
]

function calcItem(item: Omit<LineItem, 'total'>): LineItem {
  const sub = item.quantity * item.unit_price
  const tax = sub * (item.tax_rate / 100)
  return { ...item, total: sub + tax }
}

export function NewInvoiceForm({ company, customers, products, existingNumbers }: Props) {
  const router = useRouter()
  const getSupabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState<'tax' | 'proforma'>('tax')
  const [currency, setCurrency] = useState<Currency>(company.currency as Currency)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { name: '', quantity: 1, unit_price: 0, tax_rate: 18, total: 0 },
  ])

  const invoiceNumber = nextInvoiceNumber(company.invoice_prefix, existingNumbers)

  const updateItem = useCallback((idx: number, field: keyof Omit<LineItem, 'total'>, value: string | number) => {
    setItems((prev) => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value }
      next[idx] = calcItem(item)
      return next
    })
  }, [])

  function addItem() {
    setItems((prev) => [...prev, { name: '', quantity: 1, unit_price: 0, tax_rate: 18, total: 0 }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function addProduct(productId: string) {
    const p = products.find((p) => p.id === productId)
    if (!p) return
    setItems((prev) => [...prev, calcItem({ name: p.name, quantity: 1, unit_price: p.unit_price, tax_rate: p.tax_rate })])
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxTotal = items.reduce((s, i) => s + (i.total - i.quantity * i.unit_price), 0)
  const total = subtotal + taxTotal

  async function handleSubmit(status: 'draft' | 'pending') {
    if (!customerId) { toast.error('Please select a customer'); return }
    if (items.some((i) => !i.name)) { toast.error('All items must have a name'); return }

    setLoading(true)
    const supabase = await getSupabase()

    function buildPayload(number: string) {
      return {
        company_id: company.id,
        customer_id: customerId,
        number,
        type,
        status,
        issue_date: issueDate,
        due_date: dueDate || null,
        currency,
        subtotal,
        tax_total: taxTotal,
        total,
        notes: notes || null,
      }
    }

    let number = invoiceNumber
    let { data: inv, error } = await supabase.from('invoices').insert(buildPayload(number)).select().single()

    // Retry once on a unique-number collision with a freshly computed number.
    if (error && error.code === '23505') {
      const { data: existing } = await supabase.from('invoices').select('number').eq('company_id', company.id)
      number = nextInvoiceNumber(company.invoice_prefix, (existing ?? []).map((i) => i.number))
      ;({ data: inv, error } = await supabase.from('invoices').insert(buildPayload(number)).select().single())
    }

    if (error || !inv) {
      toast.error('Failed to create invoice')
      setLoading(false)
      return
    }

    await supabase.from('invoice_items').insert(
      items.map((item) => ({ ...item, invoice_id: inv.id }))
    )

    await supabase.from('history').insert({
      company_id: company.id,
      invoice_id: inv.id,
      action: 'created',
      description: `Invoice ${number} created`,
    })

    toast.success('Invoice created!')
    router.push(`/invoices/${inv.id}`)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main */}
      <div className="md:col-span-2 space-y-6">
        {/* Details */}
        <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Invoice Details</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" value={invoiceNumber} readOnly className="bg-gray-50" />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as 'tax' | 'proforma')}
              options={[
                { value: 'tax', label: 'Tax Invoice' },
                { value: 'proforma', label: 'Proforma Invoice' },
              ]}
            />
            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Select customer..."
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              options={CURRENCIES}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Line Items</h2>
            {products.length > 0 && (
              <select
                className="text-[11px] border border-gray-200 rounded-md px-2.5 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                onChange={(e) => { if (e.target.value) { addProduct(e.target.value); e.target.value = '' } }}
                defaultValue=""
              >
                <option value="">+ Add from catalog</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <table>
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-2.5 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400 w-2/5">Item</th>
                <th className="px-5 py-2.5 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400 w-16">Qty</th>
                <th className="px-5 py-2.5 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400">Unit Price</th>
                <th className="px-5 py-2.5 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400 w-24">Tax</th>
                <th className="px-5 py-2.5 text-right text-[9px] font-semibold uppercase tracking-widest text-gray-400">Total</th>
                <th className="w-9" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0 group hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-2.5">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full text-sm bg-transparent border-0 focus:outline-none placeholder:text-gray-300"
                    />
                  </td>
                  <td className="px-5 py-2.5">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm bg-transparent border-0 focus:outline-none text-center"
                    />
                  </td>
                  <td className="px-5 py-2.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm bg-transparent border-0 focus:outline-none"
                    />
                  </td>
                  <td className="px-5 py-2.5">
                    <select
                      value={item.tax_rate}
                      onChange={(e) => updateItem(idx, 'tax_rate', parseFloat(e.target.value))}
                      className="w-full text-sm bg-transparent border-0 focus:outline-none appearance-none cursor-pointer"
                    >
                      {TAX_RATES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-2.5 text-right text-sm font-medium text-gray-900 tabular-nums">
                    {formatCurrency(item.total, currency)}
                  </td>
                  <td className="pr-3">
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-gray-50">
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add line item
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-xs">
          <Textarea
            label="Notes (optional)"
            placeholder="Payment terms, bank details, or any other notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Summary sidebar */}
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-xl p-5 sticky top-8 bg-white shadow-xs">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Summary</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax</span>
              <span className="tabular-nums">{formatCurrency(taxTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2.5 border-t border-gray-100 mt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total, currency)}</span>
            </div>
          </div>

          <div className="space-y-2 mt-5">
            <Button className="w-full justify-center" loading={loading} onClick={() => handleSubmit('pending')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Create & Send
            </Button>
            <Button variant="secondary" className="w-full justify-center" loading={loading} onClick={() => handleSubmit('draft')}>
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
