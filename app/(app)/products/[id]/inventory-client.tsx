'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Package,
  Download,
  Plus,
  Search,
  CheckCircle2,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import type { InventoryItem, InventoryStatus } from '@/lib/inventory-types'

interface Props {
  product: Product & { sku?: string; brand?: string; image_url?: string }
  items: InventoryItem[]
  currency: Currency
}

const STATUS_CONFIG: Record<
  InventoryStatus,
  { label: string; color: string; border: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  available: {
    label: 'Available',
    color: 'emerald',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  sold: {
    label: 'Sold',
    color: 'slate',
    border: 'border-l-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    icon: ShoppingCart,
  },
  reserved: {
    label: 'Reserved',
    color: 'amber',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  invalid: {
    label: 'Invalid',
    color: 'red',
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
}

const STATUS_BAR_COLORS: Record<InventoryStatus, string> = {
  available: 'bg-emerald-500',
  sold: 'bg-slate-700',
  reserved: 'bg-amber-400',
  invalid: 'bg-red-400',
}

// Demo data when no inventory items exist
const DEMO_ITEMS: InventoryItem[] = [
  ...Array.from({ length: 21 }, (_, i) => ({
    id: `a${i}`, product_id: '', company_id: '', code: `GK-${(Math.random() * 1e10).toString(36).toUpperCase().slice(0, 8)}`,
    status: 'available' as InventoryStatus, created_at: new Date(Date.now() - i * 86400000).toISOString(),
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    id: `r${i}`, product_id: '', company_id: '', code: `GK-${(Math.random() * 1e10).toString(36).toUpperCase().slice(0, 8)}`,
    status: 'reserved' as InventoryStatus, reserved_for: `Order #${1000 + i}`, created_at: new Date(Date.now() - i * 86400000).toISOString(),
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `inv${i}`, product_id: '', company_id: '', code: `GK-${(Math.random() * 1e10).toString(36).toUpperCase().slice(0, 8)}`,
    status: 'invalid' as InventoryStatus, notes: 'Failed validation', created_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `s${i}`, product_id: '', company_id: '', code: `GK-${(Math.random() * 1e10).toString(36).toUpperCase().slice(0, 8)}`,
    status: 'sold' as InventoryStatus, sold_at: new Date(Date.now() - i * 86400000).toISOString(), created_at: new Date(Date.now() - (i + 30) * 86400000).toISOString(),
  })),
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success('Copied'); setTimeout(() => setCopied(false), 1500) }}
      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 transition-all"
      aria-label="Copy code"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function StatusPill({ status }: { status: InventoryStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function InventoryClient({ product, items: rawItems, currency }: Props) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<InventoryStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  // Use demo data if no real inventory yet
  const allItems = rawItems.length > 0 ? rawItems : DEMO_ITEMS

  const stats = useMemo(() => {
    const counts = { available: 0, sold: 0, reserved: 0, invalid: 0 }
    for (const item of allItems) counts[item.status]++
    return { ...counts, total: allItems.length }
  }, [allItems])

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (activeFilter !== 'all' && item.status !== activeFilter) return false
      if (search && !item.code.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allItems, activeFilter, search])

  const paginated = filtered.slice(0, page * PER_PAGE)
  const hasMore = paginated.length < filtered.length

  function exportCSV() {
    const header = ['Code', 'Status', 'Notes', 'Reserved For', 'Sold At', 'Created At']
    const rows = filtered.map((i) => [i.code, i.status, i.notes ?? '', i.reserved_for ?? '', i.sold_at ?? '', i.created_at])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${product.name}-inventory.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported')
  }

  const stockStatus =
    stats.available === 0 ? 'Out of Stock' :
    stats.available < stats.total * 0.1 ? 'Low Stock' : 'In Stock'

  const stockStatusStyle =
    stockStatus === 'Out of Stock' ? 'bg-red-50 text-red-700' :
    stockStatus === 'Low Stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 min-w-0">
          <Link href="/products" className="text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0">
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span className="text-sm font-semibold text-gray-900 truncate">{product.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span className="text-sm text-gray-400 shrink-0">Inventory</span>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/products`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            View Product
          </Link>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Inventory
          </button>
        </div>
      </div>

      {/* ── Product card ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
          {/* Image / initials */}
          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-base font-bold text-gray-900 truncate">{product.name}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${stockStatusStyle}`}>
                {stockStatus}
              </span>
              {product.sku && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-gray-100 text-gray-500 border border-gray-200">
                  {product.sku}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
              {product.brand && <span>{product.brand}</span>}
              {product.brand && <span className="text-gray-200">·</span>}
              <span><strong className="text-gray-700 font-semibold">{stats.total}</strong> total units</span>
              <span className="text-gray-200">·</span>
              <span><strong className="text-emerald-600 font-semibold">{stats.available}</strong> available</span>
              <span className="text-gray-200">·</span>
              <span>{formatCurrency(product.unit_price, currency)} / unit</span>
            </div>
          </div>

          {/* Right: price + link */}
          <div className="shrink-0 hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Unit Price</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(product.unit_price, currency)}</p>
            </div>
          </div>
        </div>

        {/* Visual breakdown bar */}
        {stats.total > 0 && (
          <div className="px-5 pb-4">
            <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
              {(['sold', 'available', 'reserved', 'invalid'] as InventoryStatus[]).map((s) => {
                const pct = (stats[s] / stats.total) * 100
                if (pct === 0) return null
                return (
                  <div
                    key={s}
                    className={`${STATUS_BAR_COLORS[s]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${STATUS_CONFIG[s].label}: ${stats[s]} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {(['sold', 'available', 'reserved', 'invalid'] as InventoryStatus[]).map((s) => {
                if (stats[s] === 0) return null
                return (
                  <button
                    key={s}
                    onClick={() => setActiveFilter(activeFilter === s ? 'all' : s)}
                    className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_BAR_COLORS[s]}`} />
                    <span className={activeFilter === s ? 'font-semibold text-gray-900' : ''}>{STATUS_CONFIG[s].label}</span>
                    <span className="text-gray-400">{stats[s]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['available', 'sold', 'reserved', 'invalid'] as InventoryStatus[]).map((status) => {
          const cfg = STATUS_CONFIG[status]
          const Icon = cfg.icon
          const count = stats[status]
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
          const isActive = activeFilter === status

          return (
            <button
              key={status}
              onClick={() => setActiveFilter(isActive ? 'all' : status)}
              className={`text-left bg-white border rounded-xl p-4 shadow-xs transition-all border-l-[3px] ${cfg.border} ${
                isActive ? 'ring-2 ring-gray-900 ring-offset-1 border-gray-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">{cfg.label}</p>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                </div>
              </div>

              <p className="text-2xl font-bold text-gray-900 leading-none mb-3 tabular-nums">{count}</p>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${STATUS_BAR_COLORS[status]} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 tabular-nums">
                  <span className="font-semibold text-gray-600">{pct.toFixed(1)}%</span> of total
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Inventory list ───────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
        {/* Table toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Inventory
            </p>
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full tabular-nums">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status filter pills */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  activeFilter === 'all' ? 'bg-white text-gray-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >All</button>
              {(['available', 'sold', 'reserved', 'invalid'] as InventoryStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveFilter(activeFilter === s ? 'all' : s)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                    activeFilter === s ? 'bg-white text-gray-900 shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >{STATUS_CONFIG[s].label}</button>
              ))}
            </div>

            {/* Mobile filter */}
            <div className="sm:hidden flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as InventoryStatus | 'all')}
                className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none"
              >
                <option value="all">All statuses</option>
                {(['available', 'sold', 'reserved', 'invalid'] as InventoryStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search codes..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 w-36 sm:w-44 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No inventory units found.</p>
            {activeFilter !== 'all' && (
              <button onClick={() => setActiveFilter('all')} className="mt-2 text-xs text-gray-500 hover:text-gray-900 underline">Clear filter</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Code', 'Status', 'Notes / Reference', 'Date Added'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => {
                    const cfg = STATUS_CONFIG[item.status]
                    return (
                      <tr key={item.id} className="group border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-mono font-medium text-gray-900">{item.code}</span>
                            <CopyButton text={item.code} />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 max-w-xs truncate">
                          {item.reserved_for ? (
                            <span className="flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 text-amber-500 shrink-0" />
                              {item.reserved_for}
                            </span>
                          ) : item.sold_at ? (
                            <span className="text-gray-400">Sold {formatDate(item.sold_at)}</span>
                          ) : item.notes ? (
                            <span className="text-gray-400 italic">{item.notes}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-400 whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                >
                  Show {Math.min(PER_PAGE, filtered.length - paginated.length)} more
                  <span className="text-gray-400 ml-1">({filtered.length - paginated.length} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
