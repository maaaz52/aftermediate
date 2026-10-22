-- A separate, normalized following list for university and scholarship updates.
-- This intentionally does not reuse profiles.watchlist, which represents a
-- specific programme's merit cutoff rather than a source the student follows.

create table if not exists public.source_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('university', 'scholarship')),
  entity_id text not null check (char_length(entity_id) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists source_follows_entity_idx
  on public.source_follows (entity_type, entity_id);

alter table public.source_follows enable row level security;

drop policy if exists "Users can view their own source follows" on public.source_follows;
create policy "Users can view their own source follows"
  on public.source_follows for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own source follows" on public.source_follows;
create policy "Users can create their own source follows"
  on public.source_follows for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own source follows" on public.source_follows;
create policy "Users can delete their own source follows"
  on public.source_follows for delete to authenticated
  using (auth.uid() = user_id);

