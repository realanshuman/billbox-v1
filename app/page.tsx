import Link from 'next/link'
import {
  Zap,
  Send,
  BarChart3,
  Check,
  ArrowRight,
  FileText,
  Users,
  Package,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-5 h-5 bg-gray-900 rounded-sm" />
            <span className="text-sm font-bold tracking-tight text-gray-900">billbox</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Built for digital sellers
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
            Invoice smarter.
            <br />
            <span className="text-gray-400">Get paid faster.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            The simplest way to create professional invoices, send them to clients,
            and track every payment — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card required. Free plan available.</p>
        </div>
      </section>

      {/* App Preview */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-xl shadow-gray-100">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <div className="flex-1 mx-4 bg-white rounded border border-gray-200 px-3 py-1 text-xs text-gray-400 text-center">
                app.billbox.io/dashboard
              </div>
            </div>
            <div className="bg-white flex min-h-96">
              <div className="w-44 border-r border-gray-100 p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 bg-gray-900 rounded-sm" />
                  <span className="text-xs font-bold text-gray-900">billbox</span>
                </div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">Company</p>
                <p className="text-xs font-medium text-gray-600">Acme Inc.</p>
                <div className="bg-gray-900 text-white text-[11px] font-medium rounded px-3 py-1.5 text-center">
                  + New Invoice
                </div>
                {['Dashboard', 'Invoices', 'Customers', 'Products'].map((item, i) => (
                  <div
                    key={item}
                    className={`text-xs px-2 py-1.5 rounded ${i === 0 ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-400'}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Wednesday, 20 May</p>
                    <h2 className="text-xl font-bold text-gray-900">Good morning, Ansh.</h2>
                  </div>
                  <div className="bg-gray-900 text-white text-[11px] font-medium rounded px-3 py-1.5">
                    + New Invoice
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Total Revenue', value: '₹3,540', sub: '3 paid' },
                    { label: 'Total Invoices', value: '4', sub: '1 pending' },
                    { label: 'Outstanding', value: '₹2,360', sub: '1 overdue' },
                    { label: 'Draft', value: '0', sub: 'awaiting issue' },
                  ].map((s) => (
                    <div key={s.label} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-[8px] text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="text-base font-bold text-gray-900">{s.value}</p>
                      <p className="text-[9px] text-gray-400">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-2">Recent Invoices</p>
                <div className="border border-gray-100 rounded overflow-hidden">
                  {[
                    { num: 'INV-2026-0006', customer: 'anshuman', amount: '₹1,180', status: 'overdue', cls: 'text-red-600 border-red-200 bg-red-50' },
                    { num: 'INV-2026-0005', customer: 'Vansh Goyal', amount: '₹1,180', status: 'pending', cls: 'text-amber-600 border-amber-200 bg-amber-50' },
                    { num: 'INV-2026-0004', customer: 'Vansh Goyal', amount: '₹1,180', status: 'paid', cls: 'text-green-700 border-green-200 bg-green-50' },
                  ].map((row) => (
                    <div key={row.num} className="flex items-center px-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-medium text-gray-700 w-32">{row.num}</span>
                      <span className="text-xs text-gray-400 flex-1">{row.customer}</span>
                      <span className="text-xs font-medium text-gray-900 w-16 text-right">{row.amount}</span>
                      <span className={`ml-3 text-[8px] font-semibold uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${row.cls}`}>
                        + {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to get paid</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Designed specifically for digital sellers — software, SaaS, digital downloads, and services.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Professional invoices',
                desc: 'Create tax or proforma invoices in seconds. Auto-numbered, beautifully formatted, PDF-ready.',
              },
              {
                icon: Send,
                title: 'Send & remind',
                desc: 'Email invoices directly to clients. Send payment reminders automatically so you never chase manually.',
              },
              {
                icon: BarChart3,
                title: 'Track every rupee',
                desc: 'Dashboard shows outstanding amounts, overdue invoices, and monthly revenue at a glance.',
              },
              {
                icon: Users,
                title: 'Customer management',
                desc: 'Store client details once, reuse forever. Full address book with billing history per client.',
              },
              {
                icon: Package,
                title: 'Product catalog',
                desc: 'Save your digital products with pricing and tax rates. Add them to invoices in one click.',
              },
              {
                icon: Zap,
                title: 'Lightning fast',
                desc: 'Optimized for speed. Create an invoice and send it in under 60 seconds. No bloat, no friction.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
            <p className="text-gray-500">Start free. Upgrade when you grow.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Starter</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                $9<span className="text-base font-normal text-gray-400"> / mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '50 invoices / month',
                  'Up to 20 customers',
                  'PDF export (Classic)',
                  'Send invoices by email',
                  'Payment reminders',
                  'Recurring invoices',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2.5 border border-gray-900 text-gray-900 text-sm font-medium rounded text-center hover:bg-gray-50 transition-colors"
              >
                Get started
              </Link>
            </div>

            <div className="border-2 border-gray-900 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gray-900 text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Pro</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                $29<span className="text-base font-normal text-gray-400"> / mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited invoices',
                  'Unlimited customers',
                  'All PDF templates',
                  'Unlimited automation',
                  'Credit notes',
                  'Advanced branding controls',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded text-center hover:bg-gray-800 transition-colors"
              >
                Start Pro trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get paid faster?</h2>
          <p className="text-gray-400 mb-8">Join thousands of digital sellers who trust BillBox to run their billing.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-medium rounded hover:bg-gray-100 transition-colors"
          >
            Start for free today
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-900 rounded-sm" />
            <span className="text-sm font-bold text-gray-900">billbox</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 BillBox. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
