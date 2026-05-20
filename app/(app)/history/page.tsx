import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { History } from 'lucide-react'
import type { HistoryEntry } from '@/lib/types'

const actionLabels: Record<string, { label: string; color: string }> = {
  created: { label: 'Invoice created', color: 'text-gray-500' },
  sent: { label: 'Invoice sent', color: 'text-blue-600' },
  marked_paid: { label: 'Marked as paid', color: 'text-green-700' },
  marked_pending: { label: 'Marked as pending', color: 'text-amber-600' },
  marked_cancelled: { label: 'Marked as cancelled', color: 'text-gray-400' },
  marked_overdue: { label: 'Marked as overdue', color: 'text-red-600' },
  reminded: { label: 'Reminder sent', color: 'text-purple-600' },
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: entries } = await supabase
    .from('history')
    .select('*, invoice:invoices(id, number, status)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const history = (entries ?? []) as HistoryEntry[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-400 mt-0.5">Activity log for your account</p>
      </div>

      {history.length === 0 ? (
        <div className="border border-gray-100 rounded-xl p-12 text-center">
          <History className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No activity yet.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table>
            <thead>
              <tr className="border-b border-gray-100">
                {['Action', 'Invoice', 'Description', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const meta = actionLabels[entry.action] ?? { label: entry.action, color: 'text-gray-500' }
                return (
                  <tr key={entry.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.invoice ? (
                        <Link
                          href={`/invoices/${entry.invoice.id}`}
                          className="text-sm text-gray-700 hover:underline font-medium"
                        >
                          {entry.invoice.number}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{entry.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatTs(entry.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
