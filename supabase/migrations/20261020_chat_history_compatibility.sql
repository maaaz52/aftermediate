-- Restores compatibility with chat-history tables created before titles were
-- introduced. Safe to run on databases that already have the current schema.
alter table if exists public.chat_sessions
  add column if not exists title text;

alter table if exists public.chat_sessions
  add column if not exists created_at timestamptz default now();

alter table if exists public.chat_sessions
  add column if not exists updated_at timestamptz default now();

update public.chat_sessions
set title = 'New chat'
where title is null or btrim(title) = '';

alter table if exists public.chat_sessions
  alter column title set default 'New chat';

alter table if exists public.chat_sessions
  alter column title set not null;

create index if not exists chat_sessions_user_persona_idx
  on public.chat_sessions (user_id, persona, updated_at desc);
