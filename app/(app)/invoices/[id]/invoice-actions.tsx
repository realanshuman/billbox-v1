'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Send, Bell, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Invoice } from '@/lib/types'

interface Props {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    const supabase = createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoice.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      // Log to history
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
      description: `Invoice ${invoice.number} sent to customer`,
    })
    await updateStatus('pending')
    toast.success('Invoice sent!')
    setLoading(null)
  }

  const canMarkPaid = invoice.status === 'pending' || invoice.status === 'overdue'
  const canCancel = invoice.status !== 'cancelled' && invoice.status !== 'paid'
  const canSend = invoice.status === 'draft'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* PDF download */}
      <div className="flex items-center gap-0 border border-gray-200 rounded overflow-hidden">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-none border-0 gap-1.5"
          onClick={() => window.print()}
        >
          <Download className="w-3.5 h-3.5" />
          PDF · Classic
        </Button>
        <div className="w-px h-6 bg-gray-200" />
        <Button variant="secondary" size="sm" className="rounded-none border-0 px-2">
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {canSend && (
        <Button
          variant="secondary"
          size="sm"
          loading={loading === 'pending'}
          onClick={handleSend}
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </Button>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => toast('Reminder sent!')}
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
