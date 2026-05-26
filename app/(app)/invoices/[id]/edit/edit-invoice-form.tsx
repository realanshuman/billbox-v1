'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/hooks/use-supabase'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Company, Currency } from '@/lib/types'

interface LineItem {
  id?: string
  name: string
  quantity: number
  unit_price: number
  tax_rate: number
  total: number
}

interface Props {
  company: Company
  invoice: {
    id: string
    number: string
    type: 'tax' | 'proforma'
    customer_id: string
    currency: string
    issue_date: string
    due_date?: string | null
    notes?: string | null
    items: LineItem[]
  }
  customers: { id: string; name: string; email: string }[]
  products: { id: string; name: string; unit_price: number; tax_rate: number }[]
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
  return { ...item, total: sub + sub * (item.tax_rate / 100) }
}

export function EditInvoiceForm({ company, invoice, customers, products }: Props) {
  const router = useRouter()
  const getSupabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState(invoice.customer_id)
  const [type, setType] = useState<'tax' | 'proforma'>(invoice.type)
  const [currency, setCurrency] = useState<Currency>(invoice.currency as Currency)
  const [issueDate, setIssueDate] = useState(invoice.issue_date)
  const [dueDate, setDueDate] = useState(invoice.due_date ?? '')
  const [notes, setNotes] = useState(invoice.notes ?? '')
  const [items, setItems] = useState<LineItem[]>(
    invoice.items.length > 0
      ? invoice.items
      : [{ name: '', quantity: 1, unit_price: 0, tax_rate: 18, total: 0 }]
  )

  const updateItem = useCallback((idx: number, field: keyof Omit<LineItem, 'total' | 'id'>, value: string | number) => {
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

  async function handleSave() {
    if (!customerId) { toast.error('Please select a customer'); return }
    if (items.some((i) => !i.name)) { toast.error('All items must have a name'); return }

    setLoading(true)
    const supabase = await getSupabase()

    const { error } = await supabase
      .from('invoices')
      .update({
        customer_id: customerId,
        type,
        currency,
        issue_date: issueDate,
        due_date: dueDate || null,
        notes: notes || null,
        subtotal,
        tax_total: taxTotal,
        total,
      })
      .eq('id', invoice.id)

    if (error) {
      toast.error('Failed to save changes')
      setLoading(false)
      return
    }

    // Replace all items
    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
    await supabase.from('invoice_items').insert(
      items.map((item) => ({
        invoice_id: invoice.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.total,
      }))
    )

    await supabase.from('history').insert({
      company_id: company.id,
      invoice_id: invoice.id,
      action: 'edited',
      description: `Invoice ${invoice.number} edited`,
    })

    toast.success('Invoice updated')
    router.push(`/invoices/${invoice.id}`)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        {/* Details */}
        <div className="border border-gray-100 rounded-xl p-6 space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" value={invoice.number} readOnly className="bg-gray-50" />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as 'tax' | 'proforma')}
              options={[
                { value: 'tax', label: 'Tax Invoice' },
                { value: 'proforma', label: 'Proforma Invoice' },
              ]}
            />
            <Input label="Issue Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Line Items</h2>
            {products.length > 0 && (
              <select
                className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"
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
              <tr className="border-b border-gray-50">
                {['Item', 'Qty', 'Unit Price', 'Tax', 'Total', ''].map((h) => (
                  <th key={h} className={`px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 ${h === 'Total' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 w-2/5">
                    <input value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Item name" className="w-full text-sm border-0 focus:outline-none focus:bg-gray-50 px-1 py-0.5 rounded" />
                  </td>
                  <td className="px-4 py-2 w-16">
                    <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full text-sm border-0 focus:outline-none focus:bg-gray-50 px-1 py-0.5 rounded text-center" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full text-sm border-0 focus:outline-none focus:bg-gray-50 px-1 py-0.5 rounded" />
                  </td>
                  <td className="px-4 py-2 w-24">
                    <select value={item.tax_rate} onChange={(e) => updateItem(idx, 'tax_rate', parseFloat(e.target.value))} className="w-full text-sm border-0 focus:outline-none focus:bg-gray-50 px-1 py-0.5 rounded">
                      {TAX_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total, currency)}</td>
                  <td className="px-2">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-gray-50">
            <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add line item
            </button>
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl p-6">
          <Textarea label="Notes (optional)" placeholder="Payment terms, bank details, or any other notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>

      {/* Summary */}
      <div>
        <div className="border border-gray-100 rounded-xl p-5 sticky top-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax</span><span>{formatCurrency(taxTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100 mt-2">
              <span>Total</span><span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Button className="w-full" loading={loading} onClick={handleSave}>Save Changes</Button>
            <Button variant="secondary" className="w-full" onClick={() => router.back()}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
