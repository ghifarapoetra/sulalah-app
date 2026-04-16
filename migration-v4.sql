-- =============================================
-- SULALAH v4 — Kolaborasi Pohon Keluarga
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tabel anggota pohon (kolaborator)
create table if not exists tree_members (
  id uuid default gen_random_uuid() primary key,
  tree_id uuid references trees(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('owner','editor','viewer')) default 'viewer',
  joined_at timestamp with time zone default now(),
  unique(tree_id, user_id)
);

-- 2. Tabel undangan
create table if not exists tree_invites (
  id uuid default gen_random_uuid() primary key,
  tree_id uuid references trees(id) on delete cascade not null,
  invited_by uuid references profiles(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  role text check (role in ('editor','viewer')) default 'editor',
  email text,
  used_by uuid references profiles(id) on delete set null,
  used_at timestamp with time zone,
  expires_at timestamp with time zone default (now() + interval '7 days'),
  created_at timestamp with time zone default now()
);

-- 3. RLS
alter table tree_members enable row level security;
alter table tree_invites enable row level security;

-- Policy tree_members: bisa lihat kalau member pohon itu
create policy "Members can view tree membership"
  on tree_members for select
  using (
    user_id = auth.uid() or
    tree_id in (select tree_id from tree_members where user_id = auth.uid())
  );

create policy "Owners can manage members"
  on tree_members for all
  using (
    tree_id in (
      select id from trees where owner_id = auth.uid()
    )
  );

-- Policy tree_invites
create policy "Tree owners can manage invites"
  on tree_invites for all
  using (invited_by = auth.uid());

create policy "Anyone can read invite by token"
  on tree_invites for select
  using (true);

-- 4. Update trees policy: member juga bisa akses
drop policy if exists "Users can manage own trees" on trees;

create policy "Owners can manage own trees"
  on trees for all
  using (owner_id = auth.uid());

create policy "Members can view shared trees"
  on trees for select
  using (
    id in (select tree_id from tree_members where user_id = auth.uid())
  );

-- 5. Update persons policy: member editor juga bisa edit
drop policy if exists "Users can manage own persons" on persons;

create policy "Owners can manage persons"
  on persons for all
  using (owner_id = auth.uid());

create policy "Editors can manage persons in shared trees"
  on persons for all
  using (
    tree_id in (
      select tree_id from tree_members
      where user_id = auth.uid() and role = 'editor'
    )
  );

create policy "Viewers can read persons in shared trees"
  on persons for select
  using (
    tree_id in (
      select tree_id from tree_members
      where user_id = auth.uid() and role in ('editor','viewer')
    )
  );

-- 6. Index
create index if not exists idx_tree_members_user on tree_members(user_id);
create index if not exists idx_tree_members_tree on tree_members(tree_id);
create index if not exists idx_tree_invites_token on tree_invites(token);
create index if not exists idx_tree_invites_tree on tree_invites(tree_id);
