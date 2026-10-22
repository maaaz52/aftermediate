-- Admin-reviewed, confirmed admission dates. Browser roles have no direct
-- access; the server derives the reviewer from the authenticated session.

create table if not exists public.admission_calendar_events (
  university_id text not null,
  event_type text not null check (event_type in ('announcement', 'application', 'test', 'merit', 'fee', 'intake')),
  timing_label text not null check (char_length(timing_label) between 1 and 120),
  source_url text not null check (source_url ~ '^https://'),
  source_candidate_id uuid unique references public.source_update_candidates(id) on delete set null,
  confirmed_by uuid not null references auth.users(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  primary key (university_id, event_type)
);

alter table public.admission_calendar_events enable row level security;
revoke all on public.admission_calendar_events from anon, authenticated;

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
  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid review status';
  end if;
  if char_length(coalesce(p_review_note, '')) > 1000 then
    raise exception 'Review note is too long';
  end if;
  if (p_event_type is null) <> (p_timing_label is null) then
    raise exception 'A confirmed event and timing must be supplied together';
  end if;
  if p_event_type is not null and p_event_type not in ('announcement', 'application', 'test', 'merit', 'fee', 'intake') then
    raise exception 'Invalid admission calendar event';
  end if;
  if p_timing_label is not null and char_length(trim(p_timing_label)) not between 1 and 120 then
    raise exception 'Invalid confirmed timing';
  end if;

  select * into candidate
  from public.source_update_candidates
  where id = p_candidate_id
  for update;
  if not found then
    raise exception 'Source update candidate was not found';
  end if;
  if candidate.status <> 'pending' then
    raise exception 'Source update candidate has already been reviewed';
  end if;

  select * into monitor from public.source_monitors where id = candidate.source_monitor_id;
  if not found then
    raise exception 'Source monitor was not found';
  end if;
  if p_event_type is not null and (p_status <> 'approved' or monitor.entity_type <> 'university') then
    raise exception 'Only approved university updates can confirm calendar dates';
  end if;

  update public.source_update_candidates
  set status = p_status, reviewed_at = now(), review_note = nullif(trim(p_review_note), '')
  where id = p_candidate_id;

  if p_event_type is not null then
    insert into public.admission_calendar_events (
      university_id, event_type, timing_label, source_url, source_candidate_id, confirmed_by
    ) values (
      monitor.entity_id, p_event_type, trim(p_timing_label), candidate.official_url, candidate.id, p_reviewer
    )
    on conflict (university_id, event_type) do update set
      timing_label = excluded.timing_label,
      source_url = excluded.source_url,
      source_candidate_id = excluded.source_candidate_id,
      confirmed_by = excluded.confirmed_by,
      confirmed_at = now();
  end if;
end;
$$;

revoke all on function public.review_source_update(uuid, text, text, uuid, text, text) from public;
grant execute on function public.review_source_update(uuid, text, text, uuid, text, text) to service_role;
