-- Run once in Supabase SQL Editor. Does not modify admin_roles or existing policies.
create table if not exists public.medaura_translation_editors (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.medaura_public_translations (
 source_ar text primary key,
 translation_en text not null check (length(trim(translation_en)) > 0),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
create or replace function public.medaura_can_edit_translations()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.medaura_translation_editors t where t.user_id=(select auth.uid()))
 or exists(select 1 from public.admin_roles r where r.user_id=(select auth.uid()) and r.role='super_admin');
$$;
revoke all on function public.medaura_can_edit_translations() from public;
grant execute on function public.medaura_can_edit_translations() to authenticated;
alter table public.medaura_translation_editors enable row level security;
alter table public.medaura_public_translations enable row level security;
drop policy if exists "translation editors see own" on public.medaura_translation_editors;
create policy "translation editors see own" on public.medaura_translation_editors for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "super admin manages translators" on public.medaura_translation_editors;
create policy "super admin manages translators" on public.medaura_translation_editors for all to authenticated
 using(exists(select 1 from public.admin_roles r where r.user_id=(select auth.uid()) and r.role='super_admin'))
 with check(exists(select 1 from public.admin_roles r where r.user_id=(select auth.uid()) and r.role='super_admin'));
drop policy if exists "public read translations" on public.medaura_public_translations;
create policy "public read translations" on public.medaura_public_translations for select to anon, authenticated using(true);
drop policy if exists "translators insert" on public.medaura_public_translations;
create policy "translators insert" on public.medaura_public_translations for insert to authenticated with check(public.medaura_can_edit_translations() and updated_by=(select auth.uid()));
drop policy if exists "translators update" on public.medaura_public_translations;
create policy "translators update" on public.medaura_public_translations for update to authenticated using(public.medaura_can_edit_translations()) with check(public.medaura_can_edit_translations() and updated_by=(select auth.uid()));
drop policy if exists "translators delete" on public.medaura_public_translations;
create policy "translators delete" on public.medaura_public_translations for delete to authenticated using(public.medaura_can_edit_translations());
grant select on public.medaura_public_translations to anon,authenticated;
grant insert,update,delete on public.medaura_public_translations to authenticated;
grant select,insert,delete on public.medaura_translation_editors to authenticated;
-- After creating a translator account in Supabase Auth, run:
-- insert into public.medaura_translation_editors(user_id) values ('PASTE-AUTH-USER-UUID');

-- Bilingual text editing: keep the original source key stable for safe lookups.
alter table public.medaura_public_translations add column if not exists edited_ar text;
-- Translator role can update only approved bilingual copy, never course metadata.
-- Existing RLS policies above still apply.
