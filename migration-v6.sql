-- =============================================
-- SULALAH v6 — Payment & Premium
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambah kolom premium ke profiles
alter table profiles add column if not exists is_premium boolean default false;
alter table profiles add column if not exists premium_since timestamp with time zone;
alter table profiles add column if not exists premium_order_id text;

-- 2. Tabel transaksi pembayaran
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  order_id text unique not null,
  amount int not null default 29000,
  status text check (status in ('pending','paid','failed','expired')) default 'pending',
  payment_type text,
  midtrans_token text,
  midtrans_redirect_url text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table payments enable row level security;

create policy "Users can view own payments"
  on payments for select using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on payments for insert with check (auth.uid() = user_id);

-- Index
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_status on payments(status);
