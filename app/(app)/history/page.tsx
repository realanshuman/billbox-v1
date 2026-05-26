import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'
import { HistoryAnalyticsClient } from './history-client'
import type { Currency } from '@/lib/types'

export default async function HistoryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createServiceClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id, currency')
    .eq('user_id', userId)
    .single()

  if (!company) redirect('/settings')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, name)')
    .eq('company_id', company.id)
    .order('issue_date', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (invoices ?? []) as any[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">History & Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track revenue, spot trends, and export your data</p>
      </div>
      <HistoryAnalyticsClient invoices={list} currency={(company.currency as Currency) ?? 'INR'} />
    </div>
  )
}
