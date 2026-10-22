-- Completed checklist entries are private to the student and validated by the
-- server against the versioned university/scholarship catalogue.

alter table public.application_tracker_entries
  add column if not exists completed_task_ids jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'application_tracker_completed_task_ids_array') then
    alter table public.application_tracker_entries
      add constraint application_tracker_completed_task_ids_array
      check (jsonb_typeof(completed_task_ids) = 'array' and jsonb_array_length(completed_task_ids) <= 50);
  end if;
end $$;

