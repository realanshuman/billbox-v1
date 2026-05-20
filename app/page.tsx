import Link from 'next/link'
import { Zap, Globe, Shield, Download, Check, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-900 rounded-sm flex-shrink-0" />
            <span className="text-sm font-bold tracking-tight text-gray-900">billbox</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              Start free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 mb-12">
            <span className="w-2 h-2 bg-green-500 rounded-sm flex-shrink-0" />
            free forever · no credit card required
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
            <span className="block text-gray-900">invoices</span>
            <span className="block text-gray-300">for digital</span>
            <span className="block text-gray-900">products</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed">
            professional invoicing built specifically for software, SaaS, and digital product sales.
            generate compliant PDFs in under 60 seconds.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              create invoice
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-200 text-sm text-gray-600 rounded hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              view sample
            </Link>
          </div>
        </div>
      </section>

      {/* Feature tiles */}
      <section className="px-6 py-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Zap,      title: '< 60 seconds', sub: 'Invoice creation' },
            { icon: Globe,    title: 'Digital-first', sub: 'Built for SaaS' },
            { icon: Shield,   title: 'Tax compliant', sub: 'GST & VAT ready' },
            { icon: Download, title: 'Instant export', sub: 'PDF & email' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="border border-gray-200 rounded-xl p-5">
              <Icon className="w-4 h-4 text-gray-500 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
          {[
            { value: '12k+', label: 'Invoices Created' },
            { value: '800+', label: 'Active Users' },
            { value: '85%',  label: 'Time Saved' },
          ].map(({ value, label }) => (
            <div key={label} className="px-8 text-center first:pl-0 last:pr-0">
              <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 px-6 border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">everything you need</h2>
            <p className="text-sm text-gray-500">designed for digital sellers — software, SaaS, and services.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'professional invoices',    desc: 'tax or proforma invoices in seconds. auto-numbered, beautifully formatted, PDF-ready.' },
              { title: 'send & remind',            desc: 'email invoices to clients. send payment reminders so you never chase manually.' },
              { title: 'track every payment',      desc: 'outstanding amounts, overdue invoices, and monthly revenue at a glance.' },
              { title: 'customer management',      desc: 'store client details once, reuse forever. full billing history per client.' },
              { title: 'product catalog',          desc: 'save your digital products with pricing and tax rates. add them in one click.' },
              { title: 'analytics & history',      desc: 'date-range reports, monthly revenue charts, and top customer breakdowns.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">simple pricing</h2>
            <p className="text-sm text-gray-500">start free. upgrade when you grow.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Starter */}
            <div className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-base font-bold text-gray-900 mb-1">Starter</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                $9<span className="text-sm font-normal text-gray-400"> / mo</span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {[
                  '50 invoices / month',
                  'Up to 20 customers',
                  'PDF export (Classic)',
                  'Send invoices by email',
                  'Payment reminders',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2.5 border border-gray-200 text-gray-900 text-xs font-medium rounded text-center hover:bg-gray-50 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-gray-900 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-gray-900 text-white text-[9px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Pro</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                $29<span className="text-sm font-normal text-gray-400"> / mo</span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {[
                  'Unlimited invoices',
                  'Unlimited customers',
                  'All PDF templates',
                  'Unlimited automation',
                  'Credit notes',
                  'Advanced branding',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2.5 bg-gray-900 text-white text-xs font-medium rounded text-center hover:bg-gray-700 transition-colors"
              >
                Start Pro trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">ready to get paid faster?</h2>
          <p className="text-sm text-gray-400 mb-8">join thousands of digital sellers who trust billbox.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm font-medium rounded hover:bg-gray-100 transition-colors"
          >
            start for free today
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
