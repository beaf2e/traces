-- traces — 초기 스키마
-- Supabase Dashboard → SQL Editor에 통째로 붙여넣고 실행하세요.

create extension if not exists pgcrypto;

-- ---------- logs ----------
create table if not exists public.logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        timestamptz not null default now(),
  title       text not null check (length(title) between 1 and 120),
  body        text not null default '',
  place       text,
  lng         double precision not null,
  lat         double precision not null,
  photo_path  text,
  created_at  timestamptz not null default now()
);

create index if not exists logs_user_date_idx
  on public.logs (user_id, date desc);

alter table public.logs enable row level security;

drop policy if exists "logs: select own" on public.logs;
drop policy if exists "logs: insert own" on public.logs;
drop policy if exists "logs: update own" on public.logs;
drop policy if exists "logs: delete own" on public.logs;

create policy "logs: select own" on public.logs
  for select using (auth.uid() = user_id);
create policy "logs: insert own" on public.logs
  for insert with check (auth.uid() = user_id);
create policy "logs: update own" on public.logs
  for update using (auth.uid() = user_id);
create policy "logs: delete own" on public.logs
  for delete using (auth.uid() = user_id);

-- ---------- storage: photos bucket ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos: read all"        on storage.objects;
drop policy if exists "photos: insert own"      on storage.objects;
drop policy if exists "photos: update own"      on storage.objects;
drop policy if exists "photos: delete own"      on storage.objects;

create policy "photos: read all" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos: insert own" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos: update own" on storage.objects
  for update using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos: delete own" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );