import React, { useState } from 'react';
import { Wrench, Phone, MessageSquare, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';
import { OWNER_CONTACT } from '../utils/formatters';

interface HeaderProps {
  isPro: boolean;
  productCount: number;
  onOpenPro: () => void;
  onNavigateContact: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPro,
  productCount,
  onOpenPro,
  onNavigateContact,
}) => {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30 text-white flex-shrink-0">
              <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-white">
                  QUINCA<span className="text-orange-500">STOCK</span>
                </span>
                {isPro ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PRO
                  </span>
                ) : (
                  <button
                    onClick={onOpenPro}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-800 text-orange-400 border border-orange-500/40 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
                    title="Passez à la version PRO illimitée"
                  >
                    GRATUIT ({productCount}/5)
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">
                Gestion Quincaillerie Pro
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {!isPro && (
              <button
                id="header-upgrade-btn"
                onClick={onOpenPro}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Passer en PRO
              </button>
            )}

            {/* CONTACT Button */}
            <div className="relative">
              <button
                id="header-contact-btn"
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer shadow-sm"
              >
                <Phone className="w-4 h-4 mr-1.5 text-orange-500" />
                CONTACT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact Popup/Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Coordonnées du support</h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-3 mb-4">
              Pour toute assistance, activation de code PRO ou question pour votre quincaillerie :
            </p>

            <div className="space-y-3">
              {/* WhatsApp */}
              <a
                href={OWNER_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs text-emerald-600 font-bold uppercase">WhatsApp</div>
                    <div className="text-sm font-semibold">{OWNER_CONTACT.whatsappDisplay}</div>
                  </div>
                </div>
                <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full font-bold">
                  Écrire
                </span>
              </a>

              {/* Call Phone */}
              <a
                href={OWNER_CONTACT.phoneUrl}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-medium transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-600 font-bold uppercase">Téléphone</div>
                    <div className="text-sm font-semibold">{OWNER_CONTACT.phoneDisplay}</div>
                  </div>
                </div>
                <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold">
                  Appeler
                </span>
              </a>

              {/* Email */}
              <a
                href={OWNER_CONTACT.emailUrl}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-medium transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase">Email direct</div>
                    <div className="text-sm font-semibold">{OWNER_CONTACT.email}</div>
                  </div>
                </div>
                <span className="text-xs bg-gray-700 text-white px-2.5 py-1 rounded-full font-bold">
                  Envoyer
                </span>
              </a>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowContactModal(false);
                  onNavigateContact();
                }}
                className="text-xs text-orange-600 font-bold hover:underline"
              >
                Voir la page d'aide complète →
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
