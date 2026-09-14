import React from 'react';
import { Wrench, Phone, MessageSquare, Mail, Sparkles } from 'lucide-react';
import { OWNER_CONTACT } from '../utils/formatters';

interface FooterProps {
  onOpenPro: () => void;
  onNavigateContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPro, onNavigateContact }) => {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800">
          {/* Brand */}
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-xl tracking-wider">
                QUINCA<span className="text-orange-500">STOCK</span>
              </div>
              <div className="text-xs text-gray-400 font-medium">
                Gestion Quincaillerie Pro
              </div>
            </div>
          </div>

          {/* Slogan */}
          <div className="text-center">
            <p className="text-base sm:text-lg font-bold text-gray-200 italic">
              « Gestion simple. Stock maîtrisé. »
            </p>
          </div>

          {/* Quick contact links */}
          <div className="flex items-center space-x-3">
            <a
              href={OWNER_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-emerald-600 text-gray-300 hover:text-white transition-colors"
              title="WhatsApp Support"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <a
              href={OWNER_CONTACT.phoneUrl}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
              title="Téléphone"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a
              href={OWNER_CONTACT.emailUrl}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Email direct"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <div className="flex items-center gap-2">
            <span>© 2026 QuincaStock • Version 2 SaaS Cloud</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Sauvegarde Cloud Active
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenPro}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              ⭐ Formule PRO
            </button>
            <span>•</span>
            <button
              onClick={onNavigateContact}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Support & Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
