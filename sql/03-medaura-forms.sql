-- MEDAURA Forms v1. Run once in Supabase SQL Editor after reviewing.
create table if not exists public.medaura_forms (
 id uuid primary key default gen_random_uuid(), title text not null check (char_length(title) between 1 and 180),
 description text not null default '', category text not null check(category in ('courses','volunteer','partnership','survey','contact','other')),
 slug text not null unique check(slug ~ '^[a-z0-9-]{3,80}$'),
 status text not null default 'draft' check(status in ('draft','published','closed')),
 fields jsonb not null default '[]'::jsonb check(jsonb_typeof(fields)='array' and jsonb_array_length(fields)<=40),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.medaura_form_submissions (
 id uuid primary key default gen_random_uuid(), form_id uuid not null references public.medaura_forms(id) on delete restrict,
 answers jsonb not null check(jsonb_typeof(answers)='object' and pg_column_size(answers)<30000),
 created_at timestamptz not null default now()
);
create index if not exists medaura_form_submissions_form_idx on public.medaura_form_submissions(form_id,created_at desc);
create or replace function public.medaura_is_super_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_roles where user_id=(select auth.uid()) and role='super_admin');
$$;
revoke all on function public.medaura_is_super_admin() from public;
grant execute on function public.medaura_is_super_admin() to authenticated, anon;
alter table public.medaura_forms enable row level security;
alter table public.medaura_form_submissions enable row level security;
create policy "forms admin manage" on public.medaura_forms for all to authenticated using (public.medaura_is_super_admin()) with check (public.medaura_is_super_admin());
create policy "forms public published read" on public.medaura_forms for select to anon,authenticated using (status='published');
create policy "submissions admin read" on public.medaura_form_submissions for select to authenticated using (public.medaura_is_super_admin());
-- Public inserts are validated by a trigger to prevent fake keys, oversized answers and invalid required fields.
create or replace function public.medaura_validate_submission() returns trigger language plpgsql security definer set search_path='' as $$
declare f record; field jsonb; key text; typ text; val jsonb; allowed text[]; item jsonb;
begin
 select fields,status into f from public.medaura_forms where id=new.form_id;
 if not found or f.status<>'published' then raise exception 'Form is not open'; end if;
 if (select count(*) from jsonb_object_keys(new.answers))>40 then raise exception 'Too many answers'; end if;
 for key in select jsonb_object_keys(new.answers) loop
  if not exists(select 1 from jsonb_array_elements(f.fields) x where x->>'id'=key) then raise exception 'Unknown answer key'; end if;
 end loop;
 for field in select * from jsonb_array_elements(f.fields) loop
  key:=field->>'id'; typ:=field->>'type'; val:=new.answers->key;
  if coalesce((field->>'required')::boolean,false) and (val is null or val='null'::jsonb or val='""'::jsonb or val='[]'::jsonb) then raise exception 'Missing required answer'; end if;
  if val is null or val='null'::jsonb then continue; end if;
  if typ='multiple' then
   if jsonb_typeof(val)<>'array' or jsonb_array_length(val)>20 then raise exception 'Invalid multiple choice'; end if;
   allowed:=array(select jsonb_array_elements_text(coalesce(field->'options','[]'::jsonb)));
   for item in select * from jsonb_array_elements(val) loop
    if jsonb_typeof(item)<>'string' or not (item #>> '{}')=any(allowed) then raise exception 'Invalid option'; end if;
   end loop;
  else
   if jsonb_typeof(val)<>'string' or length(val #>> '{}')>2000 then raise exception 'Invalid answer'; end if;
   if typ='single' and not ((val #>> '{}')=any(array(select jsonb_array_elements_text(coalesce(field->'options','[]'::jsonb))))) then raise exception 'Invalid option'; end if;
   if typ='email' and (val #>> '{}') !~* '^[^ @]+@[^ @]+\.[^ @]+$' then raise exception 'Invalid email'; end if;
   if typ='date' and (val #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid date'; end if;
  end if;
 end loop;
 return new;
end $$;
create trigger medaura_validate_submission_before_insert before insert on public.medaura_form_submissions for each row execute function public.medaura_validate_submission();
create policy "public submit" on public.medaura_form_submissions for insert to anon,authenticated with check (exists(select 1 from public.medaura_forms where id=form_id and status='published'));
-- For production spam resistance add a server-side rate-limited endpoint / CAPTCHA before public launch.
