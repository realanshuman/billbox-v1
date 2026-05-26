'use client'

import { useAuth } from '@clerk/nextjs'
import { createBrowserClient } from '@supabase/ssr'

export function useSupabase() {
  const { getToken } = useAuth()

  return async () => {
    const token = await getToken({ template: 'supabase' })
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      }
    )
  }
}
