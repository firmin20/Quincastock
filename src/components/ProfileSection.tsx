import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Sparkles, 
  LogOut, 
  Cloud, 
  ShieldCheck, 
  Database, 
  KeyRound,
  CheckCircle2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';
import { formatDateFR, OWNER_CONTACT } from '../utils/formatters';
import { isSupabaseConfigured } from '../lib/supabase';
import { checkIsAdmin } from '../config/adminConfig';

interface ProfileSectionProps {
  profile: UserProfile;
  productCount: number;
  isPro: boolean;
  onSignOut: () => void;
  onOpenProModal: () => void;
  onNavigateAdmin?: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  productCount,
  isPro,
  onSignOut,
  onOpenProModal,
  onNavigateAdmin,
  onShowToast,
}) => {
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const isLive = isSupabaseConfigured();
  const isAdmin = checkIsAdmin(profile.userId, profile.email, profile.role);

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(profile.userId || profile.id);
    onShowToast('Identifiant copié dans le presse-papier', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {profile.businessName || 'Ma Quincaillerie'}
              </h1>
              {isPro ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  ⭐ PRO
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                  GRATUIT ({productCount}/5)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Responsable : <strong>{profile.ownerName || 'Non spécifié'}</strong>
            </p>
          </div>
        </div>

        {/* Déconnexion Button */}
        <button
          onClick={onSignOut}
          id="profile-signout-btn"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-bold text-xs sm:text-sm border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </button>
      </div>

      {/* Admin Access Card if owner */}
      {isAdmin && onNavigateAdmin && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">Espace Administrateur Privé</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  ADN STUDIO NUMÉRIQUE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez tous les utilisateurs inscrits, le taux de passage en PRO, les coordonnées et chiffres clés.
              </p>
            </div>
          </div>

          <button
            id="profile-access-admin-btn"
            onClick={onNavigateAdmin}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ouvrir l'Espace Admin</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Coordonnées Commerciales */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            Informations du compte
          </h2>

          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase">Quincaillerie</span>
              <span className="font-bold text-gray-900">{profile.businessName}</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase">Responsable</span>
              <span className="font-bold text-gray-900">{profile.ownerName}</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase">Téléphone</span>
              <span className="font-mono font-bold text-gray-900">
                {profile.phone || 'Non renseigné'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase">Adresse E-mail</span>
              <span className="font-mono font-semibold text-gray-800 text-xs sm:text-sm">
                {profile.email}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase">Date de création</span>
              <span className="font-medium text-gray-700 text-xs">
                {formatDateFR(profile.createdAt)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold uppercase">Identifiant Cloud</span>
              <button
                onClick={handleCopyUserId}
                className="font-mono text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                title="Copier ID utilisateur"
              >
                <span>{(profile.userId || profile.id).substring(0, 12)}...</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Statut de la formule & Cloud */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Statut de la licence & Cloud
            </h2>

            {/* Statut Formule */}
            <div className={`p-4 rounded-2xl border mb-4 ${
              isPro 
                ? 'bg-amber-50/70 border-amber-200 text-amber-950' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Formule QuincaStock
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  isPro 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {isPro ? '⭐ PRO ILLIMITÉ' : 'GRATUIT'}
                </span>
              </div>

              <div className="mt-2 text-sm font-bold">
                {isPro ? (
                  <div className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Licence PRO active à vie sur ce compte.</span>
                  </div>
                ) : (
                  <div>
                    <span>{productCount} / 5 articles utilisés.</span>
                    <p className="text-xs text-gray-500 font-normal mt-1">
                      Limite de 5 produits différents. Passez en PRO pour des produits illimités.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud Status Box */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  Sauvegarde Cloud
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white">
                  {isLive ? 'SUPABASE EN LIGNE' : 'CLOUD ACTIF'}
                </span>
              </div>
              <p className="text-xs text-blue-900/80 leading-relaxed font-medium">
                Toutes vos données (produits, quantités, prix, achats, ventes) sont automatiquement synchronisées et isolées sur votre compte. En cas de perte de téléphone, reconnectez-vous simplement.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {!isPro && (
              <button
                onClick={onOpenProModal}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Passer en PRO (15 000 FCFA à vie)</span>
              </button>
            )}

            <button
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs border border-gray-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showSqlGuide ? 'Masquer la configuration Supabase' : 'Voir la configuration Supabase SQL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Supabase SQL instructions */}
      {showSqlGuide && (
        <div className="bg-gray-900 text-gray-100 rounded-3xl p-6 border border-gray-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold text-orange-400 uppercase tracking-wider">
              📦 Configuration Base de données Supabase (supabase/schema.sql)
            </h3>
            <span className="text-xs text-gray-400">
              Tables : profiles, products, movements, pro_codes
            </span>
          </div>
          <p className="text-xs text-gray-300">
            Le fichier <code className="text-orange-400 font-bold">/supabase/schema.sql</code> est inclus dans le projet. Vous pouvez copier son contenu directement dans l'éditeur SQL de votre projet Supabase pour créer les 4 tables, les politiques de sécurité RLS et insérer les 15 codes PRO officiels.
          </p>
          <div className="p-3 bg-gray-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto">
            VITE_SUPABASE_URL=https://votre-projet.supabase.co<br />
            VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
          </div>
        </div>
      )}
    </div>
  );
};
