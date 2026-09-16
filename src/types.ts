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
  role?: 'user' | 'admin';
  proActivatedAt?: string | null;
  proCodeUsed?: string | null;
  lastActivityAt?: string | null;
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

export interface AdminClient {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  isPro: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  proActivatedAt?: string | null;
  proCodeUsed?: string | null;
  lastActivityAt?: string | null;
  productCount?: number;
  totalStockValue?: number;
  entryCount?: number;
  saleCount?: number;
}

export interface AdminActivationRecord {
  id: string;
  userId?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  code: string;
  activatedAt: string;
  createdAt?: string;
  status: string;
}

export interface AdminActivityEvent {
  id: string;
  type: 'INSCRIPTION' | 'ACTIVATION_PRO' | 'PRODUIT_AJOUT' | 'ENTREE_STOCK' | 'VENTE';
  title: string;
  description: string;
  timestamp: string;
  userName?: string;
  businessName?: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  conversionRate: number;
  totalProducts: number;
  activeQuincailleries: number;
  totalActivations: number;
  estimatedRevenue: number;
  newUsersThisWeek: number;
}

export type AdminTab = 'dashboard' | 'clients' | 'pro_clients' | 'activations' | 'activity' | 'sql_guide';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export type ActiveTab = 'dashboard' | 'stock' | 'movements' | 'profile' | 'pro' | 'contact' | 'admin';

export type AuthView = 'login' | 'register' | 'forgot_password' | 'reset_password';
