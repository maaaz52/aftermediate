-- Official-source monitoring: one row per approved source, immutable page
-- snapshots, and reviewable candidates. Browser roles receive no access.

create table if not exists public.source_monitors (
  id text primary key,
  entity_type text not null check (entity_type in ('university')),
  entity_id text not null,
  label text not null,
  source_url text not null check (source_url ~ '^https://'),
  active boolean not null default true,
  latest_content_hash text,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_monitor_id text not null references public.source_monitors(id) on delete cascade,
  content_hash text not null,
  content_excerpt text not null check (char_length(content_excerpt) between 1 and 12000),
  extracted_signals jsonb not null default '{}'::jsonb,
  http_status integer not null check (http_status between 200 and 599),
  fetched_at timestamptz not null default now(),
  unique (source_monitor_id, content_hash)
);

create index if not exists source_snapshots_monitor_fetched_idx
  on public.source_snapshots (source_monitor_id, fetched_at desc);

create table if not exists public.source_update_candidates (
  id uuid primary key default gen_random_uuid(),
  source_monitor_id text not null references public.source_monitors(id) on delete cascade,
  source_snapshot_id uuid not null unique references public.source_snapshots(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  summary text not null check (char_length(summary) between 1 and 1000),
  detected_values jsonb not null default '{}'::jsonb,
  official_url text not null check (official_url ~ '^https://'),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index if not exists source_update_candidates_pending_idx
  on public.source_update_candidates (status, created_at asc);

alter table public.source_monitors enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.source_update_candidates enable row level security;
revoke all on public.source_monitors, public.source_snapshots, public.source_update_candidates from anon, authenticated;

insert into public.source_monitors (id, entity_type, entity_id, label, source_url)
values
  ('fast-admission-schedule', 'university', 'fast', 'FAST-NUCES admission schedule', 'https://nu.edu.pk/Admissions/Schedule'),
  ('fast-eligibility', 'university', 'fast', 'FAST-NUCES eligibility criteria', 'https://nu.edu.pk/Admissions/EligibilityCriteria'),
  ('fast-fees', 'university', 'fast', 'FAST-NUCES fee structure', 'https://nu.edu.pk/Admissions/FeeStructure')
on conflict (id) do update set
  label = excluded.label,
  source_url = excluded.source_url,
  updated_at = now();
