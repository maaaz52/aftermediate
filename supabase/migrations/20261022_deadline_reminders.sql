-- Exact, reviewed deadlines and one-time follower reminders. Estimated windows
-- never enter this table, so the system cannot email a made-up date.

create table if not exists public.official_deadline_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('university', 'scholarship')),
  entity_id text not null check (char_length(entity_id) between 1 and 120),
  label text not null check (char_length(label) between 1 and 120),
  due_date date not null,
  official_url text not null check (official_url ~ '^https://'),
  source_update_candidate_id uuid not null unique references public.source_update_candidates(id) on delete cascade,
  confirmed_by uuid not null references auth.users(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  unique (entity_type, entity_id, label, due_date)
);

create index if not exists official_deadline_events_due_idx
  on public.official_deadline_events (due_date, entity_type, entity_id);

create table if not exists public.deadline_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  deadline_event_id uuid not null references public.official_deadline_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 20),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (deadline_event_id, user_id)
);

create index if not exists deadline_reminder_deliveries_status_idx
  on public.deadline_reminder_deliveries (status, created_at);

alter table public.official_deadline_events enable row level security;
alter table public.deadline_reminder_deliveries enable row level security;
revoke all on public.official_deadline_events, public.deadline_reminder_deliveries from anon, authenticated;

-- Eight parameters is intentionally an overload: it leaves the previous
-- six-parameter review RPC usable during the code/migration deployment gap.
create or replace function public.review_source_update(
  p_candidate_id uuid,
  p_status text,
  p_review_note text,
  p_reviewer uuid,
  p_event_type text,
  p_timing_label text,
  p_deadline_label text,
  p_deadline_date date
) returns void
language plpgsql security definer set search_path = public
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
  if (p_deadline_label is null) <> (p_deadline_date is null) then raise exception 'A reminder label and exact date must be supplied together'; end if;
  if p_deadline_label is not null and char_length(trim(p_deadline_label)) not between 1 and 120 then raise exception 'Invalid reminder label'; end if;
  if p_deadline_date is not null and p_deadline_date < current_date then raise exception 'A reminder date cannot be in the past'; end if;

  select * into candidate from public.source_update_candidates where id = p_candidate_id for update;
  if not found then raise exception 'Source update candidate was not found'; end if;
  if candidate.status <> 'pending' then raise exception 'Source update candidate has already been reviewed'; end if;
  select * into monitor from public.source_monitors where id = candidate.source_monitor_id;
  if not found then raise exception 'Source monitor was not found'; end if;
  if p_event_type is not null and (p_status <> 'approved' or monitor.entity_type <> 'university') then raise exception 'Only approved university updates can confirm calendar dates'; end if;
  if p_deadline_label is not null and p_status <> 'approved' then raise exception 'Only approved updates can create deadline reminders'; end if;

  update public.source_update_candidates set status = p_status, reviewed_at = now(), review_note = nullif(trim(p_review_note), '') where id = p_candidate_id;

  if p_event_type is not null then
    insert into public.admission_calendar_events (university_id, event_type, timing_label, source_url, source_candidate_id, confirmed_by)
    values (monitor.entity_id, p_event_type, trim(p_timing_label), candidate.official_url, candidate.id, p_reviewer)
    on conflict (university_id, event_type) do update set timing_label = excluded.timing_label, source_url = excluded.source_url, source_candidate_id = excluded.source_candidate_id, confirmed_by = excluded.confirmed_by, confirmed_at = now();
  end if;

  if p_deadline_label is not null then
    insert into public.official_deadline_events (entity_type, entity_id, label, due_date, official_url, source_update_candidate_id, confirmed_by)
    values (monitor.entity_type, monitor.entity_id, trim(p_deadline_label), p_deadline_date, candidate.official_url, candidate.id, p_reviewer)
    on conflict (entity_type, entity_id, label, due_date) do update set
      official_url = excluded.official_url, source_update_candidate_id = excluded.source_update_candidate_id,
      confirmed_by = excluded.confirmed_by, confirmed_at = now();
  end if;

  if p_status = 'approved' then
    insert into public.source_update_notifications (source_update_candidate_id, user_id)
    select candidate.id, follows.user_id from public.source_follows follows
    where follows.entity_type = monitor.entity_type and follows.entity_id = monitor.entity_id
    on conflict (source_update_candidate_id, user_id) do nothing;
  end if;
end;
$$;

create or replace function public.claim_deadline_reminder_deliveries(p_limit integer, p_days_ahead integer)
returns table (
  delivery_id uuid, user_id uuid, entity_type text, entity_id text, entity_label text,
  reminder_label text, due_date date, official_url text
)
language plpgsql security definer set search_path = public
as $$
begin
  if p_limit < 1 or p_limit > 25 or p_days_ahead < 1 or p_days_ahead > 31 then raise exception 'Invalid reminder batch'; end if;
  return query
  with eligible as (
    select event.id as deadline_event_id, follows.user_id
    from public.official_deadline_events event
    join public.source_follows follows on follows.entity_type = event.entity_type and follows.entity_id = event.entity_id
    left join public.deadline_reminder_deliveries delivery on delivery.deadline_event_id = event.id and delivery.user_id = follows.user_id
    where event.due_date between current_date and current_date + p_days_ahead
      and (delivery.id is null or ((delivery.status = 'pending' or (delivery.status = 'sending' and delivery.last_attempt_at < now() - interval '1 hour')) and delivery.attempt_count < 20))
    order by event.due_date asc
    limit p_limit
  ), claimed as (
    insert into public.deadline_reminder_deliveries as delivery (deadline_event_id, user_id, status, attempt_count, last_attempt_at, last_error)
    select eligible.deadline_event_id, eligible.user_id, 'sending', 1, now(), null from eligible
    on conflict (deadline_event_id, user_id) do update set
      status = 'sending', attempt_count = delivery.attempt_count + 1, last_attempt_at = now(), last_error = null
    where (delivery.status = 'pending' or (delivery.status = 'sending' and delivery.last_attempt_at < now() - interval '1 hour')) and delivery.attempt_count < 20
    returning delivery.id, delivery.deadline_event_id, delivery.user_id
  )
  select claimed.id, claimed.user_id, event.entity_type, event.entity_id, monitor.label,
         event.label, event.due_date, event.official_url
  from claimed
  join public.official_deadline_events event on event.id = claimed.deadline_event_id
  join public.source_update_candidates candidate on candidate.id = event.source_update_candidate_id
  join public.source_monitors monitor on monitor.id = candidate.source_monitor_id;
end;
$$;

create or replace function public.complete_deadline_reminder_delivery(
  p_delivery_id uuid, p_sent boolean, p_error text default null, p_retry boolean default false
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_error is not null and char_length(p_error) > 500 then raise exception 'Reminder error is too long'; end if;
  update public.deadline_reminder_deliveries
  set status = case when p_sent then 'sent' when p_retry then 'pending' else 'failed' end,
      sent_at = case when p_sent then now() else sent_at end,
      last_error = case when p_sent then null else p_error end
  where id = p_delivery_id and status = 'sending';
end;
$$;

revoke all on function public.review_source_update(uuid, text, text, uuid, text, text, text, date) from public, anon, authenticated;
grant execute on function public.review_source_update(uuid, text, text, uuid, text, text, text, date) to service_role;
revoke all on function public.claim_deadline_reminder_deliveries(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_deadline_reminder_deliveries(integer, integer) to service_role;
revoke all on function public.complete_deadline_reminder_delivery(uuid, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.complete_deadline_reminder_delivery(uuid, boolean, text, boolean) to service_role;

