-- Lets an administrator classify an approved source change as a merit-list or
-- selection update. The email always refers to the official list/update, never
-- claims that an individual student received an offer.

alter table public.source_update_candidates
  add column if not exists alert_kind text not null default 'general'
  check (alert_kind in ('general', 'merit-list', 'selection-update'));

create or replace function public.set_source_update_alert_kind(
  p_candidate_id uuid,
  p_alert_kind text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_alert_kind not in ('general', 'merit-list', 'selection-update') then
    raise exception 'Invalid alert kind';
  end if;
  update public.source_update_candidates
  set alert_kind = p_alert_kind
  where id = p_candidate_id and status = 'approved';
  if not found then raise exception 'Approved source update candidate was not found'; end if;
end;
$$;

-- The parameter signature is unchanged, so this safely replaces the alert
-- queue claim RPC while adding the approved classification to the email data.
drop function if exists public.claim_source_update_notifications(integer);
create function public.claim_source_update_notifications(p_limit integer)
returns table (
  id uuid, user_id uuid, summary text, official_url text,
  entity_type text, entity_id text, entity_label text, alert_kind text
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
         monitor.entity_type, monitor.entity_id, monitor.label, update_candidate.alert_kind
  from claimed
  join public.source_update_candidates update_candidate on update_candidate.id = claimed.source_update_candidate_id
  join public.source_monitors monitor on monitor.id = update_candidate.source_monitor_id;
end;
$$;

revoke all on function public.set_source_update_alert_kind(uuid, text) from public, anon, authenticated;
grant execute on function public.set_source_update_alert_kind(uuid, text) to service_role;
revoke all on function public.claim_source_update_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_source_update_notifications(integer) to service_role;

