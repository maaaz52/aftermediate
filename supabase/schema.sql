-- ============================================================
-- aftermediate — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Profiles (one row per authenticated user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar text,
  bio text,
  stream text check (stream in ('pre-medical', 'pre-engineering', 'ics', 'icom', 'alevel')),
  board text,
  marks jsonb default '{}'::jsonb,
  interests text[] default '{}',
  skills text[] default '{}',
  education jsonb default '[]'::jsonb,
  city text,
  budget text,
  quiz jsonb default '{}'::jsonb,
  quiz_completed_at timestamptz,
  practice jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migration for databases created before the Self Assessment feature:
-- alter table public.profiles add column if not exists practice jsonb default '[]'::jsonb;

-- Saved plans (roadmaps a user saves)
create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Chat history (optional)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  persona text not null default 'rahbar',
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.saved_plans enable row level security;
alter table public.chat_sessions enable row level security;

-- Profiles: user can read/update their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Saved plans
create policy "plans_select_own" on public.saved_plans
  for select using (auth.uid() = user_id);
create policy "plans_insert_own" on public.saved_plans
  for insert with check (auth.uid() = user_id);
create policy "plans_delete_own" on public.saved_plans
  for delete using (auth.uid() = user_id);

-- Chat sessions
create policy "chats_select_own" on public.chat_sessions
  for select using (auth.uid() = user_id);
create policy "chats_insert_own" on public.chat_sessions
  for insert with check (auth.uid() = user_id);
create policy "chats_update_own" on public.chat_sessions
  for update using (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for marksheet scans (optional)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('marksheets', 'marksheets', false)
on conflict (id) do nothing;

create policy "marksheets_upload_own" on storage.objects
  for insert with check (bucket_id = 'marksheets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "marksheets_read_own" on storage.objects
  for select using (bucket_id = 'marksheets' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Trigger: auto-create a profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
