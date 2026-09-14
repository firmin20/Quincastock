import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cloudService, SupabaseHealthReport } from '../services/cloudService';
import { SUPABASE_SQL_SCRIPT } from '../lib/schemaSql';

interface SupabaseSetupBannerProps {
  onStatusChange?: (report: SupabaseHealthReport) => void;
}

export const SupabaseSetupBanner: React.FC<SupabaseSetupBannerProps> = ({
  onStatusChange,
}) => {
  const [report, setReport] = useState<SupabaseHealthReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await cloudService.checkHealth();
      setReport(res);
      if (onStatusChange) onStatusChange(res);
    } catch (err) {
      console.error('Erreur vérification Supabase:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!report) return null;

  const sqlEditorUrl = report.projectRef
    ? `https://supabase.com/dashboard/project/${report.projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  // If everything is completely ready:
  if (report.allTablesExist) {
    return (
      <div
        id="supabase-status-connected"
        className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            Cloud Supabase Connecté & Synchronisé
          </span>
          <span className="hidden sm:inline text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded font-mono text-[11px]">
            {report.projectRef || 'Supabase'}
          </span>
          <span className="hidden md:inline text-emerald-700">
            • 4 tables RLS prêtes • {report.proCodesCount} codes PRO actifs
          </span>
        </div>

        <button
          id="btn-recheck-supabase"
          onClick={runCheck}
          disabled={checking}
          className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-medium transition cursor-pointer"
          title="Actualiser l'état de la connexion"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Vérifier</span>
        </button>
      </div>
    );
  }

  // If tables need to be created in Supabase:
  return (
    <div
      id="supabase-setup-alert"
      className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-md transition-all text-amber-950"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-amber-900">
                Action requise : Initialiser les tables Supabase
              </h4>
              <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                Étape unique (30 sec)
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Votre projet Supabase (<span className="font-mono font-semibold">{report.projectRef || 'nuemdcsnqoppjtcjtxdr'}</span>) est bien relié, mais le schéma SQL contenant les 4 tables (produits, mouvements, profils, codes PRO) doit être exécuté dans l'éditeur SQL de Supabase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            id="btn-toggle-setup-instructions"
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
          >
            {expanded ? 'Masquer le guide' : 'Voir les 3 étapes'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            id="btn-quick-copy-sql"
            onClick={handleCopySql}
            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié !' : 'Copier le SQL'}
          </button>
        </div>
      </div>

      {/* Détail de l'état des tables */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-amber-200/80 text-xs">
        <div className="flex items-center gap-1.5">
          {report.tables.profiles ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-amber-400 inline-block" />
          )}
          <span className={report.tables.profiles ? 'font-medium text-emerald-800' : 'text-amber-800'}>
            Table profiles
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {report.tables.products ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-amber-400 inline-block" />
          )}
          <span className={report.tables.products ? 'font-medium text-emerald-800' : 'text-amber-800'}>
            Table products
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {report.tables.movements ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-amber-400 inline-block" />
          )}
          <span className={report.tables.movements ? 'font-medium text-emerald-800' : 'text-amber-800'}>
            Table movements
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {report.tables.pro_codes ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-amber-400 inline-block" />
          )}
          <span className={report.tables.pro_codes ? 'font-medium text-emerald-800' : 'text-amber-800'}>
            Table pro_codes ({report.proCodesCount}/15)
          </span>
        </div>
      </div>

      {/* Guide complet dépliable */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-amber-200 bg-white/70 rounded-xl p-4 space-y-3 text-xs">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Procédure d'installation en 3 clics :
          </div>

          <ol className="space-y-2.5 list-decimal list-inside text-amber-900 font-medium">
            <li className="leading-relaxed">
              <span className="font-bold">Copiez le script SQL complet</span> en cliquant sur le bouton ci-dessous :
              <div className="mt-1.5 ml-4">
                <button
                  id="btn-copy-sql-detailed"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '✅ Script copié dans le presse-papier !' : 'Copier le script SQL complet'}
                </button>
              </div>
            </li>

            <li className="leading-relaxed">
              <span className="font-bold">Ouvrez l'éditeur SQL de votre projet Supabase</span> :
              <div className="mt-1.5 ml-4">
                <a
                  id="link-open-supabase-sql"
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ouvrir l'éditeur SQL de mon projet Supabase
                </a>
              </div>
              <p className="text-[11px] text-slate-600 ml-4 mt-1">
                Collez le script dans la fenêtre de requête puis cliquez sur le bouton vert <span className="font-bold">« RUN »</span> en bas à droite.
              </p>
            </li>

            <li className="leading-relaxed">
              <span className="font-bold">Revenez ici et cliquez sur « Vérifier la connexion »</span> :
              <div className="mt-1.5 ml-4">
                <button
                  id="btn-recheck-after-sql"
                  onClick={runCheck}
                  disabled={checking}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Vérification en cours...' : 'Vérifier la connexion maintenant'}
                </button>
              </div>
            </li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 mt-2 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Astuce pour les inscriptions instantanées :</span> Dans votre tableau de bord Supabase, allez dans <span className="font-semibold">Authentication → Providers → Email</span> et désactivez <span className="font-semibold">"Confirm email"</span>. Vos commerçants pourront se connecter immédiatement sans attendre d'email de validation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
