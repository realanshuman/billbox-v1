import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { History } from 'lucide-react'
import type { HistoryEntry } from '@/lib/types'

const actionMeta: Record<string, { label: string; color: string; dot: string }> = {
  created:         { label: 'Invoice created',    color: 'text-gray-700',   dot: 'bg-gray-400' },
  sent:            { label: 'Invoice sent',        color: 'text-blue-600',   dot: 'bg-blue-400' },
  marked_paid:     { label: 'Marked as paid',      color: 'text-green-700',  dot: 'bg-green-500' },
  marked_pending:  { label: 'Marked as pending',   color: 'text-amber-600',  dot: 'bg-amber-400' },
  marked_cancelled:{ label: 'Marked as cancelled', color: 'text-gray-400',   dot: 'bg-gray-300' },
  marked_overdue:  { label: 'Marked as overdue',   color: 'text-red-600',    dot: 'bg-red-400' },
  reminded:        { label: 'Reminder sent',       color: 'text-purple-600', dot: 'bg-purple-400' },
  edited:          { label: 'Invoice edited',      color: 'text-gray-600',   dot: 'bg-gray-400' },
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

function formatDay(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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

  // Group by calendar day
  const grouped = new Map<string, HistoryEntry[]>()
  for (const entry of history) {
    const day = entry.created_at.split('T')[0]
    if (!grouped.has(day)) grouped.set(day, [])
    grouped.get(day)!.push(entry)
  }

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
        <div className="space-y-8">
          {[...grouped.entries()].map(([day, dayEntries]) => (
            <div key={day}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3 pl-1">
                {formatDay(day + 'T00:00:00')}
              </p>
              <div className="border border-gray-100 rounded-xl px-5 py-4">
                {dayEntries.map((entry, idx) => {
                  const meta = actionMeta[entry.action] ?? { label: entry.action, color: 'text-gray-500', dot: 'bg-gray-300' }
                  const isLast = idx === dayEntries.length - 1
                  return (
                    <div key={entry.id} className="flex gap-3.5">
                      {/* Timeline column */}
                      <div className="flex flex-col items-center pt-1 flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        {!isLast && <span className="w-px flex-1 bg-gray-100 mt-1.5 mb-0.5 min-h-[16px]" />}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 min-w-0 ${!isLast ? 'pb-4' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                            {entry.invoice && (
                              <Link
                                href={`/invoices/${entry.invoice.id}`}
                                className="ml-2 text-[11px] text-gray-400 hover:text-gray-700 hover:underline transition-colors"
                              >
                                {entry.invoice.number}
                              </Link>
                            )}
                            {entry.description && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.description}</p>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5 flex-shrink-0">
                            {new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
