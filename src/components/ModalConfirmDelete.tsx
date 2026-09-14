import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface ModalConfirmDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmDelete: (productId: string) => void;
}

export const ModalConfirmDelete: React.FC<ModalConfirmDeleteProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmDelete,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-3 text-red-600">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              Confirmation de suppression
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">
            Voulez-vous vraiment supprimer cet article ?
          </p>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="font-extrabold text-gray-900 text-sm">
              {product.name}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Catégorie : {product.category} • Quantité en stock : {product.quantity}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            ℹ️ <strong>Note importante :</strong> L'article sera retiré de votre stock actif, mais l'historique des mouvements passés (achats et ventes) sera conservé pour votre comptabilité.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            id="confirm-delete-btn"
            onClick={() => {
              onConfirmDelete(product.id);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
