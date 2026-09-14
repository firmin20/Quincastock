import { Product, Movement } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'quinca_products',
  MOVEMENTS: 'quinca_movements',
  IS_PRO: 'quinca_paye',
  SETTINGS: 'quinca_settings',
};

const INITIAL_SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Ciment Dangote 32.5',
    category: 'Ciment',
    unitPrice: 4800,
    quantity: 25,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Fer à béton 8mm',
    category: 'Fer',
    unitPrice: 2750,
    quantity: 35,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Tuyau PVC Pression Ø32',
    category: 'Plomberie',
    unitPrice: 3200,
    quantity: 3, // Stock faible for demo
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

const INITIAL_SAMPLE_MOVEMENTS: Movement[] = [
  {
    id: 'mov-1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    type: 'ACHAT',
    productName: 'Ciment Dangote 32.5',
    productId: 'prod-1',
    quantity: 30,
    stockAfter: 30,
    unitPrice: 4800,
  },
  {
    id: 'mov-2',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
    type: 'VENTE',
    productName: 'Ciment Dangote 32.5',
    productId: 'prod-1',
    quantity: 5,
    stockAfter: 25,
    unitPrice: 4800,
  },
  {
    id: 'mov-3',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'ACHAT',
    productName: 'Fer à béton 8mm',
    productId: 'prod-2',
    quantity: 35,
    stockAfter: 35,
    unitPrice: 2750,
  },
  {
    id: 'mov-4',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'ACHAT',
    productName: 'Tuyau PVC Pression Ø32',
    productId: 'prod-3',
    quantity: 3,
    stockAfter: 3,
    unitPrice: 3200,
  }
];

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      // First time initialization with standard starter data
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_SAMPLE_PRODUCTS));
      return INITIAL_SAMPLE_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Erreur lecture quinca_products:', error);
    return [];
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (error) {
    console.error('Erreur sauvegarde quinca_products:', error);
  }
}

export function getStoredMovements(): Movement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_SAMPLE_MOVEMENTS));
      return INITIAL_SAMPLE_MOVEMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Erreur lecture quinca_movements:', error);
    return [];
  }
}

export function saveStoredMovements(movements: Movement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  } catch (error) {
    console.error('Erreur sauvegarde quinca_movements:', error);
  }
}

export function getStoredIsPro(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.IS_PRO) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredIsPro(isPro: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IS_PRO, isPro ? 'true' : 'false');
  } catch (error) {
    console.error('Erreur sauvegarde quinca_paye:', error);
  }
}
