'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  History,
  Settings,
  Plus,
  LogOut,
  Menu,
  X,
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

function SidebarContent({
  company,
  userEmail,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2 group" onClick={onNavigate}>
          <span className="w-5 h-5 bg-gray-900 rounded-sm flex-shrink-0 group-hover:bg-gray-700 transition-colors" />
          <span className="text-sm font-bold tracking-tight text-gray-900">billbox</span>
        </Link>
      </div>

      {/* Company */}
      <div className="px-4 pb-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Workspace</p>
        <p className="text-xs font-medium text-gray-700 truncate">{company?.name || 'My Company'}</p>
      </div>

      {/* New Invoice */}
      <div className="px-3 pb-4">
        <Link
          href="/invoices/new"
          onClick={onNavigate}
          className="flex items-center justify-center gap-1.5 w-full bg-gray-900 text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-700 transition-colors"
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
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-gray-900 rounded-full" />
              )}
              <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-gray-700' : 'text-gray-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <span className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
            {userEmail.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-500 truncate leading-tight">{userEmail}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 leading-tight">
              {company?.plan === 'pro' ? 'Pro' : 'Starter'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ company, userEmail }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 w-44 hidden md:flex flex-col bg-white border-r border-gray-100 z-20">
        <SidebarContent company={company} userEmail={userEmail} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-4 h-4 bg-gray-900 rounded-sm" />
          <span className="text-sm font-bold text-gray-900">billbox</span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-100 z-30 flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-12 flex items-center px-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-900 rounded-sm" />
            <span className="text-sm font-bold text-gray-900">billbox</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent
            company={company}
            userEmail={userEmail}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </aside>
    </>
  )
}
