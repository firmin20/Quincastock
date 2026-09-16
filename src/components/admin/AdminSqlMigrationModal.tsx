import React, { useState } from 'react';
import { ADMIN_MIGRATION_SQL_SCRIPT, getSupabaseProjectRef } from '../../lib/schemaSql';
import { getSupabaseConfig } from '../../lib/supabase';
import { X, Copy, Check, ExternalLink, Terminal, ShieldAlert, Sparkles, Database } from 'lucide-react';

interface AdminSqlMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminSqlMigrationModal: React.FC<AdminSqlMigrationModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const config = getSupabaseConfig();
  const projectRef = getSupabaseProjectRef(config.url);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ADMIN_MIGRATION_SQL_SCRIPT);
    setCopied(true);
    if (onShowToast) onShowToast('Script SQL Administrateur copié !', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  return (
    <div
      id="admin-sql-migration-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Migration SQL Supabase — Espace Admin
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ADN STUDIO NUMÉRIQUE • Sécurité & Politiques RLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900">
            <p className="font-bold flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Pourquoi ce script est-il nécessaire ?
            </p>
            <p>
              Pour que vous puissiez consulter la liste de toutes les quincailleries, leurs stocks et les activations PRO <strong>sans compromettre la sécurité des clients</strong>, Supabase a besoin d'une politique RLS administrative et de la fonction <code className="bg-amber-100 px-1 rounded font-mono">is_admin()</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-orange-500" />
                Script SQL à exécuter (1 clic)
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié !' : 'Copier tout le script'}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 selection:bg-orange-500 selection:text-white">
                {ADMIN_MIGRATION_SQL_SCRIPT}
              </pre>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-2">
            <p className="font-bold text-gray-900">Procédure simple en 3 étapes :</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Cliquez sur <strong>« Copier tout le script »</strong> ci-dessus.</li>
              <li>Ouvrez votre <strong>SQL Editor Supabase</strong> via le lien direct ci-dessous.</li>
              <li>Collez le script et cliquez sur <strong>« Run »</strong>. C'est tout !</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir Supabase SQL Editor
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier le script'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
