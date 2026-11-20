-- Versioned initial schema. Business writes are RPC-only. No demo personal data.
begin;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, source_channel text not null default 'auth', display_name text not null default '', role text not null default 'member' check(role in ('super_admin','operations','city_manager','member','enterprise_contact')), status text not null default 'active' check(status in ('active','disabled')));
alter table public.profiles enable row level security;
create table public.organizations (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', name text not null, kind text, status text not null default 'private');
alter table public.organizations enable row level security;
create table public.cities (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', slug text not null unique check(slug ~ '^[a-z0-9-]+$'), name text not null, region text not null, focus text not null, status text not null default 'recruiting' check(status in ('recruiting','preparing','active','paused')), is_public boolean not null default true, leader_name text, leader_consent boolean not null default false, description text not null default '', constraint leader_authorized check(leader_name is null or leader_consent));
alter table public.cities enable row level security;
create table public.city_applications (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', city_id uuid references public.cities(id), city_name text not null, contact_name text not null, contact text not null, organization text not null, identity text not null, resources text not null, experience text not null, vision text not null, status text not null default 'submitted' check(status in ('submitted','review','interview','approved','rejected','active','paused')), assigned_to uuid references public.profiles(id), note text not null default '', consent_at timestamptz not null default now(), privacy_version text not null default '2026-10-25', dedupe_key text unique, retention_until timestamptz not null default now()+interval '365 days');
alter table public.city_applications enable row level security;
create table public.city_members (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', city_id uuid not null references public.cities(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, application_id uuid not null references public.city_applications(id), status text not null default 'active' check(status in ('active','paused')), unique(city_id,user_id));
alter table public.city_members enable row level security;
create table public.enterprise_leads (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', company text not null, industry text not null, company_size text not null, city_name text not null, city_id uuid references public.cities(id), contact_name text not null, contact text not null, pain_points text not null, goals text not null, budget text not null, timeline text not null, utm_source text, utm_medium text, utm_campaign text, status text not null default 'new' check(status in ('new','triaged','contacted','qualified','poc_proposed','project_handoff','won','lost')), assigned_to uuid references public.profiles(id), next_followup_at timestamptz, tags text[] not null default '{}', consent_at timestamptz not null default now(), privacy_version text not null default '2026-10-25', dedupe_key text unique, retention_until timestamptz not null default now()+interval '365 days');
alter table public.enterprise_leads enable row level security;
create table public.lead_activities (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', lead_id uuid not null references public.enterprise_leads(id) on delete cascade, note text not null check(length(note) between 1 and 4000), status text not null default 'recorded');
alter table public.lead_activities enable row level security;
create table public.partner_applications (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', institution_type text not null, organization text not null, city_name text not null, city_id uuid references public.cities(id), contact_name text not null, contact text not null, direction text not null, resources text not null, vision text not null, assigned_to uuid references public.profiles(id), note text not null default '', status text not null default 'submitted' check(status in ('submitted','review','contacted','cooperating','closed')), consent_at timestamptz not null default now(), privacy_version text not null default '2026-10-25', dedupe_key text unique, retention_until timestamptz not null default now()+interval '365 days');
alter table public.partner_applications enable row level security;
create table public.events (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', slug text not null unique check(slug ~ '^[a-z0-9-]+$'), title text not null, summary text not null default '', description text not null default '', event_type text not null default '企业沙龙', city_id uuid references public.cities(id), assigned_to uuid references public.profiles(id), location text, organizer text, audience text, starts_at timestamptz, ends_at timestamptz, registration_deadline timestamptz, capacity integer not null default 20 check(capacity between 1 and 10000), requires_approval boolean not null default true, poster_url text check(poster_url is null or poster_url like 'https://%'), checkin_info text not null default '', published_at timestamptz, status text not null default 'draft' check(status in ('draft','published','cancelled')), constraint published_complete check(status <> 'published' or (starts_at is not null and ends_at > starts_at and registration_deadline <= starts_at and registration_deadline is not null and length(location)>0 and length(organizer)>0 and length(audience)>0 and city_id is not null)));
alter table public.events enable row level security;
create table public.event_registrations (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', event_id uuid not null references public.events(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, contact_name text not null, contact text not null, status text not null default 'pending' check(status in ('pending','confirmed','cancelled','attended')), checked_in_at timestamptz, consent_at timestamptz not null default now(), retention_until timestamptz not null default now()+interval '365 days', unique(event_id,user_id));
alter table public.event_registrations enable row level security;
create table public.membership_plans (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', slug text not null unique, name text not null, benefits text[] not null default '{}', status text not null default 'intent_only' check(status='intent_only'));
alter table public.membership_plans enable row level security;
create table public.memberships (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', user_id uuid references public.profiles(id), plan_slug text not null references public.membership_plans(slug), contact_name text not null, contact text not null, city_name text not null, expectation text not null default '', status text not null default 'intent' check(status in ('intent','review','approved','expired','rejected')), valid_until timestamptz, consent_at timestamptz not null default now(), dedupe_key text unique, retention_until timestamptz not null default now()+interval '365 days');
alter table public.memberships enable row level security;
create table public.expert_profiles (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', user_id uuid references public.profiles(id), display_name text not null, domains text[] not null default '{}', bio text not null, public_consent boolean not null default false, status text not null default 'private' check(status in ('private','approved')), constraint public_authorized check(status <> 'approved' or public_consent));
alter table public.expert_profiles enable row level security;
create table public.expert_applications (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', contact_name text not null, contact text not null, city_name text not null, domain text not null, experience text not null, case_url text, public_consent boolean not null default false, status text not null default 'submitted' check(status in ('submitted','review','approved','rejected')), consent_at timestamptz not null default now(), dedupe_key text unique, retention_until timestamptz not null default now()+interval '365 days');
alter table public.expert_applications enable row level security;
create table public.audit_logs (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', table_name text not null, record_id uuid not null, action text not null, changes jsonb not null default '{}', status text not null default 'recorded');
alter table public.audit_logs enable row level security;
create table public.notification_outbox (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', entity_type text not null, entity_id uuid not null, status text not null default 'pending' check(status in ('pending','processing','sent','failed')), attempts integer not null default 0, last_error text, available_at timestamptz not null default now());
alter table public.notification_outbox enable row level security;
create table public.rate_limits (key text primary key, hits integer not null default 1, expires_at timestamptz not null);
alter table public.rate_limits enable row level security;
create table public.site_settings (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, source_channel text not null default 'website', key text not null unique, value jsonb not null, status text not null default 'public' check(status in ('public','private')));
alter table public.site_settings enable row level security;

create index leads_city_owner on public.enterprise_leads(city_id,assigned_to,status);
create index leads_created on public.enterprise_leads(created_at desc);
create index partners_owner on public.partner_applications(city_id,assigned_to);
create index events_city on public.events(city_id,status,starts_at);
create index activities_lead on public.lead_activities(lead_id,created_at);
create index registrations_event on public.event_registrations(event_id,status);
create index outbox_pending on public.notification_outbox(status,available_at);

create function public.app_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id=auth.uid() and status='active'
$$;
create function public.is_staff() returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(public.app_role() in ('super_admin','operations'),false)
$$;
create function public.can_access(p_city uuid,p_owner uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_staff() or (public.app_role()='city_manager' and p_owner=auth.uid() and exists(select 1 from public.city_members where city_id=p_city and user_id=auth.uid() and status='active'))
$$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','成员')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.record_audit() returns trigger language plpgsql security definer set search_path = '' as $$
declare old_data jsonb; new_data jsonb; safe_old jsonb; safe_new jsonb;
begin
 old_data:=case when TG_OP='INSERT' then '{}'::jsonb else to_jsonb(old) end;
 new_data:=case when TG_OP='DELETE' then '{}'::jsonb else to_jsonb(new) end;
 select coalesce(jsonb_object_agg(key,value),'{}') into safe_old from jsonb_each(old_data) where key in ('status','assigned_to','city_id','role','is_public','valid_until','next_followup_at');
 select coalesce(jsonb_object_agg(key,value),'{}') into safe_new from jsonb_each(new_data) where key in ('status','assigned_to','city_id','role','is_public','valid_until','next_followup_at');
 insert into public.audit_logs(table_name,record_id,action,changes,created_by) values(TG_TABLE_NAME,coalesce(new_data->>'id',old_data->>'id')::uuid,TG_OP,jsonb_build_object('before',safe_old,'after',safe_new),auth.uid());
 if TG_OP='INSERT' and TG_TABLE_NAME in ('enterprise_leads','city_applications','partner_applications','memberships','expert_applications') then
 insert into public.notification_outbox(entity_type,entity_id) values(TG_TABLE_NAME,(new_data->>'id')::uuid);
 end if;
 return coalesce(new,old);
end $$;
create function public.touch_updated() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at:=now(); return new; end $$;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated();
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.record_audit();
create trigger touch_organizations before update on public.organizations for each row execute function public.touch_updated();
create trigger audit_organizations after insert or update or delete on public.organizations for each row execute function public.record_audit();
create trigger touch_cities before update on public.cities for each row execute function public.touch_updated();
create trigger audit_cities after insert or update or delete on public.cities for each row execute function public.record_audit();
create trigger touch_city_applications before update on public.city_applications for each row execute function public.touch_updated();
create trigger audit_city_applications after insert or update or delete on public.city_applications for each row execute function public.record_audit();
create trigger touch_city_members before update on public.city_members for each row execute function public.touch_updated();
create trigger audit_city_members after insert or update or delete on public.city_members for each row execute function public.record_audit();
create trigger touch_enterprise_leads before update on public.enterprise_leads for each row execute function public.touch_updated();
create trigger audit_enterprise_leads after insert or update or delete on public.enterprise_leads for each row execute function public.record_audit();
create trigger touch_lead_activities before update on public.lead_activities for each row execute function public.touch_updated();
create trigger audit_lead_activities after insert or update or delete on public.lead_activities for each row execute function public.record_audit();
create trigger touch_partner_applications before update on public.partner_applications for each row execute function public.touch_updated();
create trigger audit_partner_applications after insert or update or delete on public.partner_applications for each row execute function public.record_audit();
create trigger touch_events before update on public.events for each row execute function public.touch_updated();
create trigger audit_events after insert or update or delete on public.events for each row execute function public.record_audit();
create trigger touch_event_registrations before update on public.event_registrations for each row execute function public.touch_updated();
create trigger audit_event_registrations after insert or update or delete on public.event_registrations for each row execute function public.record_audit();
create trigger touch_membership_plans before update on public.membership_plans for each row execute function public.touch_updated();
create trigger audit_membership_plans after insert or update or delete on public.membership_plans for each row execute function public.record_audit();
create trigger touch_memberships before update on public.memberships for each row execute function public.touch_updated();
create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function public.record_audit();
create trigger touch_expert_profiles before update on public.expert_profiles for each row execute function public.touch_updated();
create trigger audit_expert_profiles after insert or update or delete on public.expert_profiles for each row execute function public.record_audit();
create trigger touch_expert_applications before update on public.expert_applications for each row execute function public.touch_updated();
create trigger audit_expert_applications after insert or update or delete on public.expert_applications for each row execute function public.record_audit();
create trigger touch_audit_logs before update on public.audit_logs for each row execute function public.touch_updated();
create trigger touch_notification_outbox before update on public.notification_outbox for each row execute function public.touch_updated();
create trigger touch_site_settings before update on public.site_settings for each row execute function public.touch_updated();
create trigger audit_site_settings after insert or update or delete on public.site_settings for each row execute function public.record_audit();

-- Read-only grants: application functions are the only mutation surface.
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant select on public.cities,public.membership_plans,public.expert_profiles,public.site_settings to anon;
create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or public.is_staff());
create policy organizations_read on public.organizations for select to authenticated using (public.is_staff());
create policy cities_read on public.cities for select using (is_public or public.is_staff());
create policy city_apps_read on public.city_applications for select to authenticated using(public.is_staff());
create policy city_members_read on public.city_members for select to authenticated using(user_id=auth.uid() or public.is_staff());
create policy leads_read on public.enterprise_leads for select to authenticated using(public.can_access(city_id,assigned_to));
create policy activities_read on public.lead_activities for select to authenticated using(exists(select 1 from public.enterprise_leads l where l.id=lead_id and public.can_access(l.city_id,l.assigned_to)));
create policy partners_read on public.partner_applications for select to authenticated using(public.can_access(city_id,assigned_to));
create policy events_read on public.events for select to authenticated using(public.can_access(city_id,assigned_to));
create policy registrations_read on public.event_registrations for select to authenticated using((user_id=auth.uid() and public.app_role() is not null) or exists(select 1 from public.events e where e.id=event_id and public.can_access(e.city_id,e.assigned_to)));
create policy plans_read on public.membership_plans for select using(true);
create policy memberships_read on public.memberships for select to authenticated using(user_id=auth.uid() or public.is_staff());
create policy experts_read on public.expert_profiles for select using((status='approved' and public_consent) or user_id=auth.uid() or public.is_staff());
create policy expert_apps_read on public.expert_applications for select to authenticated using(public.is_staff());
create policy audit_read on public.audit_logs for select to authenticated using(public.is_staff());
create policy outbox_read on public.notification_outbox for select to authenticated using(public.is_staff());
create policy settings_read on public.site_settings for select using(status='public' or public.is_staff());

-- Explicit projection intentionally omits private check-in instructions and owner IDs.
create function public.public_events() returns table(id uuid,slug text,title text,summary text,description text,event_type text,city_id uuid,location text,organizer text,audience text,starts_at timestamptz,ends_at timestamptz,registration_deadline timestamptz,capacity integer,requires_approval boolean,poster_url text,status text,reserved bigint) language sql stable security definer set search_path = '' as $$
 select e.id,e.slug,e.title,e.summary,e.description,e.event_type,e.city_id,e.location,e.organizer,e.audience,e.starts_at,e.ends_at,e.registration_deadline,e.capacity,e.requires_approval,e.poster_url,e.status,(select count(*) from public.event_registrations r where r.event_id=e.id and r.status in ('pending','confirmed','attended')) from public.events e where e.status='published' or (e.status='cancelled' and e.published_at is not null)
$$;
create function public.consume_rate_limit(p_key text,p_limit integer default 5,p_seconds integer default 600) returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
 insert into public.rate_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds)) on conflict(key) do update set hits=case when public.rate_limits.expires_at<now() then 1 else public.rate_limits.hits+1 end, expires_at=case when public.rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else public.rate_limits.expires_at end returning hits into n;
 return n<=p_limit;
end $$;

create function public.submit_application(p_kind text,p_data jsonb,p_dedupe text) returns uuid language plpgsql security definer set search_path = '' as $$
declare tbl text; result uuid; city uuid; payload jsonb;
begin
 tbl:=case p_kind when 'enterprise' then 'enterprise_leads' when 'city' then 'city_applications' when 'partner' then 'partner_applications' when 'membership' then 'memberships' when 'expert' then 'expert_applications' else null end;
 if tbl is null then raise exception 'invalid kind'; end if;
 select id into city from public.cities where name=p_data->>'city_name' and is_public limit 1;
 payload:=p_data || jsonb_build_object('dedupe_key',p_dedupe);
 if p_kind in ('enterprise','city','partner') then payload:=payload || jsonb_build_object('city_id',city); end if;
 -- Payload keys are an explicit server allowlist, not client-supplied SQL identifiers.
 if p_kind='enterprise' then
 insert into public.enterprise_leads(company,industry,company_size,city_name,city_id,contact_name,contact,pain_points,goals,budget,timeline,source_channel,utm_source,utm_medium,utm_campaign,dedupe_key) values(payload->>'company',payload->>'industry',payload->>'company_size',payload->>'city_name',city,payload->>'contact_name',payload->>'contact',payload->>'pain_points',payload->>'goals',payload->>'budget',payload->>'timeline',coalesce(payload->>'source_channel','website'),payload->>'utm_source',payload->>'utm_medium',payload->>'utm_campaign',p_dedupe) on conflict(dedupe_key) do nothing returning id into result;
 elsif p_kind='city' then
 insert into public.city_applications(city_name,city_id,contact_name,contact,organization,identity,resources,experience,vision,dedupe_key) values(payload->>'city_name',city,payload->>'contact_name',payload->>'contact',payload->>'organization',payload->>'identity',payload->>'resources',payload->>'experience',payload->>'vision',p_dedupe) on conflict(dedupe_key) do nothing returning id into result;
 elsif p_kind='partner' then
 insert into public.partner_applications(institution_type,organization,city_name,city_id,contact_name,contact,direction,resources,vision,dedupe_key) values(payload->>'institution_type',payload->>'organization',payload->>'city_name',city,payload->>'contact_name',payload->>'contact',payload->>'direction',payload->>'resources',payload->>'vision',p_dedupe) on conflict(dedupe_key) do nothing returning id into result;
 elsif p_kind='membership' then
 insert into public.memberships(plan_slug,contact_name,contact,city_name,expectation,dedupe_key) values(payload->>'plan_slug',payload->>'contact_name',payload->>'contact',payload->>'city_name',coalesce(payload->>'expectation',''),p_dedupe) on conflict(dedupe_key) do nothing returning id into result;
 else
 insert into public.expert_applications(contact_name,contact,city_name,domain,experience,case_url,public_consent,dedupe_key) values(payload->>'contact_name',payload->>'contact',payload->>'city_name',payload->>'domain',payload->>'experience',nullif(payload->>'case_url',''),coalesce((payload->>'public_consent')::boolean,false),p_dedupe) on conflict(dedupe_key) do nothing returning id into result;
 end if;
 if result is null then execute format('select id from public.%I where dedupe_key=$1',tbl) into result using p_dedupe; end if;
 return result;
end $$;

create function public.valid_transition(kind text,old_status text,new_status text) returns boolean language sql immutable set search_path='' as $$
 select old_status=new_status or case kind
 when 'enterprise' then case old_status when 'new' then new_status in ('triaged','lost') when 'triaged' then new_status in ('contacted','lost') when 'contacted' then new_status in ('qualified','lost') when 'qualified' then new_status in ('poc_proposed','lost') when 'poc_proposed' then new_status in ('project_handoff','lost') when 'project_handoff' then new_status in ('won','lost') else false end
 when 'city' then case old_status when 'submitted' then new_status in ('review','rejected') when 'review' then new_status in ('interview','rejected') when 'interview' then new_status in ('approved','rejected') when 'approved' then new_status in ('active','paused') when 'active' then new_status='paused' when 'paused' then new_status='active' else false end
 when 'partner' then case old_status when 'submitted' then new_status in ('review','closed') when 'review' then new_status in ('contacted','closed') when 'contacted' then new_status in ('cooperating','closed') when 'cooperating' then new_status='closed' else false end
 when 'event' then (old_status='draft' and new_status in ('published','cancelled')) or (old_status='published' and new_status='cancelled')
 when 'expert' then (old_status='submitted' and new_status in ('review','rejected')) or (old_status='review' and new_status in ('approved','rejected'))
 when 'membership' then (old_status='intent' and new_status in ('review','rejected')) or (old_status='review' and new_status in ('approved','rejected')) or (old_status='approved' and new_status='expired')
 else false end
$$;

create function public.manage_record(p_kind text,p_id uuid,p_patch jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare tbl text; allowed text[]; rowdata jsonb; merged jsonb; assignments text; actor text; owner_role text; owner uuid; city uuid; k text;
begin
 actor:=public.app_role();
 if actor is null or actor not in ('super_admin','operations','city_manager') then raise exception 'not authorized' using errcode='42501'; end if;
 case p_kind
 when 'enterprise' then tbl:='enterprise_leads'; allowed:=array['status','assigned_to','city_id','next_followup_at','tags'];
 when 'city' then tbl:='city_applications'; allowed:=array['status','assigned_to','city_id','note'];
 when 'partner' then tbl:='partner_applications'; allowed:=array['status','assigned_to','city_id','note'];
 when 'event' then tbl:='events'; allowed:=array['slug','title','summary','description','event_type','city_id','assigned_to','location','organizer','audience','starts_at','ends_at','registration_deadline','capacity','requires_approval','poster_url','checkin_info','status'];
 when 'city_config' then tbl:='cities'; allowed:=array['description','focus','status','is_public','leader_name','leader_consent'];
 when 'profile' then tbl:='profiles'; allowed:=array['role','status'];
 when 'expert' then tbl:='expert_applications'; allowed:=array['status'];
 when 'membership' then tbl:='memberships'; allowed:=array['status','valid_until'];
 when 'setting' then tbl:='site_settings'; allowed:=array['value','status'];
 else raise exception 'invalid kind'; end case;
 if p_patch='{}' or exists(select 1 from jsonb_object_keys(p_patch) key where not key=any(allowed)) then raise exception 'invalid patch'; end if;
 if p_kind='profile' and (actor<>'super_admin' or p_id=auth.uid()) then raise exception 'role change forbidden' using errcode='42501'; end if;
 if actor='city_manager' and (p_kind not in ('enterprise','partner','event') or p_patch ?| array['assigned_to','city_id']) then raise exception 'scope forbidden' using errcode='42501'; end if;
 if p_id is null then
  if p_kind<>'event' or not public.is_staff() then raise exception 'creation forbidden' using errcode='42501'; end if;
  insert into public.events(slug,title,created_by) values(p_patch->>'slug',p_patch->>'title',auth.uid()) returning id into p_id;
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

create function public.add_lead_note(p_id uuid,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not exists(select 1 from public.enterprise_leads where id=p_id and public.can_access(city_id,assigned_to)) then raise exception 'not authorized' using errcode='42501'; end if;
 insert into public.lead_activities(lead_id,note,created_by) values(p_id,p_note,auth.uid()) returning id into result; return result;
end $$;
create function public.grant_city_member(p_application uuid,p_user uuid,p_status text) returns uuid language plpgsql security definer set search_path='' as $$
declare c uuid; result uuid;
begin
 if public.app_role()<>'super_admin' or public.app_role() is null then raise exception 'not authorized' using errcode='42501'; end if;
 select city_id into c from public.city_applications where id=p_application and status in ('approved','active');
 if c is null or not exists(select 1 from public.profiles where id=p_user and role='city_manager' and status='active') then raise exception 'approved application and city manager required'; end if;
 insert into public.city_members(city_id,user_id,application_id,status,created_by) values(c,p_user,p_application,p_status,auth.uid()) on conflict(city_id,user_id) do update set status=excluded.status,application_id=excluded.application_id returning id into result;
 return result;
end $$;

create function public.register_event(p_event uuid,p_name text,p_contact text,p_cancel boolean default false) returns text language plpgsql security definer set search_path='' as $$
declare ev public.events; prior text; result text;
begin
 if auth.uid() is null or public.app_role() is null then raise exception 'login required' using errcode='42501'; end if;
 select * into ev from public.events where id=p_event for update;
 if ev.id is null then raise exception 'event not found'; end if;
 select status into prior from public.event_registrations where event_id=p_event and user_id=auth.uid();
 if p_cancel then
  if ev.starts_at<=now() or prior='attended' then raise exception 'cancellation closed'; end if;
  if prior is null then raise exception 'registration not found'; end if;
  update public.event_registrations set status='cancelled' where event_id=p_event and user_id=auth.uid(); return 'cancelled';
 end if;
 if ev.status<>'published' or ev.registration_deadline<=now() or ev.starts_at<=now() then raise exception 'registration closed'; end if;
 if prior in ('pending','confirmed','attended') then return prior; end if;
 if (select count(*) from public.event_registrations where event_id=p_event and status in ('pending','confirmed','attended'))>=ev.capacity then raise exception 'event full'; end if;
 if length(trim(p_name)) not between 1 and 80 or length(trim(p_contact)) not between 5 and 160 then raise exception 'invalid contact'; end if;
 result:=case when ev.requires_approval then 'pending' else 'confirmed' end;
 insert into public.event_registrations(event_id,user_id,contact_name,contact,status,created_by) values(p_event,auth.uid(),p_name,p_contact,result,auth.uid()) on conflict(event_id,user_id) do update set status=excluded.status,contact_name=excluded.contact_name,contact=excluded.contact,consent_at=now();
 return result;
end $$;
create function public.review_registration(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare ev public.events; reg public.event_registrations;
begin
 select e.* into ev from public.events e join public.event_registrations r on r.event_id=e.id where r.id=p_id for update of e;
 if ev.id is null or not coalesce(public.can_access(ev.city_id,ev.assigned_to),false) then raise exception 'not authorized' using errcode='42501'; end if;
 select * into reg from public.event_registrations where id=p_id for update;
 if not ((reg.status='pending' and p_status in ('confirmed','cancelled')) or (reg.status='confirmed' and p_status in ('attended','cancelled'))) then raise exception 'invalid registration transition'; end if;
 if p_status='attended' and (now()<ev.starts_at-interval '2 hours' or now()>ev.ends_at+interval '1 day' or ev.status<>'published') then raise exception 'checkin not open'; end if;
 update public.event_registrations set status=p_status,checked_in_at=case when p_status='attended' then now() else checked_in_at end where id=p_id;
end $$;

create function public.claim_notifications(p_limit integer default 10) returns setof public.notification_outbox language plpgsql security definer set search_path='' as $$
begin
 return query update public.notification_outbox set status='processing',attempts=attempts+1,available_at=now()+interval '5 minutes' where id in(select id from public.notification_outbox where (status in ('pending','failed') or status='processing') and available_at<=now() and attempts<8 order by created_at for update skip locked limit least(p_limit,20)) returning *;
end $$;
create function public.purge_expired_data() returns integer language plpgsql security definer set search_path='' as $$
declare tbl text; n integer; total integer:=0;
begin
 foreach tbl in array array['enterprise_leads','partner_applications','expert_applications','memberships','event_registrations'] loop
 execute format('delete from public.%I where retention_until<now()',tbl); get diagnostics n=row_count; total:=total+n;
 end loop;
 -- Active/approved city authorization requires an application: retain only while the relationship is active.
 delete from public.city_applications where retention_until<now() and status in ('submitted','review','interview','rejected','paused') and not exists(select 1 from public.city_members m where m.application_id=public.city_applications.id);
 delete from public.rate_limits where expires_at<now();
 delete from public.notification_outbox where created_at<now()-interval '90 days';
 delete from public.audit_logs where created_at<now()-interval '730 days';
 return total;
end $$;

-- Revoke PostgreSQL's default PUBLIC execute grant, then explicitly expose each surface.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.app_role(),public.is_staff(),public.can_access(uuid,uuid) to anon,authenticated;
grant execute on function public.public_events() to anon,authenticated;
grant execute on function public.manage_record(text,uuid,jsonb),public.add_lead_note(uuid,text),public.grant_city_member(uuid,uuid,text),public.register_event(uuid,text,text,boolean),public.review_registration(uuid,text) to authenticated;
grant execute on all functions in schema public to service_role;
commit;
