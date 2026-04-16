-- =============================================
-- SULALAH v5 — Notifikasi Milad & Catatan Wafat
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambah kolom notifikasi milad ke persons
alter table persons add column if not exists notify_milad boolean default false;
alter table persons add column if not exists wafat_notes text;
alter table persons add column if not exists wafat_date text; -- format: DD-MM-YYYY atau YYYY

-- 2. Tabel log notifikasi milad (agar tidak kirim dua kali sehari)
create table if not exists milad_notifications (
  id uuid default gen_random_uuid() primary key,
  person_id uuid references persons(id) on delete cascade,
  sent_at timestamp with time zone default now(),
  year_sent int
);

-- 3. Tabel pengaturan notifikasi per user
create table if not exists notification_settings (
  user_id uuid references profiles(id) on delete cascade primary key,
  email_milad boolean default true,
  email_wafat boolean default true,
  umroh_link text, -- link layanan badal umroh custom
  updated_at timestamp with time zone default now()
);

alter table milad_notifications enable row level security;
alter table notification_settings enable row level security;

create policy "Users manage own notification settings"
  on notification_settings for all using (auth.uid() = user_id);

create policy "Users see own milad logs"
  on milad_notifications for all
  using (person_id in (select id from persons where owner_id = auth.uid()));

-- Index
create index if not exists idx_persons_birth_year on persons(birth_year);
create index if not exists idx_milad_notif_person on milad_notifications(person_id, year_sent);

-- Tambah kolom tanggal lahir detail (untuk notifikasi milad)
alter table persons add column if not exists birth_month int;
alter table persons add column if not exists birth_day int;

-- Index untuk cari milad hari ini
create index if not exists idx_persons_milad on persons(birth_month, birth_day);
