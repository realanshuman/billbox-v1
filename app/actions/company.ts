'use server'

import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function createCompany(data: { name: string; email: string }) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = createServiceClient()

  const existing = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing.data) return { id: existing.data.id }

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      name: data.name,
      email: data.email,
      invoice_prefix: 'INV',
      currency: 'INR',
      plan: 'starter',
    })
    .select('id')
    .single()

  if (error) throw error
  return company
}
