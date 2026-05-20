import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 h-14 flex items-center border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-5 h-5 bg-gray-900 rounded-sm" />
          <span className="text-sm font-bold tracking-tight text-gray-900">billbox</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  )
}
