import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from './products-client'
import type { Currency } from '@/lib/types'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, currency')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{(products ?? []).length} total</p>
        </div>
      </div>
      <ProductsClient
        products={products ?? []}
        companyId={company.id}
        defaultCurrency={company.currency as Currency}
      />
    </div>
  )
}
