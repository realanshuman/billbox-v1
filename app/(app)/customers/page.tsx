import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'
import { CustomersClient } from './customers-client'

export default async function CustomersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createServiceClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!company) redirect('/settings')

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{(customers ?? []).length} customer{(customers ?? []).length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <CustomersClient customers={customers ?? []} companyId={company.id} />
    </div>
  )
}
