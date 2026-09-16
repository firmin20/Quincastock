-- ==========================================================
-- ADN STUDIO NUMÉRIQUE — MIGRATION ESPACE ADMINISTRATEUR QUINCASTOCK
-- À exécuter dans votre Supabase SQL Editor
-- (Dashboard Supabase -> SQL Editor -> Nouveau Script -> Run)
-- ==========================================================

-- 1. ÉVOLUTION DE LA TABLE PROFILES
-- Ajout des colonnes pour le rôle, l'activation PRO et le suivi de dernière activité
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists pro_activated_at timestamptz;
alter table public.profiles add column if not exists pro_code_used text;
alter table public.profiles add column if not exists last_activity_at timestamptz default now();

-- Index pour recherche rapide par rôle
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

-- RLS sur pro_activations
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

-- 4. POLITIQUES RLS SUR PROFILES (Isolation stricte des utilisateurs normaux, accès global pour l'admin)
drop policy if exists "Les utilisateurs peuvent voir leur profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur profil" 
  on public.profiles for select 
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Les administrateurs peuvent modifier les profils" on public.profiles;
create policy "Les administrateurs peuvent modifier les profils"
  on public.profiles for update
  using (auth.uid() = user_id or public.is_admin());

-- 5. POLITIQUES RLS SUR PRODUCTS (Isolation stricte, consultation pour admin)
drop policy if exists "Les utilisateurs voient uniquement leurs produits" on public.products;
create policy "Les utilisateurs voient uniquement leurs produits" 
  on public.products for select 
  using (auth.uid() = user_id or public.is_admin());

-- 6. POLITIQUES RLS SUR MOVEMENTS (Isolation stricte, consultation pour admin)
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

-- 8. FONCTION ATOMIQUE D'ACTIVATION PRO ENRICHIE
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

  -- 1. Vérifier si l'utilisateur est déjà PRO
  select * into v_user_profile from public.profiles where user_id = v_user_id;
  if v_user_profile.is_pro is true then
    return jsonb_build_object('success', false, 'status', 'ALREADY_PRO', 'message', '⭐ Votre compte QuincaStock PRO est déjà activé.');
  end if;

  -- 2. Nettoyer le code
  v_clean_code := upper(trim(p_code));

  -- 3. Vérifier l'existence du code
  select * into v_code_record from public.pro_codes where code = v_clean_code;
  if v_code_record.id is null then
    return jsonb_build_object('success', false, 'status', 'INVALID_CODE', 'message', '❌ Code PRO invalide.');
  end if;

  -- 4. Vérifier si le code est déjà utilisé
  if v_code_record.is_used is true then
    return jsonb_build_object('success', false, 'status', 'ALREADY_USED', 'message', '❌ Ce code PRO a déjà été utilisé.');
  end if;

  -- 5. Marquer le code comme utilisé (mise à jour atomique)
  update public.pro_codes
  set is_used = true,
      used_by = v_user_id,
      used_at = now()
  where id = v_code_record.id and is_used = false;

  -- 6. Activer le statut PRO sur le profil avec date et code
  update public.profiles
  set is_pro = true,
      pro_activated_at = now(),
      pro_code_used = v_clean_code,
      last_activity_at = now()
  where user_id = v_user_id;

  -- 7. Enregistrer dans l'historique pro_activations
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

-- 9. FONCTION SÉCURISÉE RPC D'ADMINISTRATION : VUE GLOBALE
create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid;
  v_is_authorized boolean := false;
  v_total_users integer := 0;
  v_pro_users integer := 0;
  v_free_users integer := 0;
  v_total_products integer := 0;
  v_active_quincailleries integer := 0;
  v_total_activations integer := 0;
  v_estimated_revenue numeric := 0;
  v_new_this_week integer := 0;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Accès non authentifié.';
  end if;

  -- Vérifier si l'utilisateur est admin
  select (role = 'admin' or email = 'firmintela7@gmail.com') into v_is_authorized
  from public.profiles where user_id = v_caller;

  if not coalesce(v_is_authorized, false) then
    raise exception 'Accès refusé. Cette zone est réservée à l''administrateur ADN Studio Numérique.';
  end if;

  select count(*) into v_total_users from public.profiles;
  select count(*) into v_pro_users from public.profiles where is_pro = true;
  v_free_users := greatest(v_total_users - v_pro_users, 0);

  select count(*) into v_total_products from public.products;

  select count(distinct user_id) into v_active_quincailleries from (
    select user_id from public.products
    union
    select user_id from public.movements
  ) sub;

  select count(*) into v_total_activations from public.pro_codes where is_used = true;
  v_estimated_revenue := v_pro_users * 15000;

  select count(*) into v_new_this_week from public.profiles
  where created_at >= (now() - interval '7 days');

  return jsonb_build_object(
    'total_users', v_total_users,
    'free_users', v_free_users,
    'pro_users', v_pro_users,
    'conversion_rate', case when v_total_users > 0 then round((v_pro_users::numeric / v_total_users::numeric) * 100, 1) else 0 end,
    'total_products', v_total_products,
    'active_quincailleries', v_active_quincailleries,
    'total_activations', v_total_activations,
    'estimated_revenue', v_estimated_revenue,
    'new_users_this_week', v_new_this_week
  );
end;
$$;

grant execute on function public.get_admin_overview to authenticated;

-- 10. DÉFINIR AUTOMATIQUEMENT VOTRE COMPTE COMME ADMINISTRATEUR
-- Remplacez si besoin avec votre email ou votre UUID
update public.profiles
set role = 'admin'
where email = 'firmintela7@gmail.com';
