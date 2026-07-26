-- ============================================================
-- Family Tree App - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: persons
-- ============================================================
create table if not exists public.persons (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  nickname      text,
  gender        text check (gender in ('male', 'female')) not null,
  birth_date    date,
  death_date    date,
  is_alive      boolean default true,
  photo_url     text,
  bio           text,
  birthplace    text,
  generation    int not null default 1,
  parent_id     uuid references public.persons(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- TABLE: marriages
-- Supports polygamy (one person can have multiple marriages)
-- ============================================================
create table if not exists public.marriages (
  id              uuid primary key default uuid_generate_v4(),
  husband_id      uuid references public.persons(id) on delete cascade,
  wife_id         uuid references public.persons(id) on delete cascade,
  marriage_date   date,
  divorce_date    date,
  is_active       boolean default true,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_persons_parent_id on public.persons(parent_id);
create index if not exists idx_persons_generation on public.persons(generation);
create index if not exists idx_marriages_husband on public.marriages(husband_id);
create index if not exists idx_marriages_wife on public.marriages(wife_id);

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger persons_updated_at
  before update on public.persons
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.persons enable row level security;
alter table public.marriages enable row level security;

-- Public: anyone can read persons and marriages
create policy "Public can read persons"
  on public.persons for select
  using (true);

create policy "Public can read marriages"
  on public.marriages for select
  using (true);

-- Admin only: insert/update/delete (must be authenticated)
create policy "Admin can insert persons"
  on public.persons for insert
  to authenticated
  with check (true);

create policy "Admin can update persons"
  on public.persons for update
  to authenticated
  using (true);

create policy "Admin can delete persons"
  on public.persons for delete
  to authenticated
  using (true);

create policy "Admin can insert marriages"
  on public.marriages for insert
  to authenticated
  with check (true);

create policy "Admin can update marriages"
  on public.marriages for update
  to authenticated
  using (true);

create policy "Admin can delete marriages"
  on public.marriages for delete
  to authenticated
  using (true);

-- ============================================================
-- STORAGE BUCKET for photos
-- Run this separately if using Supabase Storage
-- ============================================================
-- insert into storage.buckets (id, name, public) 
--   values ('family-photos', 'family-photos', true);

-- create policy "Public can view photos"
--   on storage.objects for select
--   using (bucket_id = 'family-photos');

-- create policy "Admin can upload photos"
--   on storage.objects for insert
--   to authenticated
--   with check (bucket_id = 'family-photos');

-- create policy "Admin can delete photos"
--   on storage.objects for delete
--   to authenticated
--   using (bucket_id = 'family-photos');

-- ============================================================
-- SAMPLE SEED DATA (optional - for testing)
-- ============================================================
-- insert into public.persons (name, gender, birth_date, is_alive, generation, bio) values
--   ('Ahmad Soeharto', 'male', '1920-01-01', false, 1, 'Kakek buyut'),
--   ('Siti Aminah', 'female', '1925-03-15', false, 1, 'Nenek buyut');
