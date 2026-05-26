import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const [user, supabase] = await Promise.all([
    currentUser(),
    Promise.resolve(createServiceClient()),
  ])

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single()

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? ''

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Sidebar company={company} userEmail={userEmail} />
      <main className="pt-12 md:pt-0 md:ml-44 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
