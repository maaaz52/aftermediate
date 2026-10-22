-- Optional, bounded weekly "next action" emails. The weekly bucket and
-- delivery state make Vercel retries safe: a student cannot receive this
-- digest twice in the same week.

alter table public.notification_preferences
  add column if not exists weekly_action_digest boolean not null default false;

create table if not exists public.weekly_action_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'skipped', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 20),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists weekly_action_digest_deliveries_status_idx
  on public.weekly_action_digest_deliveries (status, week_start, created_at);

alter table public.weekly_action_digest_deliveries enable row level security;
revoke all on public.weekly_action_digest_deliveries from anon, authenticated;

create or replace function public.claim_weekly_action_digest_deliveries(p_limit integer)
returns table (delivery_id uuid, user_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_week_start date := date_trunc('week', current_date)::date;
begin
  -- The application keeps this lower than the database maximum to protect the
  -- email allowance, while this guard prevents an accidental unbounded caller.
  if p_limit < 1 or p_limit > 10 then raise exception 'Invalid weekly digest batch size'; end if;
  return query
  with eligible as (
    select preference.user_id
    from public.notification_preferences preference
    left join public.weekly_action_digest_deliveries delivery
      on delivery.user_id = preference.user_id and delivery.week_start = v_week_start
    where preference.weekly_action_digest = true
      and exists (select 1 from public.source_follows follows where follows.user_id = preference.user_id)
      and (
        delivery.id is null
        or (
          (delivery.status = 'pending' or (delivery.status = 'sending' and delivery.last_attempt_at < now() - interval '1 hour'))
          and delivery.attempt_count < 20
        )
      )
    order by preference.updated_at asc, preference.user_id asc
    limit p_limit
  ), claimed as (
    insert into public.weekly_action_digest_deliveries as delivery
      (user_id, week_start, status, attempt_count, last_attempt_at, last_error)
    select eligible.user_id, v_week_start, 'sending', 1, now(), null
    from eligible
    on conflict (user_id, week_start) do update set
      status = 'sending', attempt_count = delivery.attempt_count + 1,
      last_attempt_at = now(), last_error = null
    where (delivery.status = 'pending' or (delivery.status = 'sending' and delivery.last_attempt_at < now() - interval '1 hour'))
      and delivery.attempt_count < 20
    returning delivery.id, delivery.user_id
  )
  select claimed.id, claimed.user_id from claimed;
end;
$$;

create or replace function public.complete_weekly_action_digest_delivery(
  p_delivery_id uuid, p_outcome text, p_error text default null, p_retry boolean default false
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_outcome not in ('sent', 'skipped', 'failed') then raise exception 'Invalid weekly digest outcome'; end if;
  if p_error is not null and char_length(p_error) > 500 then raise exception 'Weekly digest error is too long'; end if;
  update public.weekly_action_digest_deliveries
  set status = case
        when p_outcome = 'sent' then 'sent'
        when p_outcome = 'skipped' then 'skipped'
        when p_retry then 'pending'
        else 'failed'
      end,
      sent_at = case when p_outcome = 'sent' then now() else sent_at end,
      last_error = case when p_outcome in ('sent', 'skipped') then null else p_error end
  where id = p_delivery_id and status = 'sending';
end;
$$;

revoke all on function public.claim_weekly_action_digest_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_weekly_action_digest_deliveries(integer) to service_role;
revoke all on function public.complete_weekly_action_digest_delivery(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.complete_weekly_action_digest_delivery(uuid, text, text, boolean) to service_role;
