-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies (one per user for MVP)
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  email text not null,
  address text,
  city text,
  state text,
  postal_code text,
  country text default 'India',
  tax_id text,
  invoice_prefix text default 'INV',
  currency text default 'INR',
  plan text default 'starter' check (plan in ('starter', 'pro')),
  created_at timestamptz default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  country text,
  tax_id text,
  created_at timestamptz default now()
);

-- Products (reusable line items)
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  description text,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  currency text default 'INR',
  created_at timestamptz default now()
);

-- Invoices
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete restrict not null,
  number text not null,
  type text not null default 'tax' check (type in ('tax', 'proforma')),
  status text not null default 'draft' check (status in ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date,
  currency text default 'INR',
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  unique(company_id, number)
);

-- Invoice line items
create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  name text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  total numeric(12,2) not null default 0
);

-- Activity history
create table if not exists history (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  invoice_id uuid references invoices(id) on delete set null,
  action text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Row Level Security
alter table companies enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table history enable row level security;

-- RLS Policies: users can only access their own company's data
create policy "companies_own" on companies for all using (user_id = auth.uid());

create policy "customers_own" on customers for all using (
  company_id in (select id from companies where user_id = auth.uid())
);

create policy "products_own" on products for all using (
  company_id in (select id from companies where user_id = auth.uid())
);

create policy "invoices_own" on invoices for all using (
  company_id in (select id from companies where user_id = auth.uid())
);

create policy "invoice_items_own" on invoice_items for all using (
  invoice_id in (
    select id from invoices where company_id in (
      select id from companies where user_id = auth.uid()
    )
  )
);

create policy "history_own" on history for all using (
  company_id in (select id from companies where user_id = auth.uid())
);
