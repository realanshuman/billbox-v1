'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Send, Bell, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { generateInvoicePDF } from '@/lib/pdf'
import toast from 'react-hot-toast'
import type { Invoice } from '@/lib/types'

interface Props {
  invoice: Invoice & {
    customer: { name: string; email: string; address?: string; city?: string; state?: string; country?: string; tax_id?: string }
    items: Invoice['items']
  }
  company: {
    name: string
    email: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    tax_id?: string
    plan: string
  }
}

const PDF_TEMPLATES = [
  { value: 'classic', label: 'Classic', pro: false },
  { value: 'minimal', label: 'Minimal', pro: true },
  { value: 'modern', label: 'Modern', pro: true },
  { value: 'executive', label: 'Executive', pro: true },
  { value: 'compact', label: 'Compact', pro: true },
]

export function InvoiceActions({ invoice, company }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [template, setTemplate] = useState('classic')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function updateStatus(status: string) {
    setLoading(status)
    const supabase = createClient()
    const { error } = await supabase.from('invoices').update({ status }).eq('id', invoice.id)
    if (error) {
      toast.error('Failed to update status')
    } else {
      await supabase.from('history').insert({
        company_id: invoice.company_id,
        invoice_id: invoice.id,
        action: `marked_${status}`,
        description: `Invoice ${invoice.number} marked as ${status}`,
      })
      toast.success(`Marked as ${status}`)
      router.refresh()
    }
    setLoading(null)
  }

  async function handleSend() {
    setLoading('send')
    const supabase = createClient()
    await supabase.from('history').insert({
      company_id: invoice.company_id,
      invoice_id: invoice.id,
      action: 'sent',
      description: `Invoice ${invoice.number} sent to ${invoice.customer?.email ?? 'customer'}`,
    })
    const { error } = await supabase.from('invoices').update({ status: 'pending' }).eq('id', invoice.id)
    if (!error) {
      toast.success('Invoice sent!')
      router.refresh()
    }
    setLoading(null)
  }

  async function handleRemind() {
    const supabase = createClient()
    await supabase.from('history').insert({
      company_id: invoice.company_id,
      invoice_id: invoice.id,
      action: 'reminded',
      description: `Payment reminder sent for ${invoice.number}`,
    })
    toast.success('Reminder sent!')
  }

  function handleDownloadPDF() {
    if (!invoice.items) { toast.error('No items to export'); return }
    generateInvoicePDF({
      invoice: invoice as Parameters<typeof generateInvoicePDF>[0]['invoice'],
      company,
      template: 'classic',
    })
  }

  const templateLabel = PDF_TEMPLATES.find((t) => t.value === template)?.label ?? 'Classic'
  const canMarkPaid = invoice.status === 'pending' || invoice.status === 'overdue'
  const canCancel = invoice.status !== 'cancelled' && invoice.status !== 'paid'
  const canSend = invoice.status === 'draft'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* PDF download + template selector */}
      <div className="relative flex items-center" ref={dropdownRef}>
        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-none border-0 gap-1.5"
            onClick={handleDownloadPDF}
          >
            <Download className="w-3.5 h-3.5" />
            PDF · {templateLabel}
          </Button>
          <div className="w-px h-6 bg-gray-200" />
          <Button
            variant="secondary"
            size="sm"
            className="rounded-none border-0 px-2"
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {dropdownOpen && (
          <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
            {PDF_TEMPLATES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  if (t.pro && company.plan !== 'pro') {
                    toast('Upgrade to Pro to use this template', { icon: '🔒' })
                    return
                  }
                  setTemplate(t.value)
                  setDropdownOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                  template === t.value
                    ? 'bg-gray-50 font-semibold text-gray-900'
                    : t.pro && company.plan !== 'pro'
                    ? 'text-gray-400 cursor-default'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={t.pro && company.plan !== 'pro' ? 'text-gray-400' : ''}>{t.label}</span>
                {t.pro && <Badge variant="pro" className="text-[9px] px-1.5 py-0.5">PRO</Badge>}
              </button>
            ))}
          </div>
        )}
      </div>

      {canSend && (
        <Button
          variant="secondary"
          size="sm"
          loading={loading === 'send'}
          onClick={handleSend}
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </Button>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={handleRemind}
      >
        <Bell className="w-3.5 h-3.5" />
        Remind
      </Button>

      {canMarkPaid && (
        <Button
          variant="success"
          size="sm"
          loading={loading === 'paid'}
          onClick={() => updateStatus('paid')}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Mark Paid
        </Button>
      )}

      {canCancel && (
        <Button
          variant="danger"
          size="sm"
          loading={loading === 'cancelled'}
          onClick={() => updateStatus('cancelled')}
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </Button>
      )}
    </div>
  )
}
