import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NewInvoiceForm } from './new-invoice-form'

export default async function NewInvoicePage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createServiceClient()

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!company) redirect('/settings')

  const [{ data: customers }, { data: products }, { data: existing }] = await Promise.all([
    supabase.from('customers').select('id, name, email').eq('company_id', company.id).order('name'),
    supabase.from('products').select('*').eq('company_id', company.id).order('name'),
    supabase.from('invoices').select('number').eq('company_id', company.id),
  ])

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/invoices" className="text-gray-400 hover:text-gray-700 transition-colors text-sm">←</a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create a tax or proforma invoice</p>
        </div>
      </div>
      <NewInvoiceForm
        company={company}
        customers={customers ?? []}
        products={products ?? []}
        existingNumbers={(existing ?? []).map((i) => i.number)}
      />
    </div>
  )
}
