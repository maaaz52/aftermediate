-- Extend the existing safe source-monitoring pipeline to the scholarship
-- directories. The application still supplies a fixed code allowlist; this
-- migration only permits scholarship monitor rows to be stored.

alter table public.source_monitors
  drop constraint if exists source_monitors_entity_type_check;

alter table public.source_monitors
  add constraint source_monitors_entity_type_check
  check (entity_type in ('university', 'scholarship'));
