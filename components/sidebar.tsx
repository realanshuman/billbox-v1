'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  History,
  Settings,
  Plus,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Company } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  company: Company | null
  userEmail: string
}

export function Sidebar({ company, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-44 flex flex-col bg-white border-r border-gray-100 z-20">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-5 h-5 bg-gray-900 rounded-sm flex-shrink-0" />
          <span className="text-sm font-bold tracking-tight text-gray-900">billbox</span>
        </Link>
      </div>

      {/* Company */}
      <div className="px-4 pb-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Company</p>
        <p className="text-xs font-medium text-gray-700 truncate">{company?.name || 'My Company'}</p>
      </div>

      {/* New Invoice */}
      <div className="px-3 pb-3">
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 w-full bg-gray-900 text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Invoice
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <div className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-50">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {company?.plan === 'pro' ? 'PRO' : 'Starter'} plan
          </span>
          <RefreshCw className="w-3 h-3 text-gray-400" />
        </div>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 uppercase flex-shrink-0">
            {userEmail.charAt(0)}
          </span>
          <span className="text-[10px] text-gray-500 truncate">{userEmail}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
