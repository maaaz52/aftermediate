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
-- Email OTP verification — replaces the Supabase confirmation link
-- ============================================================
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists otp_codes_email_idx on public.otp_codes (email, created_at desc);

-- RLS: only the service role (server) touches this table; clients never read/write it
alter table public.otp_codes enable row level security;

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
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Migration for University Watchlist feature:
alter table public.profiles add column if not exists watchlist jsonb default '[]'::jsonb;

-- ============================================================
-- Your Voice — feedback & feature wishlist
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tone text not null check (tone in ('loved','liked','meh','disappointed','frustrated')),
  rating smallint not null check (rating between 0 and 10),
  review_text text default '',
  surprised text default '',
  mindset text default '',
  recommend_to text[] default '{}',
  sentiment_tag text check (sentiment_tag in ('highly-positive','positive','constructive','critical')),
  sentiment_score smallint check (sentiment_score between 0 and 100),
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at timestamptz default now()
);

create table if not exists public.review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade,
  url text not null,
  media_type text not null check (media_type in ('image','video','audio')),
  file_name text not null,
  file_size integer not null,
  created_at timestamptz default now()
);

create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  use_case text default '',
  priority text not null default 'p1' check (priority in ('p0','p1','p2')),
  status text not null default 'open' check (status in ('open','planning','shipped')),
  votes_count integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.feature_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  feature_id uuid references public.feature_requests(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, feature_id)
);

-- votes counter
create or replace function public.bump_votes_count() returns trigger
  set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.feature_requests set votes_count = votes_count + 1 where id = new.feature_id;
  elsif tg_op = 'DELETE' then
    update public.feature_requests set votes_count = greatest(0, votes_count - 1) where id = old.feature_id;
  end if;
  return coalesce(new, old);
end; $$ language plpgsql security definer;

drop trigger if exists feature_votes_bump on public.feature_votes;
create trigger feature_votes_bump after insert or delete on public.feature_votes
  for each row execute function public.bump_votes_count();

-- RLS
alter table public.reviews enable row level security;
alter table public.review_media enable row level security;
alter table public.feature_requests enable row level security;
alter table public.feature_votes enable row level security;

create policy "reviews_select" on public.reviews for select using (auth.uid() = user_id or status = 'published');
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id and status = 'pending');
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

create policy "review_media_select" on public.review_media for select using (
  exists (select 1 from public.reviews r where r.id = review_id and (r.user_id = auth.uid() or r.status = 'published'))
);
create policy "review_media_insert_own" on public.review_media for insert with check (
  exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
);

create policy "feature_requests_select" on public.feature_requests for select using (auth.role() = 'authenticated');
create policy "feature_requests_insert_own" on public.feature_requests for insert with check (auth.uid() = user_id and status = 'open' and votes_count = 0);
create policy "feature_requests_update_own" on public.feature_requests for update using (auth.uid() = user_id);

create policy "feature_votes_select_own" on public.feature_votes for select using (auth.uid() = user_id);
create policy "feature_votes_insert_own" on public.feature_votes for insert with check (auth.uid() = user_id);
create policy "feature_votes_delete_own" on public.feature_votes for delete using (auth.uid() = user_id);

-- users may update only their own rows' editable columns — never server-controlled ones
revoke update on public.reviews from anon, authenticated;
grant update (review_text, surprised, mindset, recommend_to, tone, rating) on public.reviews to authenticated;
revoke update on public.feature_requests from anon, authenticated;
grant update (name, description, use_case, priority) on public.feature_requests to authenticated;

-- Storage bucket for review media
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;

create policy "review_media_upload_own" on storage.objects
  for insert with check (bucket_id = 'review-media' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "review_media_delete_own" on storage.objects
  for delete using (bucket_id = 'review-media' and auth.uid()::text = (storage.foldername(name))[1]);
