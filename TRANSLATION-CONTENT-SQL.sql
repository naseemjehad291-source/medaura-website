-- Run once in Supabase SQL Editor. Review before applying.
create table if not exists public.medaura_content_localizations (
 entity_type text not null, entity_id text not null, field_name text not null,
 source_snapshot text not null default '', translation_en text not null default '',
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
 primary key(entity_type,entity_id,field_name)
);
alter table public.medaura_content_localizations enable row level security;
drop policy if exists "public read localizations" on public.medaura_content_localizations;
create policy "public read localizations" on public.medaura_content_localizations for select using (true);
-- Editor writes are only allowed through the security-definer RPC below.
create or replace function public.medaura_save_localized_content(
 p_entity_type text,p_entity_id text,p_field text,p_ar text,p_en text)
returns void language plpgsql security definer set search_path=public as $$
declare permitted boolean; current_ar text; 
begin
 permitted := exists(select 1 from public.medaura_translation_editors where user_id=auth.uid())
 or exists(select 1 from public.admin_roles where user_id=auth.uid() and role='super_admin');
 if not permitted then raise exception 'Not authorized'; end if;
 if p_entity_type='site_settings' then
   if p_field <> p_entity_id or p_field not in (
    'heroSubtitle','impactLabel','homePathHeading','homePathDescription','homeCoursesHeading','homeWorkHeading','homeWorkDescription','homeJoinHeading','homeJoinDescription',
    'aboutSubtitle','aboutHeading','aboutIntro','vision','mission','values','educationalMethod','teamIntro','coursesIntro','joinIntro','joinHeading','joinDescription',
    'join_volunteer_title','join_volunteer_description','join_volunteer_button','join_membership_title','join_membership_description','join_membership_button',
    'join_trainer_title','join_trainer_description','join_trainer_button','join_partner_title','join_partner_description','join_partner_button',
    'contactIntro','contactChannelsHeading','contactPartnerHeading','resourcesIntro') then raise exception 'Field not permitted'; end if;
   insert into public.site_settings(key,value) values(p_field,p_ar) on conflict(key) do update set value=excluded.value;
 elsif p_entity_type='courses' then
   if p_field not in ('title','description','instructor') then raise exception 'Field not permitted'; end if;
   if p_field='title' then update public.courses set title=p_ar where id::text=p_entity_id;
   elsif p_field='description' then update public.courses set description=p_ar where id::text=p_entity_id;
   else update public.courses set instructor=p_ar where id::text=p_entity_id; end if;
   if not found then raise exception 'Course not found'; end if;
 elsif p_entity_type='events' then
   if p_field not in ('title','description') then raise exception 'Field not permitted'; end if;
   if p_field='title' then update public.events set title=p_ar where id::text=p_entity_id;
   else update public.events set description=p_ar where id::text=p_entity_id; end if;
   if not found then raise exception 'Event not found'; end if;
 elsif p_entity_type='team_members' then
   if p_field not in ('name','position','bio') then raise exception 'Field not permitted'; end if;
   if p_field='name' then update public.team_members set name=p_ar where id::text=p_entity_id;
   elsif p_field='position' then update public.team_members set position=p_ar where id::text=p_entity_id;
   else update public.team_members set bio=p_ar where id::text=p_entity_id; end if;
   if not found then raise exception 'Member not found'; end if;
 else raise exception 'Entity not permitted'; end if;
 insert into public.medaura_content_localizations(entity_type,entity_id,field_name,source_snapshot,translation_en,updated_by,updated_at)
 values(p_entity_type,p_entity_id,p_field,p_ar,coalesce(p_en,''),auth.uid(),now())
 on conflict(entity_type,entity_id,field_name) do update set source_snapshot=excluded.source_snapshot,translation_en=excluded.translation_en,updated_by=excluded.updated_by,updated_at=now();
end $$;
revoke all on function public.medaura_save_localized_content(text,text,text,text,text) from public;
grant execute on function public.medaura_save_localized_content(text,text,text,text,text) to authenticated;
