create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  terms_accepted_at timestamptz,
  terms_version_accepted text
);

create table if not exists public.recommendations (
  id bigint generated always as identity primary key,
  ticker text not null,
  company text not null,
  action text not null check (action in ('BUY', 'SELL', 'HOLD')),
  rationale text not null,
  sector text not null default 'Unspecified',
  locked_change_percent double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  sid text primary key,
  sess jsonb not null,
  expire timestamptz not null
);

create index if not exists sessions_expire_idx on public.sessions (expire);

alter table public.users enable row level security;
alter table public.recommendations enable row level security;
alter table public.sessions enable row level security;

-- For server-side usage with SUPABASE_SERVICE_ROLE_KEY, no additional policies are required.
-- If you only use a publishable key, add policies that allow the exact operations your app needs.
