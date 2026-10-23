-- Run in Supabase SQL Editor before using the Our Work admin tab.
-- Public reads only published posts. Drafts remain restricted to super_admin.
create table if not exists public.work_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text not null default '',
  cover_url text,
  activity_date date,
  location text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_blocks_array check (jsonb_typeof(blocks) = 'array')
);
alter table public.work_posts enable row level security;
drop policy if exists "Public read published work" on public.work_posts;
create policy "Public read published work" on public.work_posts for select to anon, authenticated using (is_published = true);
drop policy if exists "Super admin manages work" on public.work_posts;
create policy "Super admin manages work" on public.work_posts for all to authenticated
using (exists(select 1 from public.admin_roles ar where ar.user_id = (select auth.uid()) and ar.role = 'super_admin'))
with check (exists(select 1 from public.admin_roles ar where ar.user_id = (select auth.uid()) and ar.role = 'super_admin'));
