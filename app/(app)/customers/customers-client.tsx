'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Customer } from '@/lib/types'

interface Props {
  customers: Customer[]
  companyId: string
  formatDate: (d: string) => string
}

function CustomerModal({
  companyId,
  onClose,
  onSaved,
}: {
  companyId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', tax_id: '' })
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('customers').insert({
      company_id: companyId,
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || null,
      tax_id: form.tax_id || null,
    })
    if (error) {
      toast.error('Failed to add customer')
    } else {
      toast.success('Customer added')
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Add Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Name *" value={form.name} onChange={update('name')} required placeholder="John Doe" />
          <Input label="Email *" type="email" value={form.email} onChange={update('email')} required placeholder="john@example.com" />
          <Input label="Phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" />
          <Input label="Address" value={form.address} onChange={update('address')} placeholder="Street address" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={update('city')} placeholder="Mumbai" />
            <Input label="State" value={form.state} onChange={update('state')} placeholder="Maharashtra" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Country" value={form.country} onChange={update('country')} placeholder="India" />
            <Input label="GST / Tax ID" value={form.tax_id} onChange={update('tax_id')} placeholder="29ABCDE1234F1Z5" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add Customer</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CustomersClient({ customers, companyId, formatDate }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer? This cannot be undone.')) return
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      toast.error('Cannot delete — customer may have invoices')
    } else {
      toast.success('Customer deleted')
      router.refresh()
    }
    setDeleting(null)
  }

  return (
    <>
      {showModal && (
        <CustomerModal
          companyId={companyId}
          onClose={() => setShowModal(false)}
          onSaved={() => router.refresh()}
        />
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="border border-gray-100 rounded-xl p-12 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">No customers yet.</p>
          <Button size="sm" onClick={() => setShowModal(true)}>Add your first customer</Button>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table>
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Email', 'Phone', 'Country', 'Added', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{customer.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{customer.country ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatDate(customer.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(customer.id)}
                      disabled={deleting === customer.id}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
