# BillBox

The fastest invoicing tool for digital sellers. Create, send, and track professional invoices in seconds.

Built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

## Features

- **Dashboard** — revenue, outstanding, and invoice stats at a glance
- **Invoices** — create tax/proforma invoices, filter by status, mark paid, cancel, send
- **Customers** — manage your client address book
- **Products** — reusable line items with tax rates
- **History** — full activity audit log
- **Settings** — company profile, invoice defaults, plan management

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of [`supabase/schema.sql`](./supabase/schema.sql) to create tables and Row Level Security policies.
3. Grab your project URL and anon key from **Project Settings → API**.
4. Add them to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the `billbox-v1` repository.
3. Vercel auto-detects Next.js — no build settings to change.
4. Under **Environment Variables**, add both keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**.

In Supabase, add your Vercel domain (e.g. `https://your-app.vercel.app`) under
**Authentication → URL Configuration → Site URL / Redirect URLs** so login works in production.

The `vercel.json` pins the deployment region to Mumbai (`bom1`) for low latency in India — change it if your users are elsewhere.
