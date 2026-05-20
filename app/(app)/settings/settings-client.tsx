'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Company } from '@/lib/types'

interface Props {
  company: Company | null
  userId: string
}

const CURRENCIES = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
]

export function SettingsClient({ company, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: company?.name ?? '',
    email: company?.email ?? '',
    address: company?.address ?? '',
    city: company?.city ?? '',
    state: company?.state ?? '',
    postal_code: company?.postal_code ?? '',
    country: company?.country ?? 'India',
    tax_id: company?.tax_id ?? '',
    invoice_prefix: company?.invoice_prefix ?? 'INV',
    currency: company?.currency ?? 'INR',
  })

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (company) {
      const { error } = await supabase.from('companies').update(form).eq('id', company.id)
      if (error) {
        toast.error('Failed to save changes')
      } else {
        toast.success('Settings saved')
        router.refresh()
      }
    } else {
      const { error } = await supabase.from('companies').insert({ ...form, user_id: userId, plan: 'starter' })
      if (error) {
        toast.error('Failed to create company')
      } else {
        toast.success('Company created')
        router.refresh()
      }
    }
    setLoading(false)
  }

  const previewNumber = `${form.invoice_prefix}-${new Date().getFullYear()}-0001`

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Plan */}
      <div className="border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Current Plan</p>
          <Crown className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 capitalize">{company?.plan ?? 'Starter'}</h2>
            <p className="text-sm text-gray-400">{company?.plan === 'pro' ? '$29.99/month' : '$9.00/month'}</p>
          </div>
          <div className="flex gap-2 text-right text-xs text-gray-400">
            {company?.plan === 'pro' ? (
              <>
                <span>Unlimited invoices/mo</span>
                <span className="mx-1">·</span>
                <span>Unlimited customers</span>
              </>
            ) : (
              <>
                <span>50 invoices/mo</span>
                <span className="mx-1">·</span>
                <span>20 customers</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Starter card */}
          <div className={`border rounded-lg p-4 ${company?.plan !== 'pro' ? 'border-gray-900' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-gray-900">Starter</span>
              <span className="text-sm text-gray-500">$9 / month</span>
            </div>
            <ul className="space-y-1 text-xs text-gray-500 mb-3">
              <li>Send invoices by email</li>
              <li>Payment reminders</li>
              <li>Recurring invoices</li>
            </ul>
            {company?.plan !== 'pro' ? (
              <div className="w-full py-1.5 text-center text-xs text-gray-400 border border-gray-200 rounded">Current plan</div>
            ) : (
              <button type="button" className="w-full py-1.5 text-center text-xs text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                Downgrade
              </button>
            )}
          </div>

          {/* Pro card */}
          <div className={`border rounded-lg p-4 ${company?.plan === 'pro' ? 'border-gray-900' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-gray-900">Pro</span>
              <span className="text-sm text-gray-500">$29 / month</span>
            </div>
            <ul className="space-y-1 text-xs text-gray-500 mb-3">
              <li>Unlimited automation</li>
              <li>Credit notes</li>
              <li>Advanced branding controls</li>
            </ul>
            {company?.plan === 'pro' ? (
              <div className="w-full py-1.5 text-center text-xs text-gray-400 border border-gray-200 rounded">Current plan</div>
            ) : (
              <button type="button" className="w-full py-1.5 text-center text-xs font-medium text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Profile */}
      <div className="border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company Profile</p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company Name *" value={form.name} onChange={update('name')} required placeholder="Acme Inc." />
          <Input label="Business Email" type="email" value={form.email} onChange={update('email')} placeholder="hello@acme.com" />
        </div>
        <Input label="Address" value={form.address} onChange={update('address')} placeholder="Street address" />
        <div className="grid grid-cols-3 gap-4">
          <Input label="City" value={form.city} onChange={update('city')} placeholder="Dehradun" />
          <Input label="State" value={form.state} onChange={update('state')} placeholder="Uttarakhand" />
          <Input label="Postal Code" value={form.postal_code} onChange={update('postal_code')} placeholder="248002" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Country" value={form.country} onChange={update('country')} placeholder="India" />
          <Input label="GST / Tax ID" value={form.tax_id} onChange={update('tax_id')} placeholder="29ABCDE1234F1Z5" />
        </div>
      </div>

      {/* Invoice Defaults */}
      <div className="border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Invoice Defaults</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Invoice Prefix"
            value={form.invoice_prefix}
            onChange={update('invoice_prefix')}
            placeholder="INV"
            hint={`Invoice numbers will be formatted as ${previewNumber}`}
          />
          <Select
            label="Default Currency"
            value={form.currency}
            onChange={update('currency')}
            options={CURRENCIES}
          />
        </div>
      </div>

      <Button type="submit" loading={loading}>
        Save Changes
      </Button>
    </form>
  )
}
