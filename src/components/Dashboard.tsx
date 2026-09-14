import React from 'react';
import { 
  Package, 
  Coins, 
  AlertTriangle, 
  ArrowLeftRight, 
  PlusCircle, 
  MinusCircle, 
  Sparkles, 
  AlertOctagon, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Product, Movement } from '../types';
import { formatFCFA, isToday, formatDateFR } from '../utils/formatters';

interface DashboardProps {
  products: Product[];
  movements: Movement[];
  isPro: boolean;
  onOpenEntree: () => void;
  onOpenSortie: () => void;
  onOpenPro: () => void;
  onNavigateStock: () => void;
  onNavigateMovements: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  movements,
  isPro,
  onOpenEntree,
  onOpenSortie,
  onOpenPro,
  onNavigateStock,
  onNavigateMovements,
}) => {
  // CARTE 1: Nombre total d'articles (produits différents)
  const totalArticles = products.length;

  // CARTE 2: Valeur totale du stock
  const totalStockValue = products.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);

  // CARTE 3: Articles en stock faible (qty > 0 && qty <= 5)
  const lowStockArticles = products.filter((p) => p.quantity > 0 && p.quantity <= 5);
  const lowStockCount = lowStockArticles.length;

  // Articles en rupture (qty === 0)
  const outOfStockArticles = products.filter((p) => p.quantity === 0);
  const outOfStockCount = outOfStockArticles.length;

  // CARTE 4: Mouvements du jour
  const todayMovementsCount = movements.filter((m) => isToday(m.timestamp)).length;

  // Combined alerts
  const alertProducts = products.filter((p) => p.quantity <= 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Title & Subtitle + Plan Badge */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">
            Gérez facilement votre stock et vos mouvements.
          </p>
        </div>

        {/* Plan Indicator */}
        <div className="flex items-center">
          {isPro ? (
            <div className="flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orange-100">
                  Formule Active
                </div>
                <div className="text-sm font-extrabold flex items-center gap-1">
                  ⭐ QUINCASTOCK PRO
                  <span className="text-xs font-medium text-orange-100 ml-1.5 border-l border-orange-300 pl-1.5">
                    Produits illimités
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between space-x-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    VERSION GRATUITE
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                  {totalArticles} / 5 produits utilisés
                </div>
              </div>
              <button
                onClick={onOpenPro}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                Passer en PRO
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* CARTE 1: Total Articles */}
        <div 
          id="stat-card-total-articles"
          onClick={onNavigateStock}
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Articles Enregistrés
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900">
              {totalArticles}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Nombre d'articles différents
            </p>
          </div>
        </div>

        {/* CARTE 2: Valeur totale du stock */}
        <div 
          id="stat-card-stock-value"
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-orange-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Valeur Totale Stock
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {formatFCFA(totalStockValue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Prix unitaire × quantité restante
            </p>
          </div>
        </div>

        {/* CARTE 3: Articles en stock faible */}
        <div 
          id="stat-card-low-stock"
          onClick={onNavigateStock}
          className={`bg-white rounded-2xl p-5 border shadow-xs transition-all cursor-pointer ${
            lowStockCount > 0 || outOfStockCount > 0 
              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50' 
              : 'border-gray-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Stock Faible & Rupture
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              outOfStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <div className={`text-3xl font-black ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
              {lowStockCount}
            </div>
            {outOfStockCount > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                +{outOfStockCount} rupture(s)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Quantité comprise entre 1 et 5
          </p>
        </div>

        {/* CARTE 4: Mouvements du jour */}
        <div 
          id="stat-card-movements-today"
          onClick={onNavigateMovements}
          className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Mouvements du jour
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-gray-900">
              {todayMovementsCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Achats & ventes enregistrés aujourd'hui
            </p>
          </div>
        </div>
      </div>

      {/* 2 MAIN ACTION BUTTONS: Big Green & Big Red */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* BOUTON VERT: + Entrée Stock */}
        <button
          id="btn-entree-stock"
          onClick={onOpenEntree}
          className="w-full bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white rounded-2xl p-6 sm:p-7 shadow-lg shadow-emerald-900/10 transition-all transform active:scale-[0.99] cursor-pointer flex items-center justify-between text-left group"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                + Entrée Stock
              </span>
            </div>
            <p className="text-emerald-100 text-sm sm:text-base font-medium">
              Ajouter un achat de marchandises
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:rotate-90 transition-transform duration-300 flex-shrink-0">
            <PlusCircle className="w-8 h-8" />
          </div>
        </button>

        {/* BOUTON ROUGE: - Sortie Stock */}
        <button
          id="btn-sortie-stock"
          onClick={onOpenSortie}
          className="w-full bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl p-6 sm:p-7 shadow-lg shadow-red-900/10 transition-all transform active:scale-[0.99] cursor-pointer flex items-center justify-between text-left group"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                - Sortie Stock
              </span>
            </div>
            <p className="text-rose-100 text-sm sm:text-base font-medium">
              Enregistrer une vente à un client
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            <MinusCircle className="w-8 h-8" />
          </div>
        </button>
      </div>

      {/* SECTION ALERTES DE STOCK */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900">
              ⚠️ Alertes de stock
            </h2>
          </div>
          {alertProducts.length > 0 && (
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {alertProducts.length} article(s) à réapprovisionner
            </span>
          )}
        </div>

        {alertProducts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-800">
            <p className="font-bold text-sm">
              ✅ Votre stock est sécurisé !
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Aucun produit n'est en rupture ni en stock critique actuellement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertProducts.map((p) => {
              const isRupture = p.quantity === 0;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isRupture
                      ? 'bg-red-50/70 border-red-200'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="pr-2 min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2 mt-0.5">
                      <span>{p.category}</span>
                      <span>•</span>
                      <span className="font-semibold">Stock: {p.quantity}</span>
                    </div>
                  </div>
                  <div>
                    {isRupture ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white whitespace-nowrap shadow-xs">
                        ❌ Rupture
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white whitespace-nowrap shadow-xs">
                        ⚠️ Stock faible
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APERÇU RAPIDE DES DERNIERS MOUVEMENTS */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-gray-900">
              Derniers Mouvements
            </h2>
          </div>
          <button
            onClick={onNavigateMovements}
            className="text-xs sm:text-sm text-orange-600 font-bold hover:text-orange-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>Voir tout l'historique</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {movements.length === 0 ? (
          <div className="p-6 text-center text-gray-500 rounded-xl bg-gray-50 text-sm">
            Aucun mouvement enregistré.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.slice(0, 5).map((m) => {
              const isAchat = m.type === 'ACHAT';
              return (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold ${
                        isAchat
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isAchat ? '+ ACHAT' : '- VENTE'}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{m.productName}</div>
                      <div className="text-xs text-gray-500">{formatDateFR(m.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-gray-900">
                      {isAchat ? `+${m.quantity}` : `-${m.quantity}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Stock après : {m.stockAfter}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
