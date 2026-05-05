-- ============================================
-- TEAM MANAGER — Schema Supabase v2
-- Incolla tutto in SQL Editor e clicca Run
-- ============================================

-- 1. Profili utente
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  theme text default 'dark',
  created_at timestamptz default now()
);

-- 2. Task
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text not null default 'altro',
  section text not null check (section in ('videomaker','copywriter','tecnico','social')),
  channel text check (channel in ('ig','youtube','tiktok')),
  priority text check (priority in ('alta','media','bassa')),
  due_date date,
  done boolean default false,
  drive_link text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 3. Piano editoriale
create table public.editorial_plan (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  channel text check (channel in ('ig','youtube','tiktok')),
  format text default 'reel',
  publish_date date,
  stato text default 'pianificazione' check (stato in ('pianificazione','brief','produzione','pronto','pubblicato')),
  brief text,
  caption text,
  hashtags text,
  cta text,
  notes text,
  drive_link text,
  published_link text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Disabilita RLS su tutte le tabelle (tutti gli utenti loggati possono fare tutto)
alter table public.profiles disable row level security;
alter table public.tasks disable row level security;
alter table public.editorial_plan disable row level security;

-- 5. Trigger: crea profilo automaticamente al signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FATTO — vai su Authentication > Users
-- e crea i tuoi utenti
-- ============================================
