import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  MessageSquare, 
  Phone, 
  Mail, 
  KeyRound, 
  AlertCircle,
  ShieldCheck 
} from 'lucide-react';
import { OWNER_CONTACT, verifyProCode } from '../utils/formatters';

interface ModalProUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ModalProUpgrade: React.FC<ModalProUpgradeProps> = ({
  isOpen,
  onClose,
  onActivateSuccess,
  onShowToast,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Veuillez saisir votre code d\'activation.');
      return;
    }

    const isValid = verifyProCode(code);
    if (isValid) {
      localStorage.setItem('quinca_paye', 'true');
      onActivateSuccess();
      onShowToast('✓ QuincaStock PRO activé avec succès !', 'success');
      onClose();
    } else {
      setError(
        "Ce code PRO n'est pas reconnu. Vérifiez votre code et réessayez."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-gray-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚀</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Passez à QuincaStock PRO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message exact */}
        <div className="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-200">
          <p className="text-sm sm:text-base font-bold text-orange-950 leading-relaxed">
            Version gratuite limitée à 5 articles.
            <br />
            Passe en version PRO illimitée pour ta quincaillerie à 15 000 FCFA à vie.
          </p>
        </div>

        {/* PRO Offer Box */}
        <div className="mt-5 p-5 rounded-2xl bg-gray-900 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black text-white flex items-center gap-1.5">
              🔥 QUINCASTOCK PRO
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-orange-400">15 000 FCFA</span>
              <span className="text-[10px] text-gray-300 block">Paiement unique à vie</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm font-semibold text-gray-200">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>✓ Produits illimités</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>✓ Gestion complète du stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>✓ Historique des mouvements</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>✓ Export inventaire (PDF & CSV)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>✓ Utilisation à vie</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="mt-5 space-y-3">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm">
            <div className="font-bold text-gray-900 mb-1">
              Paiement Mobile Money
            </div>
            <div className="text-gray-700">
              MoMo / Orange Money : <strong className="font-mono text-base text-gray-900">{OWNER_CONTACT.whatsappRaw}</strong>
            </div>
            <p className="text-gray-600 mt-2 italic font-medium">
              "Après paiement, envoyez votre capture d'écran sur WhatsApp pour recevoir votre code PRO."
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <a
              href={OWNER_CONTACT.whatsappProUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>📲 Payer / Contacter sur WhatsApp</span>
            </a>

            <div className="flex items-center gap-2">
              <a
                href={OWNER_CONTACT.phoneUrl}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>📞 Appeler ({OWNER_CONTACT.phoneRaw})</span>
              </a>
              <a
                href={OWNER_CONTACT.emailUrl}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Toggle & Enter PRO Code */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          {!showCodeInput ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowCodeInput(true)}
                className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
              >
                🔐 Vous avez déjà votre code PRO ? Cliquez ici pour l'activer
              </button>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase text-gray-700">
                <KeyRound className="w-4 h-4 text-orange-600" />
                <span>🔐 Activer QuincaStock PRO</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  placeholder="Entrez votre code PRO..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono font-bold uppercase"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Activer
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">❌ Code invalide : </span>
                    {error}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
