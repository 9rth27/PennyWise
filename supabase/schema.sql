-- PennyWise Supabase schema (run in Supabase SQL Editor)

create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  name text,
  date date not null,
  time text not null,
  description text,
  payment_method text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date desc);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget integer not null default 10000 check (monthly_budget > 0),
  currency text not null default 'INR',
  theme text not null default 'dark',
  notifications boolean not null default true,
  email_alerts boolean not null default false,
  default_category text not null default 'misc',
  decimal_places smallint not null default 2 check (decimal_places between 0 and 2),
  date_format text not null default 'DD/MM/YYYY',
  quick_add_amounts jsonb not null default '{"tea":50,"lunch":200,"auto":150,"groceries":500,"misc":100}'::jsonb,
  custom_categories jsonb not null default '[{"id":"tea","label":"Tea/Coffee","color":"amber"},{"id":"lunch","label":"Lunch/Dinner","color":"orange"},{"id":"auto","label":"Auto/Cab","color":"blue"},{"id":"groceries","label":"Groceries","color":"green"},{"id":"misc","label":"Misc","color":"purple"}]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_settings
  add column if not exists currency text not null default 'INR',
  add column if not exists theme text not null default 'dark',
  add column if not exists notifications boolean not null default true,
  add column if not exists email_alerts boolean not null default false,
  add column if not exists default_category text not null default 'misc',
  add column if not exists decimal_places smallint not null default 2,
  add column if not exists date_format text not null default 'DD/MM/YYYY',
  add column if not exists quick_add_amounts jsonb not null default '{"tea":50,"lunch":200,"auto":150,"groceries":500,"misc":100}'::jsonb,
  add column if not exists custom_categories jsonb not null default '[{"id":"tea","label":"Tea/Coffee","color":"amber"},{"id":"lunch","label":"Lunch/Dinner","color":"orange"},{"id":"auto","label":"Auto/Cab","color":"blue"},{"id":"groceries","label":"Groceries","color":"green"},{"id":"misc","label":"Misc","color":"purple"}]'::jsonb;

alter table public.expenses
  add column if not exists name text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.set_updated_at();

alter table public.expenses enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
  on public.expenses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
  on public.expenses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_settings_upsert_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
