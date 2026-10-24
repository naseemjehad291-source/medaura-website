-- Run once after reviewing. Media profiles are server-managed only.
create table if not exists public.media_admin_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 1 and 80),
 disabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.media_admin_profiles enable row level security;
-- No direct client policies: service-role backend only.
