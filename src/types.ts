export type Category = 
  | 'Ciment'
  | 'Fer'
  | 'Plomberie'
  | 'Électricité'
  | 'Peinture'
  | 'Outillage'
  | 'Quincaillerie'
  | 'Autre';

export const CATEGORIES: Category[] = [
  'Ciment',
  'Fer',
  'Plomberie',
  'Électricité',
  'Peinture',
  'Outillage',
  'Quincaillerie',
  'Autre'
];

export interface Product {
  id: string;
  name: string;
  category: Category;
  unitPrice: number; // in FCFA
  quantity: number; // integer >= 0
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ACHAT' | 'VENTE';

export interface Movement {
  id: string;
  timestamp: string; // ISO string
  type: MovementType;
  productName: string;
  productId?: string;
  quantity: number;
  stockAfter: number;
  unitPrice?: number;
  notes?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export type ActiveTab = 'dashboard' | 'stock' | 'movements' | 'pro' | 'contact';
