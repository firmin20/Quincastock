import React, { useState, useEffect, useCallback } from 'react';
import { Product, Movement, Category, Toast, ActiveTab } from './types';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredMovements, 
  saveStoredMovements, 
  getStoredIsPro, 
  saveStoredIsPro 
} from './utils/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { StockTable } from './components/StockTable';
import { MovementsTable } from './components/MovementsTable';
import { ProSection } from './components/ProSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ModalEntreeStock } from './components/ModalEntreeStock';
import { ModalSortieStock } from './components/ModalSortieStock';
import { ModalModifierPrix } from './components/ModalModifierPrix';
import { ModalConfirmDelete } from './components/ModalConfirmDelete';
import { ModalProUpgrade } from './components/ModalProUpgrade';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  // Application State initialized from localStorage
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [movements, setMovements] = useState<Movement[]>(() => getStoredMovements());
  const [isPro, setIsPro] = useState<boolean>(() => getStoredIsPro());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modal States
  const [isEntreeModalOpen, setIsEntreeModalOpen] = useState(false);
  const [isSortieModalOpen, setIsSortieModalOpen] = useState(false);
  const [editingPriceProduct, setEditingPriceProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save products whenever updated
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  // Save movements whenever updated
  useEffect(() => {
    saveStoredMovements(movements);
  }, [movements]);

  // Save isPro state whenever updated
  useEffect(() => {
    saveStoredIsPro(isPro);
  }, [isPro]);

  // Low stock count for navigation badge
  const lowStockAlertCount = products.filter((p) => p.quantity <= 5).length;

  // 1. ENTRÉE DE STOCK (ACHAT)
  const handleSaveEntree = (
    name: string,
    category: Category,
    unitPrice: number,
    quantity: number
  ) => {
    const existingIndex = products.findIndex(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    let updatedProducts: Product[];
    let targetProduct: Product;
    let stockAfter = quantity;

    if (existingIndex >= 0) {
      // Product exists -> Add quantity to existing stock without creating duplicate
      const current = products[existingIndex];
      stockAfter = current.quantity + quantity;
      targetProduct = {
        ...current,
        quantity: stockAfter,
        unitPrice: unitPrice > 0 ? unitPrice : current.unitPrice,
        category: category || current.category,
        updatedAt: new Date().toISOString(),
      };

      updatedProducts = [...products];
      updatedProducts[existingIndex] = targetProduct;
    } else {
      // New product
      targetProduct = {
        id: 'prod-' + Date.now(),
        name,
        category,
        unitPrice,
        quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      stockAfter = quantity;
      updatedProducts = [targetProduct, ...products];
    }

    // Create Movement: ACHAT
    const newMovement: Movement = {
      id: 'mov-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'ACHAT',
      productName: targetProduct.name,
      productId: targetProduct.id,
      quantity,
      stockAfter,
      unitPrice: targetProduct.unitPrice,
    };

    setProducts(updatedProducts);
    setMovements([newMovement, ...movements]);
    addToast('✓ Produit ajouté au stock', 'success');
  };

  // 2. SORTIE DE STOCK (VENTE)
  const handleSaveSortie = (productId: string, quantity: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    // Safety check: Cannot exceed stock
    if (quantity > target.quantity) {
      addToast('❌ Stock insuffisant pour cette vente', 'error');
      return;
    }

    const newStock = target.quantity - quantity;
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          quantity: newStock,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // Create Movement: VENTE
    const newMovement: Movement = {
      id: 'mov-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'VENTE',
      productName: target.name,
      productId: target.id,
      quantity,
      stockAfter: newStock,
      unitPrice: target.unitPrice,
    };

    setProducts(updatedProducts);
    setMovements([newMovement, ...movements]);
    addToast('✓ Vente enregistrée', 'success');
  };

  // 3. MODIFIER PRIX
  const handleSaveNewPrice = (productId: string, newPrice: number) => {
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          unitPrice: newPrice,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    addToast('✓ Prix modifié', 'success');
  };

  // 4. SUPPRIMER ARTICLE
  const handleConfirmDelete = (productId: string) => {
    // Remove product from active stock, but preserve historical movements
    const updatedProducts = products.filter((p) => p.id !== productId);
    setProducts(updatedProducts);
    addToast('✓ Article supprimé', 'info');
  };

  // 5. PRO ACTIVATION
  const handleActivatePro = () => {
    setIsPro(true);
    addToast('✓ QuincaStock PRO activé', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        isPro={isPro}
        productCount={products.length}
        onOpenPro={() => setIsProModalOpen(true)}
        onNavigateContact={() => setActiveTab('contact')}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPro={isPro}
        lowStockAlertCount={lowStockAlertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            movements={movements}
            isPro={isPro}
            onOpenEntree={() => setIsEntreeModalOpen(true)}
            onOpenSortie={() => setIsSortieModalOpen(true)}
            onOpenPro={() => setIsProModalOpen(true)}
            onNavigateStock={() => setActiveTab('stock')}
            onNavigateMovements={() => setActiveTab('movements')}
          />
        )}

        {activeTab === 'stock' && (
          <StockTable
            products={products}
            onOpenEntree={() => setIsEntreeModalOpen(true)}
            onEditPrice={(product) => setEditingPriceProduct(product)}
            onDeleteProduct={(product) => setDeletingProduct(product)}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsTable movements={movements} />
        )}

        {activeTab === 'pro' && (
          <ProSection
            isPro={isPro}
            productCount={products.length}
            onActivateSuccess={handleActivatePro}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'contact' && <ContactSection />}
      </main>

      {/* Footer */}
      <Footer
        onOpenPro={() => setIsProModalOpen(true)}
        onNavigateContact={() => setActiveTab('contact')}
      />

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Modals */}
      <ModalEntreeStock
        isOpen={isEntreeModalOpen}
        onClose={() => setIsEntreeModalOpen(false)}
        products={products}
        isPro={isPro}
        onSaveEntree={handleSaveEntree}
        onTriggerProModal={() => setIsProModalOpen(true)}
      />

      <ModalSortieStock
        isOpen={isSortieModalOpen}
        onClose={() => setIsSortieModalOpen(false)}
        products={products}
        onSaveSortie={handleSaveSortie}
      />

      <ModalModifierPrix
        isOpen={editingPriceProduct !== null}
        onClose={() => setEditingPriceProduct(null)}
        product={editingPriceProduct}
        onSaveNewPrice={handleSaveNewPrice}
      />

      <ModalConfirmDelete
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
        onConfirmDelete={handleConfirmDelete}
      />

      <ModalProUpgrade
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onActivateSuccess={handleActivatePro}
        onShowToast={addToast}
      />
    </div>
  );
}
