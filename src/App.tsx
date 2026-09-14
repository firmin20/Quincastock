import React, { useState, useEffect, useCallback } from 'react';
import { Product, Movement, Category, Toast, ActiveTab, UserProfile } from './types';
import { cloudService } from './services/cloudService';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { StockTable } from './components/StockTable';
import { MovementsTable } from './components/MovementsTable';
import { ProfileSection } from './components/ProfileSection';
import { ProSection } from './components/ProSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AuthSection } from './components/AuthSection';
import { DataMigrationBanner } from './components/DataMigrationBanner';
import { ModalEntreeStock } from './components/ModalEntreeStock';
import { ModalSortieStock } from './components/ModalSortieStock';
import { ModalModifierPrix } from './components/ModalModifierPrix';
import { ModalConfirmDelete } from './components/ModalConfirmDelete';
import { ModalProUpgrade } from './components/ModalProUpgrade';
import { ToastContainer } from './components/ToastContainer';
import { Wrench } from 'lucide-react';

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    profile: UserProfile;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Application Business State
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dataLoading, setDataLoading] = useState(false);

  // Modal States
  const [isEntreeModalOpen, setIsEntreeModalOpen] = useState(false);
  const [isSortieModalOpen, setIsSortieModalOpen] = useState(false);
  const [editingPriceProduct, setEditingPriceProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Check Session on initial mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionRes = await cloudService.getCurrentSessionUser();
        if (sessionRes?.success && sessionRes.user) {
          setCurrentUser(sessionRes.user);
        }
      } catch (err) {
        console.error('Erreur vérification session:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  // 2. Load Products and Movements from Cloud whenever user logs in
  const refreshUserData = useCallback(async (userId: string) => {
    setDataLoading(true);
    try {
      const [cloudProducts, cloudMovements] = await Promise.all([
        cloudService.fetchProducts(userId),
        cloudService.fetchMovements(userId),
      ]);
      setProducts(cloudProducts);
      setMovements(cloudMovements);
    } catch (err) {
      console.error('Erreur chargement données cloud:', err);
      addToast('Erreur de synchronisation avec le cloud.', 'error');
    } finally {
      setDataLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshUserData(currentUser.id);
    } else {
      setProducts([]);
      setMovements([]);
    }
  }, [currentUser?.id, refreshUserData]);

  // Status is PRO
  const isPro = Boolean(currentUser?.profile?.isPro);

  // Low stock count for navigation badge
  const lowStockAlertCount = products.filter((p) => p.quantity <= 5).length;

  // ----------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ----------------------------------------------------
  const handleAuthSuccess = (user: { id: string; email: string; profile: UserProfile }) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleSignOut = async () => {
    await cloudService.signOut();
    setCurrentUser(null);
    setProducts([]);
    setMovements([]);
    setActiveTab('dashboard');
    addToast('Vous avez été déconnecté avec succès.', 'info');
  };

  // ----------------------------------------------------
  // 1. ENTRÉE DE STOCK (ACHAT)
  // ----------------------------------------------------
  const handleSaveEntree = async (
    name: string,
    category: Category,
    unitPrice: number,
    quantity: number
  ) => {
    if (!currentUser) return;

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
        userId: currentUser.id,
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
        userId: currentUser.id,
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
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      type: 'ACHAT',
      productName: targetProduct.name,
      productId: targetProduct.id,
      quantity,
      stockAfter,
      unitPrice: targetProduct.unitPrice,
    };

    // Optimistic UI update
    setProducts(updatedProducts);
    setMovements([newMovement, ...movements]);
    addToast('✓ Produit ajouté au stock (synchronisé au cloud)', 'success');

    // Cloud persistence
    await cloudService.saveProduct(currentUser.id, targetProduct);
    await cloudService.saveMovement(currentUser.id, newMovement);
  };

  // ----------------------------------------------------
  // 2. SORTIE DE STOCK (VENTE)
  // ----------------------------------------------------
  const handleSaveSortie = async (productId: string, quantity: number) => {
    if (!currentUser) return;

    const target = products.find((p) => p.id === productId);
    if (!target) return;

    // Safety check: Cannot exceed stock
    if (quantity > target.quantity) {
      addToast('❌ Stock insuffisant pour cette vente', 'error');
      return;
    }

    const newStock = target.quantity - quantity;
    const updatedProduct: Product = {
      ...target,
      userId: currentUser.id,
      quantity: newStock,
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) => (p.id === productId ? updatedProduct : p));

    // Create Movement: VENTE
    const newMovement: Movement = {
      id: 'mov-' + Date.now(),
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      type: 'VENTE',
      productName: target.name,
      productId: target.id,
      quantity,
      stockAfter: newStock,
      unitPrice: target.unitPrice,
    };

    // Optimistic UI update
    setProducts(updatedProducts);
    setMovements([newMovement, ...movements]);
    addToast('✓ Vente enregistrée (synchronisée au cloud)', 'success');

    // Cloud persistence
    await cloudService.saveProduct(currentUser.id, updatedProduct);
    await cloudService.saveMovement(currentUser.id, newMovement);
  };

  // ----------------------------------------------------
  // 3. MODIFIER PRIX
  // ----------------------------------------------------
  const handleSaveNewPrice = async (productId: string, newPrice: number) => {
    if (!currentUser) return;

    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const updatedProduct: Product = {
      ...target,
      userId: currentUser.id,
      unitPrice: newPrice,
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) => (p.id === productId ? updatedProduct : p));
    setProducts(updatedProducts);
    addToast('✓ Prix modifié et sauvegardé', 'success');

    await cloudService.saveProduct(currentUser.id, updatedProduct);
  };

  // ----------------------------------------------------
  // 4. SUPPRIMER ARTICLE
  // ----------------------------------------------------
  const handleConfirmDelete = async (productId: string) => {
    if (!currentUser) return;

    const updatedProducts = products.filter((p) => p.id !== productId);
    setProducts(updatedProducts);
    addToast('✓ Article supprimé du stock', 'info');

    await cloudService.deleteProduct(currentUser.id, productId);
  };

  // ----------------------------------------------------
  // 5. PRO ACTIVATION SUCCESS
  // ----------------------------------------------------
  const handleActivateProSuccess = () => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        profile: {
          ...currentUser.profile,
          isPro: true,
        },
      });
    }
  };

  // ----------------------------------------------------
  // Loading Splash
  // ----------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-600/30 mb-4 animate-bounce">
          <Wrench className="w-9 h-9" />
        </div>
        <div className="text-white font-extrabold text-2xl tracking-wider mb-2">
          QUINCA<span className="text-orange-500">STOCK</span>
        </div>
        <p className="text-gray-400 text-sm font-medium">
          Chargement de votre espace sécurisé...
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // If user not authenticated -> Show Auth Section
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <>
        <AuthSection
          onAuthSuccess={handleAuthSuccess}
          onShowToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // ----------------------------------------------------
  // Authenticated Application
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        isPro={isPro}
        productCount={products.length}
        userProfile={currentUser.profile}
        onOpenPro={() => setIsProModalOpen(true)}
        onNavigateContact={() => setActiveTab('contact')}
        onNavigateProfile={() => setActiveTab('profile')}
        onSignOut={handleSignOut}
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
        {/* Migration banner if local data exists */}
        <DataMigrationBanner
          userId={currentUser.id}
          onMigrationComplete={() => refreshUserData(currentUser.id)}
          onShowToast={addToast}
        />

        {/* Tab 1: Dashboard */}
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

        {/* Tab 2: Mon Stock */}
        {activeTab === 'stock' && (
          <StockTable
            products={products}
            onOpenEntree={() => setIsEntreeModalOpen(true)}
            onEditPrice={(product) => setEditingPriceProduct(product)}
            onDeleteProduct={(product) => setDeletingProduct(product)}
            onShowToast={addToast}
          />
        )}

        {/* Tab 3: Mouvements */}
        {activeTab === 'movements' && (
          <MovementsTable movements={movements} />
        )}

        {/* Tab 4: Mon Compte (Profile) */}
        {activeTab === 'profile' && (
          <ProfileSection
            profile={currentUser.profile}
            productCount={products.length}
            isPro={isPro}
            onSignOut={handleSignOut}
            onOpenProModal={() => setIsProModalOpen(true)}
            onShowToast={addToast}
          />
        )}

        {/* Tab 5: Version PRO */}
        {activeTab === 'pro' && (
          <ProSection
            userId={currentUser.id}
            isPro={isPro}
            productCount={products.length}
            onActivateSuccess={handleActivateProSuccess}
            onShowToast={addToast}
          />
        )}

        {/* Tab 6: Aide & Contact */}
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
        userId={currentUser.id}
        isAlreadyPro={isPro}
        onClose={() => setIsProModalOpen(false)}
        onActivateSuccess={handleActivateProSuccess}
        onShowToast={addToast}
      />
    </div>
  );
}
