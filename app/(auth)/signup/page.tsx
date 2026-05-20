'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create company record
      await supabase.from('companies').insert({
        user_id: data.user.id,
        name: form.company,
        email: form.email,
        invoice_prefix: 'INV',
        currency: 'INR',
        plan: 'starter',
      })

      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6">Start invoicing in minutes</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            id="company"
            label="Company name"
            type="text"
            placeholder="Acme Inc."
            value={form.company}
            onChange={update('company')}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={update('password')}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="text-[11px] text-gray-400 mt-4 text-center leading-relaxed">
          By signing up you agree to our terms of service and privacy policy.
        </p>
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-gray-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
