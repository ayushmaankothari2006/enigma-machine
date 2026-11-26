-- Migration: Create Enigma Drive tables and private storage bucket

create table public.drive_sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (char_length(token) between 4 and 16),
  owner_user_id uuid references auth.users(id) on delete set null,
  password_salt text,
  password_hash text,
  has_password boolean not null default false,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  lockdown_mode boolean not null default false,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index drive_sessions_expires_at_idx on public.drive_sessions (expires_at);
create index drive_sessions_owner_user_id_idx on public.drive_sessions (owner_user_id);

create table public.drive_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.drive_sessions(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null default 'application/octet-stream',
  file_category text not null check (file_category in ('image', 'document', 'archive', 'text', 'other')),
  size_bytes bigint not null check (size_bytes >= 0 and size_bytes <= 52428800),
  storage_path text not null unique,
  uploaded_by text not null default 'Device',
  created_at timestamptz not null default now()
);

create index drive_files_session_id_created_at_idx on public.drive_files (session_id, created_at desc);
create index drive_files_owner_user_id_idx on public.drive_files (owner_user_id);

create table public.drive_clipboard_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.drive_sessions(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) between 1 and 20000),
  created_by text not null default 'Device',
  created_at timestamptz not null default now()
);

create index drive_clipboard_items_session_id_created_at_idx on public.drive_clipboard_items (session_id, created_at desc);
create index drive_clipboard_items_owner_user_id_idx on public.drive_clipboard_items (owner_user_id);

revoke all on table public.drive_sessions from public, anon, authenticated;
revoke all on table public.drive_files from public, anon, authenticated;
revoke all on table public.drive_clipboard_items from public, anon, authenticated;

alter table public.drive_sessions enable row level security;
alter table public.drive_files enable row level security;
alter table public.drive_clipboard_items enable row level security;

create policy "Owners can view their drive sessions"
  on public.drive_sessions for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_user_id);

create policy "Owners can view their drive files"
  on public.drive_files for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_user_id);

create policy "Owners can view their drive clipboard items"
  on public.drive_clipboard_items for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('enigma-drive', 'enigma-drive', false, 52428800)
on conflict (id) do update
  set public = false,
      file_size_limit = 52428800;
