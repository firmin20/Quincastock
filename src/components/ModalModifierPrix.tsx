import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatFCFA } from '../utils/formatters';

interface ModalModifierPrixProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSaveNewPrice: (productId: string, newPrice: number) => void;
}

export const ModalModifierPrix: React.FC<ModalModifierPrixProps> = ({
  isOpen,
  onClose,
  product,
  onSaveNewPrice,
}) => {
  const [newPrice, setNewPrice] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setNewPrice(product.unitPrice.toString());
      setError('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Veuillez entrer un prix valide supérieur ou égal à 0 FCFA.');
      return;
    }

    onSaveNewPrice(product.id, priceNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Modifier le prix
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Actualiser le tarif de vente
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nom du produit */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Article
            </div>
            <div className="text-base font-black text-gray-900 mt-0.5">
              {product.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Catégorie : {product.category} • Stock actuel : {product.quantity}
            </div>
          </div>

          {/* Prix actuel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Prix actuel
            </label>
            <div className="text-sm font-bold text-gray-700 bg-gray-100 px-4 py-2.5 rounded-xl">
              {formatFCFA(product.unitPrice)}
            </div>
          </div>

          {/* Nouveau prix */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Nouveau prix (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="edit-price-input"
              value={newPrice}
              onChange={(e) => {
                setNewPrice(e.target.value);
                setError('');
              }}
              placeholder="Ex: 5000"
              min="0"
              step="1"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base font-black"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
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
              id="edit-price-submit-btn"
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
