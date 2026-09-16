// Export complete Supabase SQL Schema for easy copy-paste & validation in UI

export const SUPABASE_SQL_SCRIPT = `-- ==========================================================
-- QUINCASTOCK - SCHÉMA DE BASE DE DONNÉES SUPABASE (VERSION 2)
-- Gestion Quincaillerie Pro avec Sauvegarde Cloud et RLS
-- ==========================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLE PROFILES
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  business_name text not null default 'Ma Quincaillerie',
  owner_name text not null default 'Responsable',
  phone text default '',
  email text default '',
  is_pro boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- 3. TABLE PRODUCTS
create table if not exists public.products (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  unit_price numeric not null default 0,
  quantity integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_name on public.products(name);

-- 4. TABLE MOVEMENTS
create table if not exists public.movements (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text,
  product_name text not null,
  type text not null check (type in ('ACHAT', 'VENTE')),
  quantity integer not null,
  stock_after integer not null,
  unit_price numeric default 0,
  created_at timestamptz default now()
);

create index if not exists idx_movements_user_id on public.movements(user_id);
create index if not exists idx_movements_created_at on public.movements(created_at desc);

-- 5. TABLE PRO_CODES
create table if not exists public.pro_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  is_used boolean default false,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_pro_codes_code on public.pro_codes(code);

-- Insérer exactement les 15 codes fixes officiels (sans doublons)
insert into public.pro_codes (code, is_used)
values
  ('QUINCA-AF01', false),
  ('QUINCA-AF02', false),
  ('QUINCA-AF03', false),
  ('QUINCA-AF04', false),
  ('QUINCA-AF05', false),
  ('QUINCA-AF06', false),
  ('QUINCA-AF07', false),
  ('QUINCA-AF08', false),
  ('QUINCA-AF09', false),
  ('QUINCA-AF10', false),
  ('QUINCA-PRO01', false),
  ('QUINCA-PRO02', false),
  ('QUINCA-PRO03', false),
  ('QUINCA-VIP01', false),
  ('QUINCA-2026', false)
on conflict (code) do nothing;

-- 6. PERMISSIONS DE BASE
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant select on public.pro_codes to anon, authenticated;

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.movements enable row level security;
alter table public.pro_codes enable row level security;

-- Politiques RLS : PROFILES
drop policy if exists "Les utilisateurs peuvent voir leur profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur profil" 
  on public.profiles for select 
  using (auth.uid() = user_id);

drop policy if exists "Les utilisateurs peuvent insérer leur profil" on public.profiles;
create policy "Les utilisateurs peuvent insérer leur profil" 
  on public.profiles for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Les utilisateurs peuvent modifier leur profil" on public.profiles;
create policy "Les utilisateurs peuvent modifier leur profil" 
  on public.profiles for update 
  using (auth.uid() = user_id);

-- Politiques RLS : PRODUCTS
drop policy if exists "Les utilisateurs voient uniquement leurs produits" on public.products;
create policy "Les utilisateurs voient uniquement leurs produits" 
  on public.products for select 
  using (auth.uid() = user_id);

drop policy if exists "Les utilisateurs créent uniquement leurs produits" on public.products;
create policy "Les utilisateurs créent uniquement leurs produits" 
  on public.products for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Les utilisateurs modifient uniquement leurs produits" on public.products;
create policy "Les utilisateurs modifient uniquement leurs produits" 
  on public.products for update 
  using (auth.uid() = user_id);

drop policy if exists "Les utilisateurs suppriment uniquement leurs produits" on public.products;
create policy "Les utilisateurs suppriment uniquement leurs produits" 
  on public.products for delete 
  using (auth.uid() = user_id);

-- Politiques RLS : MOVEMENTS
drop policy if exists "Les utilisateurs voient uniquement leurs mouvements" on public.movements;
create policy "Les utilisateurs voient uniquement leurs mouvements" 
  on public.movements for select 
  using (auth.uid() = user_id);

drop policy if exists "Les utilisateurs créent uniquement leurs mouvements" on public.movements;
create policy "Les utilisateurs créent uniquement leurs mouvements" 
  on public.movements for insert 
  with check (auth.uid() = user_id);

-- Politiques RLS : PRO_CODES
drop policy if exists "Lecture des codes pro" on public.pro_codes;
create policy "Lecture des codes pro" 
  on public.pro_codes for select 
  using (true);

drop policy if exists "Mise à jour des codes pro par authentifié" on public.pro_codes;
create policy "Mise à jour des codes pro par authentifié" 
  on public.pro_codes for update 
  using (auth.role() = 'authenticated');

-- 8. FONCTION ATOMIQUE D'ACTIVATION DE CODE PRO
create or replace function public.activate_pro_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_clean_code text;
  v_is_already_pro boolean;
  v_code_record record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'status', 'UNAUTHENTICATED', 'message', 'Vous devez être connecté.');
  end if;

  select is_pro into v_is_already_pro from public.profiles where user_id = v_user_id;
  if v_is_already_pro is true then
    return jsonb_build_object('success', false, 'status', 'ALREADY_PRO', 'message', '⭐ Votre compte QuincaStock PRO est déjà activé.');
  end if;

  v_clean_code := upper(trim(p_code));

  select * into v_code_record from public.pro_codes where code = v_clean_code;
  if v_code_record.id is null then
    return jsonb_build_object('success', false, 'status', 'INVALID_CODE', 'message', '❌ Code PRO invalide.');
  end if;

  if v_code_record.is_used is true then
    return jsonb_build_object('success', false, 'status', 'ALREADY_USED', 'message', '❌ Ce code PRO a déjà été utilisé.');
  end if;

  update public.pro_codes
  set is_used = true,
      used_by = v_user_id,
      used_at = now()
  where id = v_code_record.id and is_used = false;

  update public.profiles
  set is_pro = true
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'status', 'SUCCESS', 'message', '🎉 Félicitations ! Votre compte QuincaStock PRO est maintenant activé.');
end;
$$;

grant execute on function public.activate_pro_code to authenticated;

-- 9. TRIGGER DE CRÉATION AUTOMATIQUE DE PROFIL LORS DE L'INSCRIPTION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, business_name, owner_name, phone, email, is_pro)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'Ma Quincaillerie'),
    coalesce(new.raw_user_meta_data->>'owner_name', 'Responsable'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.email, ''),
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
`;

