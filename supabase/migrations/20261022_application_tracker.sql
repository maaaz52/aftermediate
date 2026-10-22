-- Private, student-controlled progress for followed universities and scholarships.

create table if not exists public.application_tracker_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('university', 'scholarship')),
  entity_id text not null check (char_length(entity_id) between 1 and 120),
  status text not null check (status in ('considering', 'preparing', 'applied', 'decision-received')),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists application_tracker_entries_user_updated_idx
  on public.application_tracker_entries (user_id, updated_at desc);

alter table public.application_tracker_entries enable row level security;

drop policy if exists "Users can view their own application tracker entries" on public.application_tracker_entries;
create policy "Users can view their own application tracker entries"
  on public.application_tracker_entries for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their own application tracker entries" on public.application_tracker_entries;
create policy "Users can create their own application tracker entries"
  on public.application_tracker_entries for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own application tracker entries" on public.application_tracker_entries;
create policy "Users can update their own application tracker entries"
  on public.application_tracker_entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own application tracker entries" on public.application_tracker_entries;
create policy "Users can delete their own application tracker entries"
  on public.application_tracker_entries for delete to authenticated using (auth.uid() = user_id);

