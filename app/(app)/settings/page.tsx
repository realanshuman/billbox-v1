import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createServiceClient()

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your company profile and billing</p>
      </div>
      <SettingsClient company={company} userId={userId} />
    </div>
  )
}
