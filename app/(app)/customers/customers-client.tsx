'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Users, Trash2, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Customer } from '@/lib/types'

interface Props {
  customers: Customer[]
  companyId: string
}

type FormState = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  tax_id: string
}

function CustomerModal({
  companyId,
  existing,
  onClose,
  onSaved,
}: {
  companyId: string
  existing?: Customer | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>({
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    address: existing?.address ?? '',
    city: existing?.city ?? '',
    state: existing?.state ?? '',
    country: existing?.country ?? 'India',
    tax_id: existing?.tax_id ?? '',
  })
  const [loading, setLoading] = useState(false)

  function update(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || null,
      tax_id: form.tax_id || null,
    }

    const { error } = existing
      ? await supabase.from('customers').update(payload).eq('id', existing.id)
      : await supabase.from('customers').insert({ company_id: companyId, ...payload })

    if (error) {
      toast.error(existing ? 'Failed to update customer' : 'Failed to add customer')
    } else {
      toast.success(existing ? 'Customer updated' : 'Customer added')
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-bold text-gray-900">{existing ? 'Edit Customer' : 'Add Customer'}</h2>
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
            <Button type="submit" loading={loading}>{existing ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CustomersClient({ customers, companyId }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [modal, setModal] = useState<{ open: boolean; customer?: Customer | null }>({ open: false })
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      title: `Delete ${customer.name}?`,
      message: 'This cannot be undone. Customers with existing invoices cannot be deleted.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setDeleting(customer.id)
    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
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
      {modal.open && (
        <CustomerModal
          companyId={companyId}
          existing={modal.customer}
          onClose={() => setModal({ open: false })}
          onSaved={() => router.refresh()}
        />
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-xs">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">No customers yet.</p>
          <Button size="sm" onClick={() => setModal({ open: true })}>Add your first customer</Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden overflow-x-auto shadow-xs">
          <table>
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Email', 'Phone', 'Country', 'Added', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{customer.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{customer.country ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{formatDate(customer.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ open: true, customer })} className="text-gray-300 hover:text-gray-700 transition-colors p-1" aria-label="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(customer)} disabled={deleting === customer.id} className="text-gray-300 hover:text-red-500 transition-colors p-1 disabled:opacity-50" aria-label="Delete">
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
