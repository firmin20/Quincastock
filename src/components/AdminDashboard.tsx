import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AdminClient,
  AdminActivationRecord,
  AdminActivityEvent,
  AdminDashboardStats,
  AdminTab,
  UserProfile,
} from '../types';
import { cloudService } from '../services/cloudService';
import { ADMIN_CONFIG, checkIsAdmin } from '../config/adminConfig';
import { formatFCFA, formatDate } from '../utils/formatters';
import { AdminClientDetailModal } from './admin/AdminClientDetailModal';
import { AdminSqlMigrationModal } from './admin/AdminSqlMigrationModal';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Activity,
  Key,
  Download,
  RefreshCw,
  LogOut,
  Search,
  Filter,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Package,
  Calendar,
  Lock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Code2,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: {
    id: string;
    email: string;
    profile: UserProfile;
  } | null;
  onExit: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onExit,
  onShowToast,
}) => {
  // Navigation & Subtabs
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsSqlMigration, setNeedsSqlMigration] = useState(false);

  // Core Admin Data
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    conversionRate: 0,
    totalProducts: 0,
    activeQuincailleries: 0,
    totalActivations: 0,
    estimatedRevenue: 0,
    newUsersThisWeek: 0,
  });
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [activations, setActivations] = useState<AdminActivationRecord[]>([]);
  const [activities, setActivities] = useState<AdminActivityEvent[]>([]);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'business' | 'products' | 'value'>('date');

  // Modals
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Security Check: Is current user the authorized admin?
  const isAuthorizedAdmin = useMemo(() => {
    if (!currentUser) return false;
    return checkIsAdmin(currentUser.id, currentUser.email, currentUser.profile?.role);
  }, [currentUser]);

  // Load all administrative data from Supabase
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, clientsRes, actRes, feedRes] = await Promise.all([
        cloudService.fetchAdminDashboardStats(),
        cloudService.fetchAdminClients(),
        cloudService.fetchAdminActivations(),
        cloudService.fetchAdminActivity(),
      ]);

      if (statsRes.needsSqlMigration || clientsRes.needsSqlMigration) {
        setNeedsSqlMigration(true);
      } else {
        setNeedsSqlMigration(false);
      }

      setStats(statsRes.stats);
      setClients(clientsRes.clients);
      setActivations(actRes.activations);
      setActivities(feedRes.events);

      if (statsRes.error && !statsRes.needsSqlMigration) {
        console.warn('Admin stats warning:', statsRes.error);
      }
    } catch (err) {
      console.error('Erreur chargement espace admin:', err);
      if (onShowToast) onShowToast('Erreur de synchronisation administrative.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    if (isAuthorizedAdmin) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAuthorizedAdmin, loadAdminData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadAdminData();
    if (onShowToast) onShowToast('Données actualisées depuis Supabase.', 'info');
  };

  const handleExportAll = () => {
    cloudService.exportClientsToCsv(clients, false);
    if (onShowToast) onShowToast('Export de tous les clients téléchargé !', 'success');
  };

  const handleExportPro = () => {
    cloudService.exportClientsToCsv(clients, true);
    if (onShowToast) onShowToast('Export des clients PRO téléchargé !', 'success');
  };

  // Filtered & Sorted Clients List
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        // Status filter
        if (clientFilter === 'pro' && !c.isPro) return false;
        if (clientFilter === 'free' && c.isPro) return false;

        // Search query
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          c.businessName.toLowerCase().includes(q) ||
          c.ownerName.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.proCodeUsed && c.proCodeUsed.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'business') {
          return a.businessName.localeCompare(b.businessName);
        }
        if (sortBy === 'products') {
          return (b.productCount || 0) - (a.productCount || 0);
        }
        if (sortBy === 'value') {
          return (b.totalStockValue || 0) - (a.totalStockValue || 0);
        }
        // Default: date desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [clients, clientFilter, searchTerm, sortBy]);

  // If user is NOT authorized to view the admin space
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
              ADN STUDIO NUMÉRIQUE
            </span>
            <h1 className="text-2xl font-black text-white">Espace Privé Administrateur</h1>
            <p className="text-sm text-slate-400">
              Cet espace est strictement réservé au propriétaire de l'application QuincaStock.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-left space-y-2 text-slate-300">
            <div className="flex items-center justify-between text-slate-400">
              <span>Administrateur autorisé :</span>
              <span className="font-mono text-orange-400 font-semibold">{ADMIN_CONFIG.ADMIN_EMAIL}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Compte connecté :</span>
              <span className="font-mono text-slate-200">{currentUser?.email || 'Non connecté'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onExit}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors shadow-lg shadow-orange-500/20"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Retourner à l'application QuincaStock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* ---------------------------------------------------- */}
      {/* TOP ADMIN HEADER */}
      {/* ---------------------------------------------------- */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  ADN STUDIO NUMÉRIQUE
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  <ShieldCheck className="w-3 h-3" />
                  ADMIN QUINCASTOCK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connecté en tant que <span className="text-slate-200 font-medium">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              title="Exporter tous les clients en CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={handleExportPro}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-colors border border-amber-500/40"
              title="Exporter uniquement les clients PRO"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Clients PRO</span>
            </button>

            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl text-xs font-bold transition-colors border border-purple-500/40"
              title="Voir le script SQL Supabase"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Script SQL</span>
            </button>

            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-orange-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter l'Admin</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto border-t border-slate-800/80 scrollbar-none gap-2 py-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Vue d'ensemble
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Quincailleries & Clients ({clients.length})
          </button>

          <button
            onClick={() => setActiveTab('activations')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'activations'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Activations PRO ({stats.proUsers})
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Flux d'activité
          </button>

          <button
            onClick={() => setActiveTab('sql_guide')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'sql_guide'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-400" />
            15 Codes PRO & SQL
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MAIN ADMIN CONTENT */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Migration Alert Banner if RLS policies are not yet run */}
        {needsSqlMigration && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  Action recommandée : Exécuter la migration SQL Administrateur
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Pour accéder à la totalité des données des utilisateurs sans restriction RLS, exécutez le script SQL fourni dans votre Supabase SQL Editor.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 shadow-sm"
            >
              Afficher le script SQL
            </button>
          </div>
        )}

        {/* TAB 1: VUE D'ENSEMBLE (KPIs) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Inscrits */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Inscriptions
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white mt-3">{stats.totalUsers}</p>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">+{stats.newUsersThisWeek}</span> cette semaine
                </div>
              </div>

              {/* Clients Gratuits vs PRO */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Comptes PRO Activés
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-amber-400 mt-3">{stats.proUsers}</p>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <span>{stats.freeUsers} en version gratuite</span>
                </div>
              </div>

              {/* Taux de Conversion */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Taux de Conversion
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-emerald-400 mt-3">{stats.conversionRate}%</p>
                <div className="mt-2 text-xs text-slate-400">
                  {stats.proUsers} PRO / {stats.totalUsers} total
                </div>
              </div>

              {/* Revenu Estimé */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Chiffre d'Affaires Estimé
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-orange-400 mt-3 truncate">
                  {formatFCFA(stats.estimatedRevenue)}
                </p>
                <div className="mt-2 text-xs text-slate-400">
                  Base : 15 000 FCFA / licence PRO
                </div>
              </div>
            </div>

            {/* Secondary KPIs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Quincailleries Actives</p>
                  <p className="text-xl font-bold text-white mt-0.5">{stats.activeQuincailleries}</p>
                  <p className="text-[11px] text-slate-500">Avec produits ou mouvements saisis</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Articles Référencés</p>
                  <p className="text-xl font-bold text-white mt-0.5">{stats.totalProducts}</p>
                  <p className="text-[11px] text-slate-500">Tous catalogues confondus</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Codes PRO Utilisés</p>
                  <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.totalActivations} / 15</p>
                  <p className="text-[11px] text-slate-500">15 codes officiels configurés</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Clients Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Last 5 Inscriptions */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    Dernières Quincailleries Inscrites
                  </h3>
                  <button
                    onClick={() => setActiveTab('clients')}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
                  >
                    Voir tout ({clients.length})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {clients.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Aucun client inscrit pour l'instant.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {clients.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClient(c)}
                        className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 text-orange-400 font-bold flex items-center justify-center text-sm shrink-0">
                            {c.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{c.businessName}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {c.ownerName} • {c.phone || c.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {c.isPro ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              PRO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
                              Gratuit
                            </span>
                          )}
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Recent Live Events */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Activité Récente
                  </h3>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
                  >
                    Flux complet
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Aucune activité enregistrée récemment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((ev) => (
                      <div key={ev.id} className="text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <p className="font-bold text-slate-200">{ev.title}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{ev.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ev.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUINCAILLERIES & CLIENTS (TABLEAU INTERACTIF COMPLET) */}
        {activeTab === 'clients' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Search & Filter Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher quincaillerie, nom, tél..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Filters & Export */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                {/* Filter pills */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setClientFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      clientFilter === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tous ({clients.length})
                  </button>
                  <button
                    onClick={() => setClientFilter('pro')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      clientFilter === 'pro'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PRO ({clients.filter((c) => c.isPro).length})
                  </button>
                  <button
                    onClick={() => setClientFilter('free')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      clientFilter === 'free'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Gratuit ({clients.filter((c) => !c.isPro).length})
                  </button>
                </div>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="date">Tri : Inscription récente</option>
                  <option value="business">Tri : Nom Quincaillerie</option>
                  <option value="products">Tri : Nombre de produits</option>
                  <option value="value">Tri : Valeur de stock</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Quincaillerie & Responsable</th>
                      <th className="px-5 py-3.5">Contact (Tél / Email)</th>
                      <th className="px-5 py-3.5">Statut</th>
                      <th className="px-5 py-3.5">Date Inscription</th>
                      <th className="px-5 py-3.5">Activation PRO</th>
                      <th className="px-5 py-3.5 text-right">Articles</th>
                      <th className="px-5 py-3.5 text-right">Valeur Stock</th>
                      <th className="px-5 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                          <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                          <p className="text-sm font-medium">Aucun client correspondant trouvé.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');
                        return (
                          <tr
                            key={client.id}
                            className="hover:bg-slate-800/50 transition-colors group"
                          >
                            {/* Business & Owner */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-400 font-bold flex items-center justify-center text-sm border border-orange-500/30 shrink-0">
                                  {client.businessName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                                    {client.businessName}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">
                                    {client.ownerName}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-5 py-3.5">
                              <div className="space-y-0.5 text-xs">
                                {client.phone ? (
                                  <div className="flex items-center gap-1.5 text-slate-300">
                                    <Phone className="w-3 h-3 text-orange-400" />
                                    <span>{client.phone}</span>
                                    <a
                                      href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-400 hover:text-emerald-300 ml-1"
                                      title="WhatsApp"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">Tél non renseigné</span>
                                )}
                                {client.email && (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Mail className="w-3 h-3 text-blue-400" />
                                    <span className="truncate max-w-[160px]">{client.email}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Statut PRO / Gratuit */}
                            <td className="px-5 py-3.5">
                              {client.isPro ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  PRO
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                  Gratuit
                                </span>
                              )}
                            </td>

                            {/* Date Inscription */}
                            <td className="px-5 py-3.5 text-xs text-slate-400">
                              {formatDate(client.createdAt)}
                            </td>

                            {/* Date Activation PRO & Code */}
                            <td className="px-5 py-3.5 text-xs">
                              {client.isPro ? (
                                <div>
                                  <p className="font-semibold text-amber-300">
                                    {client.proActivatedAt ? formatDate(client.proActivatedAt) : 'Activé'}
                                  </p>
                                  {client.proCodeUsed && (
                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[11px]">
                                      {client.proCodeUsed}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* Nb Articles */}
                            <td className="px-5 py-3.5 text-right font-bold text-white">
                              {client.productCount ?? 0}
                            </td>

                            {/* Valeur Stock */}
                            <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-emerald-400">
                              {formatFCFA(client.totalStockValue ?? 0)}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => setSelectedClient(client)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-orange-500"
                              >
                                Fiche
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVATIONS PRO */}
        {activeTab === 'activations' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Historique des Activations de Licences PRO
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suivi direct des paiements et des codes utilisés par vos clients
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold">
                  {stats.proUsers} licences actives = {formatFCFA(stats.estimatedRevenue)}
                </div>
                <button
                  onClick={handleExportPro}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Télécharger CSV PRO
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Date d'Activation</th>
                      <th className="px-5 py-3.5">Code Utilisé</th>
                      <th className="px-5 py-3.5">Quincaillerie & Responsable</th>
                      <th className="px-5 py-3.5">Téléphone</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {activations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                          <p className="text-sm font-medium">Aucune activation PRO enregistrée pour l'instant.</p>
                        </td>
                      </tr>
                    ) : (
                      activations.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5 text-xs text-slate-300">
                            {formatDate(a.activatedAt)}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-xs">
                            <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                              {a.code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-white">{a.businessName || 'Quincaillerie'}</p>
                            <p className="text-xs text-slate-400">{a.ownerName || 'Responsable'}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-300">
                            {a.phone || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-400">
                            {a.email || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400 text-xs">
                            15 000 FCFA
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FLUX D'ACTIVITÉ EN DIRECT */}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Journal d'Activité en Direct
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Événements récents : inscriptions, activations PRO, ventes et entrées de stock
                </p>
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              >
                Actualiser
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 py-10 text-center">
                  Aucun événement dans le journal pour le moment.
                </p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {activities.map((ev) => (
                    <div key={ev.id} className="relative">
                      {/* Event Dot */}
                      <div
                        className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                          ev.type === 'ACTIVATION_PRO'
                            ? 'bg-amber-400 ring-4 ring-amber-400/20'
                            : ev.type === 'INSCRIPTION'
                            ? 'bg-blue-400'
                            : ev.type === 'VENTE'
                            ? 'bg-emerald-400'
                            : 'bg-purple-400'
                        }`}
                      />

                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-white">{ev.title}</p>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(ev.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{ev.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: 15 CODES PRO & MIGRATION SQL */}
        {activeTab === 'sql_guide' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 15 PRO Codes Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-400" />
                    Les 15 Codes PRO Officiels QuincaStock
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chaque code donne un accès PRO illimité pour une valeur unitaire de 15 000 FCFA.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {ADMIN_CONFIG.OFFICIAL_PRO_CODES.map((code) => {
                  const matchingActivation = activations.find((a) => a.code === code);
                  const isUsed = Boolean(matchingActivation);

                  return (
                    <div
                      key={code}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                        isUsed
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-white">{code}</span>
                        {isUsed ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            UTILISÉ
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            DISPONIBLE
                          </span>
                        )}
                      </div>
                      {isUsed && matchingActivation && (
                        <p className="text-[10px] text-slate-400 mt-2 truncate">
                          {matchingActivation.businessName || 'Client'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SQL Migration Quick Launcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  Script SQL de Migration Administrateur Supabase
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Ce script permet à Supabase d'autoriser la consultation de toutes les quincailleries sans lever d'erreur RLS, tout en garantissant que vos clients ne puissent jamais voir les données d'autres quincailleries.
                </p>
              </div>

              <button
                onClick={() => setIsSqlModalOpen(true)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-lg shadow-purple-600/20"
              >
                Ouvrir le script SQL
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}
      <AdminClientDetailModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />

      <AdminSqlMigrationModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
