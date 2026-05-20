import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewInvoiceForm } from './new-invoice-form'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const [{ data: customers }, { data: products }, { count }] = await Promise.all([
    supabase.from('customers').select('id, name, email').eq('company_id', company.id).order('name'),
    supabase.from('products').select('*').eq('company_id', company.id).order('name'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
        <p className="text-sm text-gray-400 mt-0.5">Create a tax or proforma invoice</p>
      </div>
      <NewInvoiceForm
        company={company}
        customers={customers ?? []}
        products={products ?? []}
        invoiceCount={(count ?? 0) + 1}
      />
    </div>
  )
}
