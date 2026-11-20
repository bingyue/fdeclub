-- City creation and publication integrity; safe editable content shapes.
begin;
create or replace function public.manage_record(p_kind text,p_id uuid,p_patch jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare tbl text; allowed text[]; rowdata jsonb; merged jsonb; assignments text; actor text; owner_role text; owner uuid; city uuid; k text;
begin
 actor:=public.app_role();
 if actor is null or actor not in ('super_admin','operations','city_manager') then raise exception 'not authorized' using errcode='42501'; end if;
 case p_kind
 when 'enterprise' then tbl:='enterprise_leads'; allowed:=array['status','assigned_to','city_id','next_followup_at','tags'];
 when 'city' then tbl:='city_applications'; allowed:=array['status','assigned_to','city_id','note'];
 when 'partner' then tbl:='partner_applications'; allowed:=array['status','assigned_to','city_id','note'];
 when 'event' then tbl:='events'; allowed:=array['slug','title','summary','description','event_type','city_id','assigned_to','location','organizer','audience','starts_at','ends_at','registration_deadline','capacity','requires_approval','poster_url','checkin_info','status'];
 when 'city_config' then tbl:='cities'; allowed:=array['slug','name','region','description','focus','status','is_public','leader_name','leader_consent'];
 when 'profile' then tbl:='profiles'; allowed:=array['role','status'];
 when 'expert' then tbl:='expert_applications'; allowed:=array['status'];
 when 'membership' then tbl:='memberships'; allowed:=array['status','valid_until'];
 when 'setting' then tbl:='site_settings'; allowed:=array['value','status'];
 else raise exception 'invalid kind'; end case;
 if p_patch='{}' or exists(select 1 from jsonb_object_keys(p_patch) key where not key=any(allowed)) then raise exception 'invalid patch'; end if;
 if p_kind='profile' and (actor<>'super_admin' or p_id=auth.uid()) then raise exception 'role change forbidden' using errcode='42501'; end if;
 if actor='city_manager' and (p_kind not in ('enterprise','partner','event') or p_patch ?| array['assigned_to','city_id']) then raise exception 'scope forbidden' using errcode='42501'; end if;
 if p_id is null then
  if p_kind not in ('event','city_config') or not public.is_staff() then raise exception 'creation forbidden' using errcode='42501'; end if;
  if p_kind='event' then
   insert into public.events(slug,title,created_by) values(p_patch->>'slug',p_patch->>'title',auth.uid()) returning id into p_id;
  else
   insert into public.cities(slug,name,region,focus,created_by) values(p_patch->>'slug',p_patch->>'name',p_patch->>'region',p_patch->>'focus',auth.uid()) returning id into p_id;
  end if;
 end if;
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',tbl) into rowdata using p_id;
 if rowdata is null then raise exception 'record not found'; end if;
 if actor='city_manager' and not coalesce(public.can_access((rowdata->>'city_id')::uuid,(rowdata->>'assigned_to')::uuid),false) then raise exception 'scope forbidden' using errcode='42501'; end if;
 merged:=rowdata||p_patch;
 if p_kind in ('enterprise','city','partner','event','expert','membership') and not public.valid_transition(p_kind,rowdata->>'status',merged->>'status') then raise exception 'invalid status transition'; end if;
 owner:=nullif(merged->>'assigned_to','')::uuid; city:=nullif(merged->>'city_id','')::uuid;
 if owner is not null and (p_patch ? 'assigned_to' or p_patch ? 'city_id') then
  select role into owner_role from public.profiles where id=owner and status='active';
  if owner_role is null or (owner_role not in ('super_admin','operations') and not (owner_role='city_manager' and exists(select 1 from public.city_members where user_id=owner and city_id=city and status='active'))) then raise exception 'invalid assignee'; end if;
 end if;
 if p_kind='city' and merged->>'status' in ('approved','active') and city is null then raise exception 'city required'; end if;
 if p_kind='city_config' and merged->>'status'='active' and not exists(select 1 from public.city_applications a join public.city_members m on m.application_id=a.id where a.city_id=p_id and a.status in ('approved','active') and m.status='active') then raise exception 'approved city application and active authorization required'; end if;
 if p_kind='setting' then
  if merged->>'key'='home' and (jsonb_typeof(merged->'value'->'eyebrow') is distinct from 'string' or jsonb_typeof(merged->'value'->'description') is distinct from 'string' or jsonb_typeof(merged->'value'->'show_events') is distinct from 'boolean') then raise exception 'invalid home settings'; end if;
  if merged->>'key'='event_types' then
   if jsonb_typeof(merged->'value') is distinct from 'array' then raise exception 'event types must be an array'; end if;
   if jsonb_array_length(merged->'value') not between 1 and 20 or exists(select 1 from jsonb_array_elements(merged->'value') x where jsonb_typeof(x) is distinct from 'string') then raise exception 'invalid event type options'; end if;
  end if;
 end if;
 if p_kind='membership' and merged->>'status'='approved' and nullif(merged->>'valid_until','')::timestamptz is null then raise exception 'valid_until required'; end if;
 if p_kind='event' then
  if (merged->>'capacity')::integer < (select count(*) from public.event_registrations where event_id=p_id and status in ('pending','confirmed','attended')) then raise exception 'capacity below reserved seats'; end if;
  if rowdata->>'status'='draft' and merged->>'status'='published' and (merged->>'starts_at')::timestamptz<=now() then raise exception 'cannot publish past event'; end if;
 end if;
 select string_agg(format('%I=(jsonb_populate_record(null::public.%I,$1)).%I',key,tbl,key),',') into assignments from jsonb_object_keys(p_patch) key;
 execute format('update public.%I set %s where id=$2',tbl,assignments) using merged,p_id;
 if p_kind='event' and merged->>'status'='published' and rowdata->>'status'='draft' then update public.events set published_at=now() where id=p_id; end if;
 if p_kind='event' and merged->>'status'='cancelled' then update public.event_registrations set status='cancelled' where event_id=p_id and status in ('pending','confirmed'); end if;
 if p_kind='city' and merged->>'status' in ('paused','rejected') then update public.city_members set status='paused' where application_id=p_id; end if;
 return p_id;
end $$;

commit;
