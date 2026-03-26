create extension if not exists "pgcrypto";

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  quantity_value numeric(12, 2) not null,
  quantity_unit text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ingredients_name_length check (char_length(name) between 1 and 80),
  constraint ingredients_category_length check (char_length(category) between 1 and 60),
  constraint ingredients_unit_length check (char_length(quantity_unit) between 1 and 30),
  constraint ingredients_quantity_positive check (quantity_value > 0)
);

create index if not exists ingredients_created_at_desc_idx
  on public.ingredients (created_at desc);

create index if not exists ingredients_category_idx
  on public.ingredients (lower(category));

revoke all on table public.ingredients from anon;
revoke all on table public.ingredients from authenticated;
