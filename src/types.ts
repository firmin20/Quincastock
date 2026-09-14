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
  userId?: string;
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
  userId?: string;
  timestamp: string; // ISO string
  type: MovementType;
  productName: string;
  productId?: string;
  quantity: number;
  stockAfter: number;
  unitPrice?: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  isPro: boolean;
  createdAt: string;
}

export interface ProCodeRecord {
  id: string;
  code: string;
  isUsed: boolean;
  usedBy?: string | null;
  usedAt?: string | null;
  createdAt: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export type ActiveTab = 'dashboard' | 'stock' | 'movements' | 'profile' | 'pro' | 'contact';

export type AuthView = 'login' | 'register' | 'forgot_password' | 'reset_password';
