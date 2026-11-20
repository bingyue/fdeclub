#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=pw="$POSTGRES_PASSWORD" <<'SQL'
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password :'pw';
grant anon, authenticated, service_role to authenticator;
create role supabase_auth_admin login noinherit createrole password :'pw';
create schema auth authorization supabase_auth_admin;
grant all on database fdeclub to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;
revoke create on schema public from public;
grant usage on schema auth to anon, authenticated, service_role;
SQL
