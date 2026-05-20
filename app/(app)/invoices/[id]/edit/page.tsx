import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditInvoiceForm } from './edit-invoice-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/settings')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (!invoice) notFound()

  // Only draft invoices can be edited
  if (invoice.status !== 'draft') redirect(`/invoices/${id}`)

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from('customers').select('id, name, email').eq('company_id', company.id).order('name'),
    supabase.from('products').select('*').eq('company_id', company.id).order('name'),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="text-sm text-gray-400 mt-0.5">{invoice.number}</p>
      </div>
      <EditInvoiceForm
        company={company}
        invoice={invoice}
        customers={customers ?? []}
        products={products ?? []}
      />
    </div>
  )
}
