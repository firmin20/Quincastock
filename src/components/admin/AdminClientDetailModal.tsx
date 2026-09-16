import React, { useState, useEffect } from 'react';
import { AdminClient, Product, Movement } from '../../types';
import { cloudService } from '../../services/cloudService';
import { formatFCFA, formatDate } from '../../utils/formatters';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Package,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Clock,
  ShieldCheck,
  Hash,
} from 'lucide-react';

interface AdminClientDetailModalProps {
  client: AdminClient | null;
  onClose: () => void;
}

export const AdminClientDetailModal: React.FC<AdminClientDetailModalProps> = ({
  client,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');

  useEffect(() => {
    if (!client?.userId) return;

    let isMounted = true;
    setLoading(true);

    cloudService
      .fetchClientDetail(client.userId)
      .then((res) => {
        if (isMounted) {
          setProducts(res.products || []);
          setMovements(res.movements || []);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement détails client:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [client?.userId]);

  if (!client) return null;

  const cleanPhone = (client.phone || '').replace(/[^0-9+]/g, '');

  return (
    <div
      id="admin-client-detail-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
              {client.businessName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {client.businessName}
                </h2>
                {client.isPro ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    VERSION PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-gray-300 border border-slate-700">
                    GRATUIT
                  </span>
                )}
                {client.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <ShieldCheck className="w-3 h-3" />
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                Responsable : <span className="text-slate-200 font-medium">{client.ownerName}</span>
              </p>
            </div>
          </div>

          <button
            id="close-admin-detail-btn"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Actions & Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">Téléphone</p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {client.phone || 'Non renseigné'}
                  </p>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                    title="Appeler"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="WhatsApp"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500">Email</p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {client.email || 'Non renseigné'}
                  </p>
                </div>
              </div>
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
                  title="Envoyer un email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Inscription & Activité */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">Inscrit le</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(client.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* PRO Info Banner */}
          {client.isPro ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    Compte activé en Version PRO
                  </p>
                  <p className="text-xs text-amber-800">
                    Activation :{' '}
                    <span className="font-semibold">
                      {client.proActivatedAt ? formatDate(client.proActivatedAt) : 'Oui'}
                    </span>{' '}
                    {client.proCodeUsed && (
                      <span>
                        • Code utilisé :{' '}
                        <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">
                          {client.proCodeUsed}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 w-fit">
                Tarif : 15 000 FCFA
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Compte en Version Gratuite</p>
                  <p className="text-xs text-slate-500">
                    Limite standard de 10 articles. Ce client n'a pas encore saisi de code PRO.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-500" />
                Produits en stock
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {products.length}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Valeur du stock
              </p>
              <p className="text-xl font-black text-emerald-600 mt-1 truncate">
                {formatFCFA(
                  products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0)
                )}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                Achats enregistrés
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {movements.filter((m) => m.type === 'ACHAT').length}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-purple-500" />
                Ventes enregistrées
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {movements.filter((m) => m.type === 'VENTE').length}
              </p>
            </div>
          </div>

          {/* Subtabs: Products & Movements */}
          <div className="pt-2">
            <div className="flex border-b border-gray-200 gap-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'products'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Catalogue produits ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('movements')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'movements'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                Historique mouvements ({movements.length})
              </button>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-sm">Chargement des données Supabase...</p>
                </div>
              ) : activeTab === 'products' ? (
                products.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">Ce client n'a pas encore ajouté de produit.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">Produit</th>
                          <th className="px-4 py-3">Catégorie</th>
                          <th className="px-4 py-3 text-right">Prix Unitaire</th>
                          <th className="px-4 py-3 text-right">Quantité</th>
                          <th className="px-4 py-3 text-right">Valeur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/80">
                            <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                            <td className="px-4 py-2.5 text-gray-500">{p.category}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-gray-800">
                              {formatFCFA(p.unitPrice)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                              {p.quantity}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">
                              {formatFCFA(p.quantity * p.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : movements.length === 0 ? (
                <div className="py-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">Aucun mouvement enregistré pour ce client.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Produit</th>
                        <th className="px-4 py-3 text-right">Qté</th>
                        <th className="px-4 py-3 text-right">Stock Après</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {movements.slice(0, 30).map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-2.5 text-gray-500 text-xs">
                            {formatDate(m.timestamp)}
                          </td>
                          <td className="px-4 py-2.5">
                            {m.type === 'VENTE' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                <ArrowUpRight className="w-3 h-3" />
                                Vente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                <ArrowDownLeft className="w-3 h-3" />
                                Entrée
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{m.productName}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                            {m.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-600">
                            {m.stockAfter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
