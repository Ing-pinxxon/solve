-- DEUDAS//ZERO — Supabase Schema
-- Ejecutar en Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table if not exists public.debts (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  balance       numeric(15, 2) not null check (balance >= 0),
  annual_rate   numeric(8, 4) not null check (annual_rate >= 0),
  installments  integer not null check (installments > 0),
  created_at    bigint not null,
  updated_at    bigint not null,
  deleted_at    bigint,
  sync_status   text default 'synced'
);

create table if not exists public.user_preferences (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  currency             text not null default 'COP',
  monthly_accelerator  numeric(15, 2) not null default 0,
  strategy             text not null default 'avalanche' check (strategy in ('avalanche', 'snowball')),
  updated_at           bigint not null
);

alter table public.debts enable row level security;
alter table public.user_preferences enable row level security;

create policy "Users can view own debts"   on public.debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts" on public.debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts" on public.debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts" on public.debts for delete using (auth.uid() = user_id);

create policy "Users can view own prefs"   on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own prefs" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own prefs" on public.user_preferences for update using (auth.uid() = user_id);

create index if not exists idx_debts_user_id    on public.debts(user_id);
create index if not exists idx_debts_updated_at on public.debts(user_id, updated_at desc);
create index if not exists idx_debts_active      on public.debts(user_id) where deleted_at is null;

create or replace function public.get_debts_since(p_user_id uuid, p_since bigint)
returns setof public.debts language sql security definer as $$
  select * from public.debts
  where user_id = p_user_id and updated_at > p_since
  order by updated_at asc;
$$;
