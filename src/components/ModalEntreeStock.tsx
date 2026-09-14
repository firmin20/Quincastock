import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { Product, Category, CATEGORIES } from '../types';

interface ModalEntreeStockProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  isPro: boolean;
  onSaveEntree: (
    name: string,
    category: Category,
    unitPrice: number,
    quantity: number
  ) => void;
  onTriggerProModal: () => void;
}

export const ModalEntreeStock: React.FC<ModalEntreeStockProps> = ({
  isOpen,
  onClose,
  products,
  isPro,
  onSaveEntree,
  onTriggerProModal,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Ciment');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Check if product exists already (case insensitive trim)
  const existingProduct = products.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Veuillez entrer le nom de l\'article.');
      return;
    }

    const priceNum = parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Veuillez entrer un prix unitaire valide en FCFA (supérieur ou égal à 0).');
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('La quantité achetée doit être un nombre entier positif supérieur à zéro.');
      return;
    }

    // CHECK 5 PRODUCTS LIMIT IN FREE PLAN
    // If product does not exist already, this will be a new distinct product
    if (!existingProduct && !isPro && products.length >= 5) {
      // BLOCK and show Premium modal
      onClose();
      onTriggerProModal();
      return;
    }

    onSaveEntree(cleanName, category, priceNum, qtyNum);
    onClose();
    // Reset form
    setName('');
    setUnitPrice('');
    setQuantity('');
    setError('');
  };

  // If user picks or types an existing product, autofill category & price
  const handleNameChange = (val: string) => {
    setName(val);
    setError('');
    const match = products.find(
      (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      setCategory(match.category);
      if (!unitPrice) {
        setUnitPrice(match.unitPrice.toString());
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Nouvelle entrée de stock
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Enregistrer un achat fournisseur
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

        {/* Existing product notice */}
        {existingProduct && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            ℹ️ Cet article existe déjà (Stock actuel : <strong>{existingProduct.quantity}</strong>). 
            La nouvelle quantité s'ajoutera automatiquement sans créer de doublon.
          </div>
        )}

        {/* Free Plan limit warning */}
        {!isPro && !existingProduct && products.length >= 4 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            ⚠️ <strong>Plan Gratuit :</strong> Vous utilisez {products.length}/5 articles. 
            À partir du 6e article, la version PRO est requise.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Nom de l'article */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              1. Nom de l'article <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="entree-name-input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Ciment 32.5, Fer 8, Tuyau PVC..."
              list="existing-products-list"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              required
            />
            {/* Quick datalist for easy autocomplete */}
            <datalist id="existing-products-list">
              {products.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>

          {/* 2. Catégorie */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              2. Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              id="entree-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3. Prix unitaire */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                3. Prix unitaire (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="entree-price-input"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Ex: 4800"
                min="0"
                step="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                required
              />
            </div>

            {/* 4. Quantité achetée */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                4. Quantité achetée <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="entree-qty-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 20"
                min="1"
                step="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                required
              />
            </div>
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
              id="entree-submit-btn"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer"
            >
              Ajouter au stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
