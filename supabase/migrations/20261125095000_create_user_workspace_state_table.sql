-- Migration: Create RLS-protected user_workspace_state table for per-user Enigma96 texts & rotor settings

create or replace function public.handle_user_workspace_state_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_workspace_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  input_text text not null default '',
  reflector text not null default 'A' check (reflector in ('A', 'B')),
  left_rotor_id text not null default 'I' check (left_rotor_id in ('I', 'II', 'III', 'IV', 'V')),
  left_position smallint not null default 0 check (left_position between 0 and 95),
  left_ring_setting smallint not null default 0 check (left_ring_setting between 0 and 95),
  left_turnover_notch smallint not null default 33 check (left_turnover_notch between 0 and 95),
  middle_rotor_id text not null default 'II' check (middle_rotor_id in ('I', 'II', 'III', 'IV', 'V')),
  middle_position smallint not null default 0 check (middle_position between 0 and 95),
  middle_ring_setting smallint not null default 0 check (middle_ring_setting between 0 and 95),
  middle_turnover_notch smallint not null default 65 check (middle_turnover_notch between 0 and 95),
  right_rotor_id text not null default 'III' check (right_rotor_id in ('I', 'II', 'III', 'IV', 'V')),
  right_position smallint not null default 0 check (right_position between 0 and 95),
  right_ring_setting smallint not null default 0 check (right_ring_setting between 0 and 95),
  right_turnover_notch smallint not null default 16 check (right_turnover_notch between 0 and 95),
  updated_at timestamptz not null default now()
);

create trigger set_user_workspace_state_updated_at
  before update on public.user_workspace_state
  for each row
  execute function public.handle_user_workspace_state_updated_at();

revoke all on table public.user_workspace_state from public, anon;
grant select, insert, update, delete on table public.user_workspace_state to authenticated;

alter table public.user_workspace_state enable row level security;

create policy "Users can view their own workspace state"
  on public.user_workspace_state
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can insert their own workspace state"
  on public.user_workspace_state
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own workspace state"
  on public.user_workspace_state
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own workspace state"
  on public.user_workspace_state
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
