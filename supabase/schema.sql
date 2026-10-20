-- ============================================================
-- aftermediate — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Profiles (one row per authenticated user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_style text default 'adventurer',
  avatar_seed text default '',
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

-- Migration for DiceBear avatars (replaces old avatar text column):
-- alter table public.profiles add column if not exists avatar_style text default 'adventurer';
-- alter table public.profiles add column if not exists avatar_seed text default '';
-- alter table public.profiles drop column if exists avatar;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;

-- Profiles: user can read/update their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- Email OTP verification — replaces the Supabase confirmation link
-- ============================================================
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists otp_codes_email_idx on public.otp_codes (email, created_at desc);

-- Migration for databases created before the OTP user_id column was added:
-- alter table public.otp_codes add column if not exists user_id uuid;

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
  author_name text not null,
  description text default '',
  use_case text default '',
  priority text not null default 'p1' check (priority in ('p0','p1','p2')),
  status text not null default 'open' check (status in ('open','planning','shipped')),
  votes_count integer not null default 0,
  created_at timestamptz default now()
);

-- Migration: every suggestion carries a visible author name. Rows that predate
-- the column get backfilled from their profile before it is made mandatory.
alter table public.feature_requests add column if not exists author_name text;
update public.feature_requests fr
   set author_name = coalesce(nullif(btrim(p.name), ''), 'A student')
  from public.profiles p
 where p.id = fr.user_id and fr.author_name is null;
update public.feature_requests set author_name = 'A student' where author_name is null;
alter table public.feature_requests alter column author_name set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feature_requests_author_name_blank'
  ) then
    alter table public.feature_requests
      add constraint feature_requests_author_name_blank check (btrim(author_name) <> '');
  end if;
end $$;


create table if not exists public.feature_replies (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references public.feature_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz default now(),
  check (btrim(author_name) <> ''),
  check (char_length(author_name) <= 80),
  check (btrim(body) <> ''),
  check (char_length(body) <= 2000)
);

create index if not exists feature_replies_feature_id_idx
  on public.feature_replies (feature_id, created_at);

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
alter table public.feature_replies enable row level security;

create policy "reviews_select" on public.reviews for select using (auth.uid() = user_id or status = 'published');
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id and status = 'pending');
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- sentiment fields are server-computed; users must not set them on insert
revoke insert on public.reviews from anon, authenticated;
grant insert (user_id, tone, rating, review_text, surprised, mindset, recommend_to) on public.reviews to authenticated;

create policy "review_media_select" on public.review_media for select using (
  exists (select 1 from public.reviews r where r.id = review_id and (r.user_id = auth.uid() or r.status = 'published'))
);
create policy "review_media_insert_own" on public.review_media for insert with check (
  exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
  and file_size > 0 and file_size <= 26214400
  and char_length(file_name) <= 255
  and (
    select count(*)
    from public.review_media existing
    where existing.review_id = public.review_media.review_id
  ) < 5
);

create or replace function public.enforce_review_media_limit() returns trigger
language plpgsql set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.review_id::text, 0));
  if (select count(*) from public.review_media where review_id = new.review_id) >= 5 then
    raise exception 'A review cannot have more than 5 media files' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists review_media_limit on public.review_media;
create trigger review_media_limit before insert on public.review_media
for each row execute function public.enforce_review_media_limit();

create policy "feature_requests_select" on public.feature_requests for select using (auth.role() = 'authenticated');
create policy "feature_requests_insert_own" on public.feature_requests for insert with check (auth.uid() = user_id and status = 'open' and votes_count = 0);
create policy "feature_requests_update_own" on public.feature_requests for update using (auth.uid() = user_id);

create policy "feature_votes_select_own" on public.feature_votes for select using (auth.uid() = user_id);
create policy "feature_votes_insert_own" on public.feature_votes for insert with check (auth.uid() = user_id);
create policy "feature_votes_delete_own" on public.feature_votes for delete using (auth.uid() = user_id);

create policy "feature_replies_select" on public.feature_replies for select using (auth.role() = 'authenticated');
create policy "feature_replies_insert_own" on public.feature_replies for insert with check (auth.uid() = user_id);

-- users may update only their own rows' editable columns — never server-controlled ones
revoke update on public.reviews from anon, authenticated;
grant update (review_text, surprised, mindset, recommend_to, tone, rating) on public.reviews to authenticated;
revoke update on public.feature_requests from anon, authenticated;
grant update (name, description, use_case) on public.feature_requests to authenticated;

