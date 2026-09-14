import React from 'react';
import { LayoutDashboard, Package, ArrowLeftRight, Sparkles, HelpCircle, User } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isPro: boolean;
  lowStockAlertCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isPro,
  lowStockAlertCount,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      id: 'stock',
      label: 'Mon Stock',
      icon: Package,
      badge: lowStockAlertCount > 0 ? lowStockAlertCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'movements',
      label: 'Mouvements',
      icon: ArrowLeftRight,
    },
    {
      id: 'profile',
      label: 'Mon compte',
      icon: User,
    },
    {
      id: 'pro',
      label: isPro ? '⭐ Version PRO' : '⭐ PRO (Passer)',
      icon: Sparkles,
      badge: isPro ? 'ACTIF' : '15 000 F',
      badgeColor: isPro ? 'bg-emerald-600 text-white' : 'bg-orange-500 text-white',
    },
    {
      id: 'contact',
      label: 'Aide & Contact',
      icon: HelpCircle,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 sm:top-20 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 sm:py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