export function getSupabaseProjectRef(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    return parts[0] || '';
  } catch {
    return '';
  }
}

export const ADMIN_MIGRATION_SQL_SCRIPT = `-- ==========================================================
-- ADN STUDIO NUMÉRIQUE — MIGRATION ESPACE ADMINISTRATEUR QUINCASTOCK
-- À exécuter dans votre Supabase SQL Editor
-- (Dashboard Supabase -> SQL Editor -> New Query -> Run)
-- ==========================================================

-- 1. ÉVOLUTION DE LA TABLE PROFILES
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists pro_activated_at timestamptz;
alter table public.profiles add column if not exists pro_code_used text;
alter table public.profiles add column if not exists last_activity_at timestamptz default now();

create index if not exists idx_profiles_role on public.profiles(role);

-- 2. TABLE D'HISTORIQUE DES ACTIVATIONS PRO
create table if not exists public.pro_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null default '',
  owner_name text not null default '',
  phone text default '',
  email text default '',
  code text not null,
  activated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_pro_activations_user_id on public.pro_activations(user_id);
create index if not exists idx_pro_activations_activated_at on public.pro_activations(activated_at desc);

alter table public.pro_activations enable row level security;

-- 3. FONCTION DE VÉRIFICATION DU STATUT ADMINISTRATEUR
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles 
    where user_id = auth.uid() 
      and (role = 'admin' or email = 'firmintela7@gmail.com')
  );
$$;

grant execute on function public.is_admin to authenticated, anon;

-- 4. POLITIQUES RLS SUR PROFILES (Isolation stricte des utilisateurs normaux, lecture globale pour l'admin)
drop policy if exists "Les utilisateurs peuvent voir leur profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur profil" 
  on public.profiles for select 
  using (auth.uid() = user_id or public.is_admin());

-- 5. POLITIQUES RLS SUR PRODUCTS (Isolation stricte des utilisateurs normaux, consultation globale pour l'admin)
drop policy if exists "Les utilisateurs voient uniquement leurs produits" on public.products;
create policy "Les utilisateurs voient uniquement leurs produits" 
  on public.products for select 
  using (auth.uid() = user_id or public.is_admin());

-- 6. POLITIQUES RLS SUR MOVEMENTS (Isolation stricte des utilisateurs normaux, consultation globale pour l'admin)
drop policy if exists "Les utilisateurs voient uniquement leurs mouvements" on public.movements;
create policy "Les utilisateurs voient uniquement leurs mouvements" 
  on public.movements for select 
  using (auth.uid() = user_id or public.is_admin());

-- 7. POLITIQUES RLS SUR PRO_ACTIVATIONS
drop policy if exists "Lecture des activations par admin" on public.pro_activations;
create policy "Lecture des activations par admin" 
  on public.pro_activations for select 
  using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Insertion des activations par authentifie" on public.pro_activations;
create policy "Insertion des activations par authentifie" 
  on public.pro_activations for insert 
  with check (auth.uid() = user_id or public.is_admin());

-- 8. FONCTION ATOMIQUE D'ACTIVATION PRO AVEC HISTORIQUE
create or replace function public.activate_pro_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_clean_code text;
  v_is_already_pro boolean;
  v_code_record record;
  v_user_profile record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'status', 'UNAUTHENTICATED', 'message', 'Vous devez être connecté.');
  end if;

  select * into v_user_profile from public.profiles where user_id = v_user_id;
  if v_user_profile.is_pro is true then
    return jsonb_build_object('success', false, 'status', 'ALREADY_PRO', 'message', '⭐ Votre compte QuincaStock PRO est déjà activé.');
  end if;

  v_clean_code := upper(trim(p_code));

  select * into v_code_record from public.pro_codes where code = v_clean_code;
  if v_code_record.id is null then
    return jsonb_build_object('success', false, 'status', 'INVALID_CODE', 'message', '❌ Code PRO invalide.');
  end if;

  if v_code_record.is_used is true then
    return jsonb_build_object('success', false, 'status', 'ALREADY_USED', 'message', '❌ Ce code PRO a déjà été utilisé.');
  end if;

  update public.pro_codes
  set is_used = true,
      used_by = v_user_id,
      used_at = now()
  where id = v_code_record.id and is_used = false;

  update public.profiles
  set is_pro = true,
      pro_activated_at = now(),
      pro_code_used = v_clean_code,
      last_activity_at = now()
  where user_id = v_user_id;

  insert into public.pro_activations (
    user_id, business_name, owner_name, phone, email, code, activated_at
  ) values (
    v_user_id,
    coalesce(v_user_profile.business_name, 'Ma Quincaillerie'),
    coalesce(v_user_profile.owner_name, 'Responsable'),
    coalesce(v_user_profile.phone, ''),
    coalesce(v_user_profile.email, ''),
    v_clean_code,
    now()
  );

  return jsonb_build_object('success', true, 'status', 'SUCCESS', 'message', '🎉 Félicitations ! Votre compte QuincaStock PRO est maintenant activé.');
end;
$$;

grant execute on function public.activate_pro_code to authenticated;

-- 9. DÉFINIR AUTOMATIQUEMENT VOTRE COMPTE COMME ADMINISTRATEUR
update public.profiles
set role = 'admin'
where email = 'firmintela7@gmail.com';
`;
