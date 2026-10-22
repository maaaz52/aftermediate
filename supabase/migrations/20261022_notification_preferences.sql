-- Global, student-owned choices for the alert types that are already live.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  official_source_updates boolean not null default true,
  deadline_reminders boolean not null default true,
  merit_and_selection_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can view their own notification preferences" on public.notification_preferences;
create policy "Users can view their own notification preferences" on public.notification_preferences for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their own notification preferences" on public.notification_preferences;
create policy "Users can create their own notification preferences" on public.notification_preferences for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own notification preferences" on public.notification_preferences;
create policy "Users can update their own notification preferences" on public.notification_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Preserve the source-alert RPC signature while respecting each user's choice.
create or replace function public.claim_source_update_notifications(p_limit integer)
returns table (id uuid, user_id uuid, summary text, official_url text, entity_type text, entity_id text, entity_label text, alert_kind text)
language plpgsql security definer set search_path = public
as $$
begin
  if p_limit < 1 or p_limit > 25 then raise exception 'Invalid notification batch size'; end if;
  return query
  with candidates as (
    select notification.id
    from public.source_update_notifications notification
    join public.source_update_candidates update_candidate on update_candidate.id = notification.source_update_candidate_id
    left join public.notification_preferences preference on preference.user_id = notification.user_id
    where (notification.status = 'pending' or (notification.status = 'sending' and notification.last_attempt_at < now() - interval '1 hour'))
      and case
        when update_candidate.alert_kind in ('merit-list', 'selection-update') then coalesce(preference.merit_and_selection_updates, true)
        else coalesce(preference.official_source_updates, true)
      end
    order by notification.created_at asc
    limit p_limit
    for update of notification skip locked
  ), claimed as (
    update public.source_update_notifications notification
    set status = 'sending', attempt_count = notification.attempt_count + 1, last_attempt_at = now(), last_error = null
    from candidates where notification.id = candidates.id
    returning notification.id, notification.user_id, notification.source_update_candidate_id
  )
  select claimed.id, claimed.user_id, update_candidate.summary, update_candidate.official_url,
         monitor.entity_type, monitor.entity_id, monitor.label, update_candidate.alert_kind
  from claimed
  join public.source_update_candidates update_candidate on update_candidate.id = claimed.source_update_candidate_id
  join public.source_monitors monitor on monitor.id = update_candidate.source_monitor_id;
end;
$$;

-- Preserve the deadline RPC signature while excluding users who opted out.
create or replace function public.claim_deadline_reminder_deliveries(p_limit integer, p_days_ahead integer)
returns table (delivery_id uuid, user_id uuid, entity_type text, entity_id text, entity_label text, reminder_label text, due_date date, official_url text)
language plpgsql security definer set search_path = public
as $$
begin
  if p_limit < 1 or p_limit > 25 or p_days_ahead < 1 or p_days_ahead > 31 then raise exception 'Invalid reminder batch'; end if;
  return query
  with eligible as (
    select event.id as deadline_event_id, follows.user_id
    from public.official_deadline_events event
    join public.source_follows follows on follows.entity_type = event.entity_type and follows.entity_id = event.entity_id
    left join public.notification_preferences preference on preference.user_id = follows.user_id
    left join public.deadline_reminder_deliveries delivery on delivery.deadline_event_id = event.id and delivery.user_id = follows.user_id
    where event.due_date between current_date and current_date + p_days_ahead
      and coalesce(preference.deadline_reminders, true)
      and (delivery.id is null or ((delivery.status = 'pending' or (delivery.status = 'sending' and delivery.last_attempt_at < now() - interval '1 hour')) and delivery.attempt_count < 20))
    order by event.due_date asc
    limit p_limit
  ), claimed as (
    insert into public.deadline_reminder_deliveries as delivery (deadline_event_id, user_id, status, attempt_count, last_attempt_at, last_error)
    select eligible.deadline_event_id, eligible.user_id, 'sending', 1, now(), null from eligible
    on conflict (deadline_event_id, user_id) do update set status = 'sending', attempt_count = delivery.attempt_count + 1, last_attempt_at = now(), last_error = null
    where (delivery.status = 'pending' or (delivery.status = 'sending' and delivery.last_attempt_at < now() - interval '1 hour')) and delivery.attempt_count < 20
    returning delivery.id, delivery.deadline_event_id, delivery.user_id
  )
  select claimed.id, claimed.user_id, event.entity_type, event.entity_id, monitor.label, event.label, event.due_date, event.official_url
  from claimed
  join public.official_deadline_events event on event.id = claimed.deadline_event_id
  join public.source_update_candidates candidate on candidate.id = event.source_update_candidate_id
  join public.source_monitors monitor on monitor.id = candidate.source_monitor_id;
end;
$$;

revoke all on function public.claim_source_update_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_source_update_notifications(integer) to service_role;
revoke all on function public.claim_deadline_reminder_deliveries(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_deadline_reminder_deliveries(integer, integer) to service_role;

