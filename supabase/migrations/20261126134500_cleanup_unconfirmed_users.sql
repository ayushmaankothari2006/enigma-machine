-- Migration: Automatically purge expired unconfirmed users so unverified/false emails do not persist

create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.cleanup_unconfirmed_users()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from auth.users
  where email_confirmed_at is null
    and is_anonymous = false
    and coalesce(confirmation_sent_at, created_at) < now() - interval '24 hours';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.cleanup_unconfirmed_users() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-unconfirmed-users') then
    perform cron.unschedule('cleanup-unconfirmed-users');
  end if;
end;
$$;

select cron.schedule(
  'cleanup-unconfirmed-users',
  '0 * * * *',
  'select private.cleanup_unconfirmed_users();'
);
