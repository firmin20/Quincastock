import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Filter,
  Calendar
} from 'lucide-react';
import { Movement } from '../types';
import { formatDateFR } from '../utils/formatters';

interface MovementsTableProps {
  movements: Movement[];
}

export const MovementsTable: React.FC<MovementsTableProps> = ({ movements }) => {
  const [filterType, setFilterType] = useState<'all' | 'ACHAT' | 'VENTE'>('all');
  const [searchArticle, setSearchArticle] = useState('');

  // Sort descending by timestamp (most recent first)
  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [movements]);

  // Filter
  const filteredMovements = useMemo(() => {
    return sortedMovements.filter((m) => {
      const matchesType = filterType === 'all' || m.type === filterType;
      const matchesSearch = m.productName.toLowerCase().includes(searchArticle.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [sortedMovements, filterType, searchArticle]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-7 h-7 text-orange-600" />
            Historique des mouvements
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            Traçabilité complète de tous les achats et ventes de votre quincaillerie.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {movements.filter((m) => m.type === 'ACHAT').length} Achats
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
            {movements.filter((m) => m.type === 'VENTE').length} Ventes
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchArticle}
            onChange={(e) => setSearchArticle(e.target.value)}
            placeholder="Filtrer par nom d'article..."
            className="w-full pl-11 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
          {searchArticle && (
            <button
              onClick={() => setSearchArticle('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Type Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({movements.length})
          </button>
          <button
            onClick={() => setFilterType('ACHAT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterType === 'ACHAT'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Achats
          </button>
          <button
            onClick={() => setFilterType('VENTE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterType === 'VENTE'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Ventes
          </button>
        </div>
      </div>

      {/* Movements Table */}
      {movements.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-xs text-center text-gray-500">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            Aucun mouvement enregistré.
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Les entrées d'achats et sorties de ventes s'afficheront ici automatiquement.
          </p>
        </div>
      ) : filteredMovements.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-gray-500">
          <p className="text-sm font-medium">
            Aucun mouvement ne correspond aux filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-900 text-white text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 sm:px-6">Date / Heure</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-4 text-center">Quantité</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Stock après mouvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((m) => {
                  const isAchat = m.type === 'ACHAT';

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Date / Heure */}
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDateFR(m.timestamp)}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAchat ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800">
                            ACHAT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-rose-100 text-rose-800">
                            VENTE
                          </span>
                        )}
                      </td>

                      {/* Article */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {m.productName}
                      </td>

                      {/* Quantité */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-black">
                        <span
                          className={`inline-block px-2 py-0.5 rounded ${
                            isAchat ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'
                          }`}
                        >
                          {isAchat ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>

                      {/* Stock après mouvement */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-800">
                          Stock après : <strong className="ml-1 text-gray-900">{m.stockAfter}</strong>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
            Affichage de {filteredMovements.length} mouvement(s) ordonné(s) du plus récent au plus ancien.
          </div>
        </div>
      )}
    </div>
  );
};
