'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Trash2, Pencil } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Currency, Product } from '@/lib/types'

interface Props {
  products: Product[]
  companyId: string
  defaultCurrency: Currency
}

const TAX_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
]

function ProductModal({
  companyId,
  defaultCurrency,
  existing,
  onClose,
  onSaved,
}: {
  companyId: string
  defaultCurrency: Currency
  existing?: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    unit_price: existing ? String(existing.unit_price) : '',
    tax_rate: existing ? String(existing.tax_rate) : '18',
  })
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      description: form.description || null,
      unit_price: parseFloat(form.unit_price) || 0,
      tax_rate: parseFloat(form.tax_rate) || 0,
    }
    const { error } = existing
      ? await supabase.from('products').update(payload).eq('id', existing.id)
      : await supabase.from('products').insert({ company_id: companyId, currency: defaultCurrency, ...payload })

    if (error) {
      toast.error(existing ? 'Failed to update product' : 'Failed to add product')
    } else {
      toast.success(existing ? 'Product updated' : 'Product added')
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{existing ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Product Name *" value={form.name} onChange={update('name')} required placeholder="Game Key, Consulting Hour..." />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unit Price *" type="number" min="0" step="0.01" value={form.unit_price} onChange={update('unit_price')} required placeholder="1000.00" />
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tax Rate</label>
              <select value={form.tax_rate} onChange={update('tax_rate')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900">
                {TAX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{existing ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ProductsClient({ products, companyId, defaultCurrency }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [modal, setModal] = useState<{ open: boolean; product?: Product | null }>({ open: false })
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(product: Product) {
    const ok = await confirm({
      title: `Delete ${product.name}?`,
      message: 'This removes the saved product. Existing invoices keep their line items.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setDeleting(product.id)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      toast.error('Failed to delete product')
    } else {
      toast.success('Product deleted')
      router.refresh()
    }
    setDeleting(null)
  }

  return (
    <>
      {modal.open && (
        <ProductModal
          companyId={companyId}
          defaultCurrency={defaultCurrency}
          existing={modal.product}
          onClose={() => setModal({ open: false })}
          onSaved={() => router.refresh()}
        />
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="border border-gray-100 rounded-xl p-12 text-center">
          <Package className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">No products yet. Add reusable line items for your invoices.</p>
          <Button size="sm" onClick={() => setModal({ open: true })}>Add your first product</Button>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden overflow-x-auto">
          <table>
            <thead>
              <tr className="border-b border-gray-100">
                {['Product', 'Description', 'Unit Price', 'Tax Rate', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{product.description ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatCurrency(product.unit_price, (product.currency as Currency) ?? defaultCurrency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.tax_rate}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ open: true, product })} className="text-gray-300 hover:text-gray-700 transition-colors p-1" aria-label="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(product)} disabled={deleting === product.id} className="text-gray-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
