import React, { useState, useEffect } from 'react';
import { X, MinusCircle, AlertOctagon, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { formatFCFA } from '../utils/formatters';

interface ModalSortieStockProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveSortie: (productId: string, quantity: number) => void;
}

export const ModalSortieStock: React.FC<ModalSortieStockProps> = ({
  isOpen,
  onClose,
  products,
  onSaveSortie,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [error, setError] = useState('');

  // When products change or modal opens, pick first available in stock
  useEffect(() => {
    if (isOpen) {
      setError('');
      setQuantity('');
      if (products.length > 0) {
        // Prefer first product with stock > 0
        const inStockProd = products.find((p) => p.quantity > 0) || products[0];
        setSelectedProductId(inStockProd.id);
      }
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.quantity : 0;
  const unitPrice = selectedProduct ? selectedProduct.unitPrice : 0;
  const requestedQty = parseInt(quantity, 10) || 0;
  const totalSaleAmount = requestedQty * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Veuillez sélectionner un article.');
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('La quantité vendue doit être un nombre entier positif supérieur à zéro.');
      return;
    }

    // STRICT CHECK: IF QUANTITY > STOCK -> BLOCK
    if (qtyNum > currentStock) {
      setError(
        `❌ Stock insuffisant (Stock disponible : ${currentStock}, Quantité demandée : ${qtyNum})`
      );
      return;
    }

    onSaveSortie(selectedProduct.id, qtyNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <MinusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Nouvelle vente
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Enregistrer une sortie de marchandise
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Aucun article n'est actuellement disponible dans votre stock. Veuillez d'abord ajouter un article.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* 1. Article */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Article à vendre <span className="text-red-500">*</span>
              </label>
              <select
                id="sortie-product-select"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-bold bg-white"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                    {p.name} — (Stock : {p.quantity} | {formatFCFA(p.unitPrice)})
                    {p.quantity === 0 ? ' [RUPTURE]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock Preview Card */}
            {selectedProduct && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase">Stock Disponible</div>
                  <div className="text-lg font-black text-gray-900 mt-0.5">
                    {currentStock} unité(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-bold uppercase">Prix Unitaire</div>
                  <div className="text-sm font-black text-gray-800 mt-0.5">
                    {formatFCFA(unitPrice)}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Quantité vendue */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Quantité vendue <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="sortie-qty-input"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                placeholder="Ex: 5"
                min="1"
                max={currentStock > 0 ? currentStock : 1}
                step="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-base font-black"
                required
              />
            </div>

            {/* Montant total calculé en direct */}
            {requestedQty > 0 && selectedProduct && (
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-rose-950">
                <span className="text-xs font-bold uppercase">Total vente :</span>
                <span className="text-base font-black text-rose-800">
                  {formatFCFA(totalSaleAmount)}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-xs font-bold text-red-700 flex items-start space-x-2">
                <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                id="sortie-submit-btn"
                disabled={currentStock === 0}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-gray-300 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer"
              >
                Enregistrer la vente
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
