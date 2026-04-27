-- =============================================
-- SULALAH v13 — Pakasir Payment Integration
-- Jalankan di Supabase SQL Editor
-- =============================================

-- ── Tabel payment_orders ──
-- Menyimpan semua transaksi pembayaran (idempotency + audit trail)
create table if not exists payment_orders (
  id uuid default gen_random_uuid() primary key,
  order_id text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  amount integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'expired')),
  gateway text not null default 'pakasir',
  payment_method text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payment_orders_order_id on payment_orders(order_id);
create index if not exists idx_payment_orders_user_id on payment_orders(user_id);

-- RLS: user hanya bisa lihat order mereka sendiri
alter table payment_orders enable row level security;

drop policy if exists "users can view own orders" on payment_orders;
create policy "users can view own orders"
  on payment_orders for select
  using (user_id = auth.uid());

-- Service role bisa insert/update (untuk webhook)
-- Webhook pakai supabase service key di server-side, jadi sudah bypass RLS

-- ── Tambah kolom premium_source & premium_since di profiles ──
alter table profiles add column if not exists premium_source text default 'manual';
alter table profiles add column if not exists premium_since timestamptz;

-- Update existing premium users
update profiles
set premium_since = now(), premium_source = 'trakteer'
where is_premium = true and premium_since is null;

-- Selesai
