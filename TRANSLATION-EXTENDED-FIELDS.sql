-- Run AFTER reviewing. Adds a separate, limited save function for library and work text.
-- Does not grant permission to edit links, prices, dates, photos or publication status.
create or replace function public.medaura_save_extended_translation(
 p_entity_type text, p_entity_id text, p_field text, p_ar text, p_en text
) returns void language plpgsql security definer set search_path=public as $$
declare
 allowed boolean;
 resource_list jsonb;
 item_index integer;
 field_key text;
 work_id uuid;
 block_index integer;
 blocks_value jsonb;
begin
 allowed := exists(select 1 from public.medaura_translation_editors where user_id=auth.uid())
 or exists(select 1 from public.admin_roles where user_id=auth.uid() and role='super_admin');
 if not allowed then raise exception 'Not authorized'; end if;
 if length(trim(coalesce(p_ar,'')))=0 then raise exception 'Arabic text cannot be empty'; end if;
 if p_entity_type='resources' then
   if p_field not in ('title','cat','type') or p_entity_id !~ '^[0-9]{1,5}$' then raise exception 'Field not permitted'; end if;
   item_index := p_entity_id::integer;
   select case when jsonb_typeof(value)='string' then (value #>> '{}')::jsonb else value end
   into resource_list from public.site_settings where key='resourcesJSON' for update;
   if jsonb_typeof(resource_list)<>'array' or item_index>=jsonb_array_length(resource_list) then raise exception 'Resource not found'; end if;
   resource_list := jsonb_set(resource_list,array[item_index::text,p_field],to_jsonb(p_ar),false);
   update public.site_settings set value=to_jsonb(resource_list::text) where key='resourcesJSON';
 elsif p_entity_type='work_posts' then
   if p_entity_id !~ '^[0-9a-fA-F-]{36}$' then raise exception 'Invalid work id'; end if;
   work_id:=p_entity_id::uuid;
   if p_field='title' then update public.work_posts set title=p_ar where id=work_id;
   elsif p_field='excerpt' then update public.work_posts set excerpt=p_ar where id=work_id;
   elsif p_field ~ '^blocks:[0-9]{1,5}:(text|caption)$' then
     block_index:=split_part(p_field,':',2)::integer;field_key:=split_part(p_field,':',3);
     select blocks into blocks_value from public.work_posts where id=work_id for update;
     if jsonb_typeof(blocks_value)<>'array' or block_index>=jsonb_array_length(blocks_value) then raise exception 'Work block not found'; end if;
     if field_key='text' and blocks_value->block_index->>'type' not in ('text','heading') then raise exception 'Block type not editable'; end if;
     if field_key='caption' and blocks_value->block_index->>'type' not in ('image','video') then raise exception 'Block type not editable'; end if;
     update public.work_posts set blocks=jsonb_set(blocks_value,array[block_index::text,field_key],to_jsonb(p_ar),false) where id=work_id;
   else raise exception 'Field not permitted'; end if;
   if not found then raise exception 'Work item not found'; end if;
 else raise exception 'Entity not permitted'; end if;
 insert into public.medaura_content_localizations(entity_type,entity_id,field_name,source_snapshot,translation_en,updated_by,updated_at)
 values(p_entity_type,p_entity_id,p_field,p_ar,coalesce(p_en,''),auth.uid(),now())
 on conflict(entity_type,entity_id,field_name) do update set source_snapshot=excluded.source_snapshot,translation_en=excluded.translation_en,updated_by=excluded.updated_by,updated_at=now();
end $$;
revoke all on function public.medaura_save_extended_translation(text,text,text,text,text) from public;
grant execute on function public.medaura_save_extended_translation(text,text,text,text,text) to authenticated;
