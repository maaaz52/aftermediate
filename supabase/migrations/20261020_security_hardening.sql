-- Security and data-integrity hardening for the 2026-10-20 audit.

-- These functions are intentionally callable only with the server-side
-- service-role key. The caller-provided user id is retained for RPC backwards
-- compatibility, but ownership is validated by the server route before use.
revoke execute on function public.insert_contact_message(uuid, text, text, text, smallint) from anon, authenticated;
grant execute on function public.insert_contact_message(uuid, text, text, text, smallint) to service_role;

revoke execute on function public.insert_mentor_application(uuid, text, text, text, text, text, text, text, text) from anon, authenticated;
grant execute on function public.insert_mentor_application(uuid, text, text, text, text, text, text, text, text) to service_role;

-- Shared rate limits survive cold starts and concurrent serverless instances.
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
language plpgsql
security definer
set search_path = public
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
  on conflict (key) do update
    set window_started_at = case
          when limits.window_started_at + v_window <= v_now then v_now
          else limits.window_started_at
        end,
        count = case
          when limits.window_started_at + v_window <= v_now then 1
          else limits.count + 1
        end
  returning count into v_count;

  delete from public.rate_limits
   where key in (
     select key from public.rate_limits
      where window_started_at < v_now - interval '8 days'
      limit 100
   );

  return v_count <= p_max;
end $$;


-- Enforce upload limits in Storage itself; browser-side checks are advisory.
update storage.buckets
   set file_size_limit = 26214400,
       allowed_mime_types = array[
         'image/png','image/jpeg','image/webp','image/gif',
         'video/mp4','video/webm',
         'audio/mpeg','audio/webm','audio/wav'
       ]
 where id = 'review-media';

drop policy if exists "review_media_insert_own" on public.review_media;
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

-- Populate the moderation fields deterministically on every review insert/update.
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


revoke execute on function public.consume_rate_limit(text, integer, bigint) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, bigint) to service_role;

-- Consume an OTP and increment failed attempts while holding a row lock.
create or replace function public.consume_otp_code(
  p_email text,
  p_code_hash text,
  p_max_attempts integer
) returns table(status text, user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.otp_codes%rowtype;
begin
  select * into v_record
    from public.otp_codes
   where email = lower(p_email)
   order by created_at desc
   limit 1
   for update;

  if not found or v_record.expires_at <= clock_timestamp()
     or v_record.attempts >= p_max_attempts then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;

  if v_record.code_hash <> p_code_hash then
    update public.otp_codes
       set attempts = attempts + 1
     where id = v_record.id;
    return query select 'invalid'::text, null::uuid;
    return;
  end if;

  delete from public.otp_codes where email = lower(p_email);
  return query select 'verified'::text, v_record.user_id;
end $$;

revoke execute on function public.consume_otp_code(text, text, integer) from public, anon, authenticated;
grant execute on function public.consume_otp_code(text, text, integer) to service_role;

-- Serialize sends for one address so concurrent requests cannot issue two
-- different valid codes or bypass the resend cooldown.
create or replace function public.store_otp_code(
  p_email text,
  p_user_id uuid,
  p_code_hash text,
  p_expires_at timestamptz,
  p_cooldown_seconds integer default 60
) returns boolean
language plpgsql
security definer
set search_path = public
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

-- Database constraints protect against clients bypassing UI validation.
do $$
begin
  if to_regclass('public.profiles') is not null
     and not exists (select 1 from pg_constraint where conname = 'profiles_payload_bounds')
     and (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'profiles'
            and column_name = any(array['name','bio','city','budget','interests','skills','marks','education','quiz','practice','watchlist'])) = 11 then
    alter table public.profiles add constraint profiles_payload_bounds check (
      char_length(coalesce(name, '')) <= 100 and
      char_length(coalesce(bio, '')) <= 2000 and
      char_length(coalesce(city, '')) <= 120 and
      char_length(coalesce(budget, '')) <= 40 and
      cardinality(interests) <= 30 and cardinality(skills) <= 50 and
      octet_length(marks::text) <= 20000 and
      octet_length(education::text) <= 100000 and
      octet_length(quiz::text) <= 100000 and
      octet_length(practice::text) <= 500000 and
      jsonb_typeof(watchlist) = 'array' and jsonb_array_length(watchlist) <= 50
    ) not valid;
  end if;

  if to_regclass('public.reviews') is not null
     and not exists (select 1 from pg_constraint where conname = 'reviews_text_bounds')
     and (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'reviews'
            and column_name = any(array['review_text','surprised','mindset','recommend_to'])) = 4 then
    alter table public.reviews add constraint reviews_text_bounds check (
      char_length(review_text) <= 5000 and char_length(surprised) <= 2000 and
      char_length(mindset) <= 2000 and cardinality(recommend_to) <= 20
    ) not valid;
  end if;

  if to_regclass('public.review_media') is not null
     and not exists (select 1 from pg_constraint where conname = 'review_media_bounds')
     and (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'review_media'
            and column_name = any(array['url','file_name','file_size'])) = 3 then
    alter table public.review_media add constraint review_media_bounds check (
      char_length(url) <= 512 and char_length(file_name) <= 255 and
      file_size > 0 and file_size <= 26214400
    ) not valid;
  end if;

  if to_regclass('public.feature_requests') is not null
     and not exists (select 1 from pg_constraint where conname = 'feature_requests_text_bounds')
     and (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'feature_requests'
            and column_name = any(array['name','author_name','description','use_case'])) = 4 then
    alter table public.feature_requests add constraint feature_requests_text_bounds check (
      char_length(name) between 1 and 160 and char_length(author_name) <= 80 and
      char_length(description) <= 5000 and char_length(use_case) <= 3000
    ) not valid;
  end if;

  if to_regclass('public.mentor_applications') is not null
     and not exists (select 1 from pg_constraint where conname = 'mentor_applications_text_bounds')
     and (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'mentor_applications'
            and column_name = any(array['name','email','institution','degree','field','bio','topics','social_link'])) = 8 then
    alter table public.mentor_applications add constraint mentor_applications_text_bounds check (
      char_length(name) between 1 and 100 and char_length(email) <= 200 and
      char_length(institution) <= 200 and char_length(degree) <= 160 and
      char_length(field) <= 160 and char_length(bio) <= 5000 and
      char_length(topics) <= 2000 and char_length(social_link) <= 500
    ) not valid;
  end if;

  if to_regclass('public.chat_sessions') is not null
     and not exists (select 1 from pg_constraint where conname = 'chat_sessions_title_bounds')
     and exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'chat_sessions' and column_name = 'title') then
    alter table public.chat_sessions add constraint chat_sessions_title_bounds
      check (char_length(title) between 1 and 120) not valid;
  end if;

  if to_regclass('public.chat_messages') is not null
     and not exists (select 1 from pg_constraint where conname = 'chat_messages_content_bounds')
     and exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'chat_messages' and column_name = 'content') then
    alter table public.chat_messages add constraint chat_messages_content_bounds
      check (char_length(content) between 1 and 20000) not valid;
  end if;
end $$;