-- Storage bucket for review media (private — media is served via signed URLs
-- from /api/review-media/url after checking review ownership/status)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-media',
  'review-media',
  false,
  26214400,
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'video/mp4','video/webm',
    'audio/mpeg','audio/webm','audio/wav'
  ]
)
on conflict (id) do nothing;

create policy "review_media_upload_own" on storage.objects
  for insert with check (bucket_id = 'review-media' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "review_media_delete_own" on storage.objects
  for delete using (bucket_id = 'review-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Contact messages (landing page form)
-- ============================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  rating smallint check (rating between 1 and 5),
  status text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;
-- Inserts go through the server route (/api/contact), never the client, so the
-- anon/authenticated roles are revoked from the table entirely.
revoke insert on public.contact_messages from anon, authenticated;
create policy "contact_select_own" on public.contact_messages
  for select using (auth.uid() = user_id);

-- ============================================================
-- Mentor applications
-- ============================================================
create table if not exists public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  institution text not null,
  degree text not null,
  field text not null,
  bio text not null,
  topics text not null,
  social_link text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','accepted','rejected')),
  created_at timestamptz default now()
);

alter table public.mentor_applications enable row level security;
-- Inserts go through the server route (/api/mentors/apply), never the client.
revoke insert on public.mentor_applications from anon, authenticated;
create policy "mentor_select_own" on public.mentor_applications
  for select using (auth.uid() = user_id);

-- ============================================================
-- Least-privilege inserts: contact_messages and mentor_applications
-- have no table-level INSERT grant (revoked above). The anon and
-- Only the service-role server client may execute these SECURITY DEFINER
-- functions. Browser roles cannot bypass route validation or forge ownership.
-- ============================================================
create or replace function public.insert_contact_message(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_message text,
  p_rating smallint
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.contact_messages (user_id, name, email, message, rating, status)
  values (p_user_id, p_name, p_email, p_message, p_rating, 'new')
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.insert_contact_message(uuid, text, text, text, smallint) from public;
revoke execute on function public.insert_contact_message(uuid, text, text, text, smallint) from anon, authenticated;
grant execute on function public.insert_contact_message(uuid, text, text, text, smallint) to service_role;

create or replace function public.insert_mentor_application(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_institution text,
  p_degree text,
  p_field text,
  p_bio text,
  p_topics text,
  p_social_link text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.mentor_applications (user_id, name, email, institution, degree, field, bio, topics, social_link)
  values (p_user_id, p_name, p_email, p_institution, p_degree, p_field, p_bio, p_topics, p_social_link)
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.insert_mentor_application(uuid, text, text, text, text, text, text, text, text) from public;
revoke execute on function public.insert_mentor_application(uuid, text, text, text, text, text, text, text, text) from anon, authenticated;
grant execute on function public.insert_mentor_application(uuid, text, text, text, text, text, text, text, text) to service_role;

-- ============================================================
-- AI Chat sessions & messages (Manzil, Safar, Ustaad)
-- ============================================================
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  persona text not null check (persona in ('manzil','safar','study')),
  title text not null default 'New chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists chat_sessions_user_persona_idx
  on public.chat_sessions (user_id, persona, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_sessions_crud" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_messages_crud" on public.chat_messages
  for all using (
    exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- ============================================================
-- Shared abuse controls and database-level payload constraints
-- ============================================================
create table if not exists public.rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  count integer not null check (count > 0)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_max integer,
  p_window_ms bigint
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
  v_window interval;
begin
  if p_key is null or length(p_key) > 300 or p_max < 1 or p_max > 10000
     or p_window_ms < 1000 or p_window_ms > 604800000 then
    return false;
  end if;
  v_window := make_interval(secs => p_window_ms::double precision / 1000.0);
  insert into public.rate_limits as limits (key, window_started_at, count)
  values (p_key, v_now, 1)
  on conflict (key) do update set
    window_started_at = case when limits.window_started_at + v_window <= v_now then v_now else limits.window_started_at end,
    count = case when limits.window_started_at + v_window <= v_now then 1 else limits.count + 1 end
  returning count into v_count;
  delete from public.rate_limits where key in (
    select key from public.rate_limits where window_started_at < v_now - interval '8 days' limit 100
  );
  return v_count <= p_max;
end $$;
revoke execute on function public.consume_rate_limit(text, integer, bigint) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, bigint) to service_role;

create or replace function public.consume_otp_code(
  p_email text,
  p_code_hash text,
  p_max_attempts integer
) returns table(status text, user_id uuid)
language plpgsql security definer set search_path = public
as $$
declare v_record public.otp_codes%rowtype;
begin
  select * into v_record from public.otp_codes
   where email = lower(p_email) order by created_at desc limit 1 for update;
  if not found or v_record.expires_at <= clock_timestamp() or v_record.attempts >= p_max_attempts then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;
  if v_record.code_hash <> p_code_hash then
    update public.otp_codes set attempts = attempts + 1 where id = v_record.id;
    return query select 'invalid'::text, null::uuid;
    return;
  end if;
  delete from public.otp_codes where email = lower(p_email);
  return query select 'verified'::text, v_record.user_id;
end $$;
revoke execute on function public.consume_otp_code(text, text, integer) from public, anon, authenticated;
grant execute on function public.consume_otp_code(text, text, integer) to service_role;

create or replace function public.store_otp_code(
  p_email text,
  p_user_id uuid,
  p_code_hash text,
  p_expires_at timestamptz,
  p_cooldown_seconds integer default 60
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email = '' or p_user_id is null or p_code_hash = ''
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '15 minutes'
     or p_cooldown_seconds < 1 or p_cooldown_seconds > 3600 then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_email, 0));
  if exists (
    select 1 from public.otp_codes
     where email = v_email
       and created_at > clock_timestamp() - make_interval(secs => p_cooldown_seconds)
  ) then
    return false;
  end if;
  delete from public.otp_codes where email = v_email;
  insert into public.otp_codes (email, user_id, code_hash, attempts, expires_at)
  values (v_email, p_user_id, p_code_hash, 0, p_expires_at);
  return true;
end $$;
revoke execute on function public.store_otp_code(text, uuid, text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.store_otp_code(text, uuid, text, timestamptz, integer) to service_role;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_payload_bounds') then
    alter table public.profiles add constraint profiles_payload_bounds check (
      char_length(coalesce(name, '')) <= 100 and char_length(coalesce(bio, '')) <= 2000 and
      char_length(coalesce(city, '')) <= 120 and char_length(coalesce(budget, '')) <= 40 and
      cardinality(interests) <= 30 and cardinality(skills) <= 50 and
      octet_length(marks::text) <= 20000 and octet_length(education::text) <= 100000 and
      octet_length(quiz::text) <= 100000 and octet_length(practice::text) <= 500000 and
      jsonb_typeof(watchlist) = 'array' and jsonb_array_length(watchlist) <= 50
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_text_bounds') then
    alter table public.reviews add constraint reviews_text_bounds check (
      char_length(review_text) <= 5000 and char_length(surprised) <= 2000 and
      char_length(mindset) <= 2000 and cardinality(recommend_to) <= 20
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'review_media_bounds') then
    alter table public.review_media add constraint review_media_bounds check (
      char_length(url) <= 512 and char_length(file_name) <= 255 and file_size > 0 and file_size <= 26214400
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feature_requests_text_bounds') then
    alter table public.feature_requests add constraint feature_requests_text_bounds check (
      char_length(name) between 1 and 160 and char_length(author_name) <= 80 and
      char_length(description) <= 5000 and char_length(use_case) <= 3000
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mentor_applications_text_bounds') then
    alter table public.mentor_applications add constraint mentor_applications_text_bounds check (
      char_length(name) between 1 and 100 and char_length(email) <= 200 and
      char_length(institution) <= 200 and char_length(degree) <= 160 and
      char_length(field) <= 160 and char_length(bio) <= 5000 and
      char_length(topics) <= 2000 and char_length(social_link) <= 500
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'chat_sessions_title_bounds') then
    alter table public.chat_sessions add constraint chat_sessions_title_bounds check (char_length(title) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'chat_messages_content_bounds') then
    alter table public.chat_messages add constraint chat_messages_content_bounds check (char_length(content) between 1 and 20000);
  end if;
end $$;

create or replace function public.set_review_sentiment() returns trigger
language plpgsql set search_path = public
as $$
declare v_base integer;
begin
  v_base := case new.tone
    when 'loved' then 85 when 'liked' then 70 when 'meh' then 50
    when 'disappointed' then 30 else 15 end;
  new.sentiment_score := greatest(0, least(100, v_base + round(((new.rating - 5)::numeric / 5) * 20)::integer));
  new.sentiment_tag := case
    when new.sentiment_score >= 85 then 'highly-positive'
    when new.sentiment_score >= 60 then 'positive'
    when new.sentiment_score >= 40 then 'constructive'
    else 'critical' end;
  return new;
end $$;

drop trigger if exists reviews_set_sentiment on public.reviews;
create trigger reviews_set_sentiment before insert or update of tone, rating on public.reviews
for each row execute function public.set_review_sentiment();
