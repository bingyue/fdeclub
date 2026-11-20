-- Expired city applications are retained only while an active authorization requires them.
begin;
create or replace function public.purge_expired_data() returns integer language plpgsql security definer set search_path='' as $$
declare tbl text; n integer; total integer:=0;
begin
 foreach tbl in array array['enterprise_leads','partner_applications','expert_applications','memberships','event_registrations'] loop
 execute format('delete from public.%I where retention_until<now()',tbl); get diagnostics n=row_count; total:=total+n;
 end loop;
 delete from public.city_members where status='paused' and application_id in(select id from public.city_applications where retention_until<now());
 delete from public.city_applications where retention_until<now() and not exists(select 1 from public.city_members m where m.application_id=public.city_applications.id and m.status='active');
 get diagnostics n=row_count; total:=total+n;
 delete from public.rate_limits where expires_at<now();
 delete from public.notification_outbox where created_at<now()-interval '90 days';
 delete from public.audit_logs where created_at<now()-interval '730 days';
 return total;
end $$;
commit;
