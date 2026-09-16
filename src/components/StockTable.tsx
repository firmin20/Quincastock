import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  FileSpreadsheet, 
  Plus, 
  Edit3, 
  Trash2, 
  Package, 
  AlertTriangle, 
  XCircle,
  Filter,
  ArrowUpDown,
  Printer
} from 'lucide-react';
import { Product, CATEGORIES, Category } from '../types';
import { formatFCFA } from '../utils/formatters';
import { exportInventoryPDF } from '../utils/pdfExport';
import { exportInventoryCSV } from '../utils/csvExport';

interface StockTableProps {
  products: Product[];
  onOpenEntree: () => void;
  onEditPrice: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  products,
  onOpenEntree,
  onEditPrice,
  onDeleteProduct,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'instock' | 'low' | 'out'>('all');

  // Filter products by search term and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesStatus = true;
      if (filterStatus === 'instock') matchesStatus = p.quantity > 5;
      if (filterStatus === 'low') matchesStatus = p.quantity > 0 && p.quantity <= 5;
      if (filterStatus === 'out') matchesStatus = p.quantity === 0;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, filterStatus]);

  const handleExportPDF = () => {
    if (products.length === 0) {
      onShowToast("Aucun produit à exporter en PDF.", "warning");
      return;
    }
    try {
      exportInventoryPDF(products);
      onShowToast("✓ Export PDF terminé", "success");
    } catch (e) {
      console.error(e);
      onShowToast("Erreur lors de la génération du PDF", "error");
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      onShowToast("Aucun produit à exporter en CSV.", "warning");
      return;
    }
    try {
      exportInventoryCSV(products);
      onShowToast("✓ Export terminé", "success");
    } catch (e) {
      console.error(e);
      onShowToast("Erreur lors de l'export CSV", "error");
    }
  };

  const handleDirectPrint = () => {
    try {
      window.print();
    } catch {
      handleExportPDF();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-orange-600" />
            Mon Stock
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            Visualisez tous vos articles, modifiez les prix et exportez l'inventaire.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Print */}
          <button
            id="btn-print-direct"
            onClick={handleDirectPrint}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-xs transition-colors cursor-pointer min-h-[40px]"
            title="Imprimer directement via l'imprimante"
          >
            <Printer className="w-4 h-4 mr-1.5 text-orange-400" />
            Imprimer
          </button>

          {/* Export PDF */}
          <button
            id="btn-export-pdf"
            onClick={handleExportPDF}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-800 hover:bg-gray-700 text-white shadow-xs transition-colors cursor-pointer min-h-[40px]"
            title="Télécharger la fiche d'inventaire en PDF"
          >
            <FileText className="w-4 h-4 mr-1.5 text-orange-400" />
            Fiche PDF
          </button>

          {/* Export Excel CSV */}
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer min-h-[40px]"
            title="Exporter en fichier Excel compatible (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Excel (CSV)
          </button>

          {/* Add Article Button */}
          <button
            id="btn-add-article"
            onClick={onOpenEntree}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Ajouter au stock
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Real-time search field */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un article par nom ou catégorie (ex: Ciment)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 p-1 font-bold"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({products.length})
            </button>
            <button
              onClick={() => setFilterStatus('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              ⚠️ Faibles ({products.filter((p) => p.quantity > 0 && p.quantity <= 5).length})
            </button>
            <button
              onClick={() => setFilterStatus('out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              ❌ Ruptures ({products.filter((p) => p.quantity === 0).length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          <span className="text-xs font-bold text-gray-600 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Catégories:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Table */}
      {products.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-10 sm:p-14 border border-gray-200 shadow-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900">
            Votre stock est encore vide.
          </h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Commencez par ajouter votre premier article.
          </p>
          <div className="mt-6">
            <button
              id="empty-state-add-btn"
              onClick={onOpenEntree}
              className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" />
              + Ajouter un article
            </button>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-gray-500">
          <p className="text-sm font-medium">
            Aucun article ne correspond à votre recherche "{searchTerm}".
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setFilterStatus('all');
            }}
            className="mt-3 text-xs text-orange-600 font-bold hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Mobile Cards View (Smartphones < 640px) */}
          <div className="block sm:hidden divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const isLow = product.quantity > 0 && product.quantity <= 5;
              const isOutOfStock = product.quantity === 0;
              const totalValue = product.unitPrice * product.quantity;

              return (
                <div
                  key={`mobile-${product.id}`}
                  className={`p-4 space-y-3 ${
                    isLow
                      ? 'bg-rose-50/40'
                      : isOutOfStock
                      ? 'bg-gray-100/50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-snug">
                        {product.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 mt-1">
                        {product.category}
                      </span>
                    </div>

                    <div>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-red-600 text-white shadow-xs">
                          ❌ RUPTURE
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500 text-white shadow-xs">
                          ⚠️ FAIBLE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shadow-xs">
                          EN STOCK
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-center text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Prix Unit.</span>
                      <strong className="text-gray-900 font-bold">{formatFCFA(product.unitPrice)}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Quantité</span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded font-black text-xs ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {product.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Valeur</span>
                      <strong className="text-gray-900 font-bold">{formatFCFA(totalValue)}</strong>
                    </div>
                  </div>

                  {/* Actions mobile touch friendly */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onEditPrice(product)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-2xs min-h-[40px]"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-gray-500" />
                      Modifier Prix
                    </button>

                    <button
                      onClick={() => onDeleteProduct(product)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 transition-colors shadow-2xs min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-900 text-white text-xs uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 sm:px-6">Nom Article</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4 text-right">Prix Unitaire</th>
                  <th className="py-3.5 px-4 text-center">Quantité Restante</th>
                  <th className="py-3.5 px-4 text-right">Valeur Totale</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const isLow = product.quantity > 0 && product.quantity <= 5;
                  const isOutOfStock = product.quantity === 0;
                  const totalValue = product.unitPrice * product.quantity;

                  // Styling logic as specified in Requirement 16 & 17
                  let rowClasses = 'hover:bg-gray-50/80 transition-colors';
                  if (isLow) {
                    // Mettre visuellement la ligne en évidence avec une couleur rouge légère
                    rowClasses = 'bg-rose-50/50 hover:bg-rose-50 text-gray-900';
                  } else if (isOutOfStock) {
                    // Ligne grisée pour rupture
                    rowClasses = 'bg-gray-100/60 hover:bg-gray-100 text-gray-500';
                  }

                  return (
                    <tr key={product.id} className={rowClasses}>
                      {/* Nom Article */}
                      <td className="py-4 px-4 sm:px-6 font-bold text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{product.name}</span>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-4 px-4 text-gray-600 font-medium">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {product.category}
                        </span>
                      </td>

                      {/* Prix Unitaire */}
                      <td className="py-4 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatFCFA(product.unitPrice)}
                      </td>

                      {/* Quantité Restante */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-black text-sm ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {product.quantity}
                        </span>
                      </td>

                      {/* Valeur Totale */}
                      <td className="py-4 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                        {formatFCFA(totalValue)}
                      </td>

                      {/* Statut */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-red-600 text-white shadow-xs">
                            ❌ RUPTURE
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-amber-500 text-white shadow-xs">
                            ⚠️ STOCK FAIBLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-emerald-600 text-white shadow-xs">
                            EN STOCK
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onEditPrice(product)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-300 transition-colors cursor-pointer shadow-2xs"
                            title="Modifier le prix de vente"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1 text-gray-500" />
                            Modifier Prix
                          </button>

                          <button
                            onClick={() => onDeleteProduct(product)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors cursor-pointer shadow-2xs"
                            title="Supprimer cet article du stock"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table summary bar */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
            <div>
              Affichage de <span className="font-bold text-gray-900">{filteredProducts.length}</span> sur{' '}
              <span className="font-bold text-gray-900">{products.length}</span> article(s) au total
            </div>
            <div className="flex items-center gap-4">
              <span>
                Valeur affichée :{' '}
                <strong className="text-gray-900">
                  {formatFCFA(filteredProducts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0))}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
