-- Migration: Create RLS-protected rotor_presets table for Enigma96
-- Applied to Supabase project lyvskcwxbbbjocjoghgj

create or replace function public.handle_rotor_presets_updated_at()
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

create table public.rotor_presets (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 240),
  reflector text not null default 'A' check (reflector in ('A', 'B')),
  left_rotor_id text not null default 'I' check (left_rotor_id in ('I', 'II', 'III', 'IV', 'V')),
  left_position smallint not null check (left_position between 0 and 95),
  left_ring_setting smallint not null check (left_ring_setting between 0 and 95),
  left_turnover_notch smallint not null check (left_turnover_notch between 0 and 95),
  middle_rotor_id text not null default 'II' check (middle_rotor_id in ('I', 'II', 'III', 'IV', 'V')),
  middle_position smallint not null check (middle_position between 0 and 95),
  middle_ring_setting smallint not null check (middle_ring_setting between 0 and 95),
  middle_turnover_notch smallint not null check (middle_turnover_notch between 0 and 95),
  right_rotor_id text not null default 'III' check (right_rotor_id in ('I', 'II', 'III', 'IV', 'V')),
  right_position smallint not null check (right_position between 0 and 95),
  right_ring_setting smallint not null check (right_ring_setting between 0 and 95),
  right_turnover_notch smallint not null check (right_turnover_notch between 0 and 95),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rotor_presets_user_id_updated_at_idx
  on public.rotor_presets (user_id, updated_at desc);

create trigger set_rotor_presets_updated_at
  before update on public.rotor_presets
  for each row
  execute function public.handle_rotor_presets_updated_at();

revoke all on table public.rotor_presets from public, anon;
grant select, insert, update, delete on table public.rotor_presets to authenticated;

alter table public.rotor_presets enable row level security;

create policy "Users can view their own rotor presets"
  on public.rotor_presets
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can insert their own rotor presets"
  on public.rotor_presets
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own rotor presets"
  on public.rotor_presets
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own rotor presets"
  on public.rotor_presets
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
