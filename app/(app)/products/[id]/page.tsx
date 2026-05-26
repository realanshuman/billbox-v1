import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'
import { InventoryClient } from './inventory-client'
import type { Currency } from '@/lib/types'
import type { InventoryItem } from '@/lib/inventory-types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductInventoryPage({ params }: Props) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createServiceClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id, currency')
    .eq('user_id', userId)
    .single()

  if (!company) redirect('/settings')

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (!product) notFound()

  // Fetch inventory items if the table exists (graceful fallback to empty)
  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <InventoryClient
      product={product}
      items={(items ?? []) as InventoryItem[]}
      currency={company.currency as Currency}
    />
  )
}
