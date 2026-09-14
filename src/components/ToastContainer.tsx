import React from 'react';
import { Toast } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-gray-900 text-white border-gray-800';
        let Icon = CheckCircle2;
        let iconColor = 'text-emerald-400';

        if (toast.type === 'success') {
          bg = 'bg-gray-900 text-white border-emerald-500/50';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          bg = 'bg-red-900 text-white border-red-700';
          Icon = AlertCircle;
          iconColor = 'text-red-300';
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-900 text-white border-amber-700';
          Icon = AlertTriangle;
          iconColor = 'text-amber-300';
        } else {
          bg = 'bg-gray-900 text-white border-gray-700';
          Icon = Info;
          iconColor = 'text-blue-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-3 ${bg}`}
          >
            <div className="flex items-center space-x-3 pr-2">
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
              <p className="text-sm font-bold tracking-wide">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
