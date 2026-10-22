-- Email delivery queue for reviewed official-source updates. A follow becomes
-- an alert only after an administrator has approved the source change.

create table if not exists public.source_update_notifications (
  id uuid primary key default gen_random_uuid(),
  source_update_candidate_id uuid not null references public.source_update_candidates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 20),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (source_update_candidate_id, user_id)
);

create index if not exists source_update_notifications_delivery_idx
  on public.source_update_notifications (status, created_at);

alter table public.source_update_notifications enable row level security;
revoke all on public.source_update_notifications from anon, authenticated;

-- Replaces the earlier review function with the same review/calendar behavior,
-- plus an atomic enqueue for everyone following the reviewed item.
create or replace function public.review_source_update(
  p_candidate_id uuid,
  p_status text,
  p_review_note text,
  p_reviewer uuid,
  p_event_type text default null,
  p_timing_label text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.source_update_candidates%rowtype;
  monitor public.source_monitors%rowtype;
begin
  if p_status not in ('approved', 'rejected') then raise exception 'Invalid review status'; end if;
  if char_length(coalesce(p_review_note, '')) > 1000 then raise exception 'Review note is too long'; end if;
  if (p_event_type is null) <> (p_timing_label is null) then raise exception 'A confirmed event and timing must be supplied together'; end if;
  if p_event_type is not null and p_event_type not in ('announcement', 'application', 'test', 'merit', 'fee', 'intake') then raise exception 'Invalid admission calendar event'; end if;
  if p_timing_label is not null and char_length(trim(p_timing_label)) not between 1 and 120 then raise exception 'Invalid confirmed timing'; end if;

  select * into candidate from public.source_update_candidates where id = p_candidate_id for update;
  if not found then raise exception 'Source update candidate was not found'; end if;
  if candidate.status <> 'pending' then raise exception 'Source update candidate has already been reviewed'; end if;
  select * into monitor from public.source_monitors where id = candidate.source_monitor_id;
  if not found then raise exception 'Source monitor was not found'; end if;
  if p_event_type is not null and (p_status <> 'approved' or monitor.entity_type <> 'university') then raise exception 'Only approved university updates can confirm calendar dates'; end if;

  update public.source_update_candidates
  set status = p_status, reviewed_at = now(), review_note = nullif(trim(p_review_note), '')
  where id = p_candidate_id;

  if p_event_type is not null then
    insert into public.admission_calendar_events (university_id, event_type, timing_label, source_url, source_candidate_id, confirmed_by)
    values (monitor.entity_id, p_event_type, trim(p_timing_label), candidate.official_url, candidate.id, p_reviewer)
    on conflict (university_id, event_type) do update set
      timing_label = excluded.timing_label, source_url = excluded.source_url,
      source_candidate_id = excluded.source_candidate_id, confirmed_by = excluded.confirmed_by, confirmed_at = now();
  end if;

  if p_status = 'approved' then
    insert into public.source_update_notifications (source_update_candidate_id, user_id)
    select candidate.id, follows.user_id
    from public.source_follows follows
    where follows.entity_type = monitor.entity_type and follows.entity_id = monitor.entity_id
    on conflict (source_update_candidate_id, user_id) do nothing;
  end if;
end;
$$;

-- Atomically reserve a small batch. A sending row is only reclaimed after an
-- hour, protecting against a request ending partway through email delivery.
create or replace function public.claim_source_update_notifications(p_limit integer)
returns table (
  id uuid, user_id uuid, summary text, official_url text,
  entity_type text, entity_id text, entity_label text
)
language plpgsql security definer set search_path = public
as $$
begin
  if p_limit < 1 or p_limit > 25 then raise exception 'Invalid notification batch size'; end if;
  return query
  with candidates as (
    select notification.id
    from public.source_update_notifications notification
    where notification.status = 'pending'
       or (notification.status = 'sending' and notification.last_attempt_at < now() - interval '1 hour')
    order by notification.created_at asc
    limit p_limit
    for update skip locked
  ), claimed as (
    update public.source_update_notifications notification
    set status = 'sending', attempt_count = notification.attempt_count + 1, last_attempt_at = now(), last_error = null
    from candidates
    where notification.id = candidates.id
    returning notification.id, notification.user_id, notification.source_update_candidate_id
  )
  select claimed.id, claimed.user_id, update_candidate.summary, update_candidate.official_url,
         monitor.entity_type, monitor.entity_id, monitor.label
  from claimed
  join public.source_update_candidates update_candidate on update_candidate.id = claimed.source_update_candidate_id
  join public.source_monitors monitor on monitor.id = update_candidate.source_monitor_id;
end;
$$;

create or replace function public.complete_source_update_notification(
  p_notification_id uuid,
  p_sent boolean,
  p_error text default null,
  p_retry boolean default false
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_error is not null and char_length(p_error) > 500 then raise exception 'Notification error is too long'; end if;
  update public.source_update_notifications
  set status = case when p_sent then 'sent' when p_retry then 'pending' else 'failed' end,
      sent_at = case when p_sent then now() else sent_at end,
      last_error = case when p_sent then null else p_error end
  where id = p_notification_id and status = 'sending';
end;
$$;

revoke all on function public.review_source_update(uuid, text, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_source_update(uuid, text, text, uuid, text, text) to service_role;
revoke all on function public.claim_source_update_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_source_update_notifications(integer) to service_role;
revoke all on function public.complete_source_update_notification(uuid, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.complete_source_update_notification(uuid, boolean, text, boolean) to service_role;

