import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ShieldCheck, 
  MessageSquare, 
  Phone, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { OWNER_CONTACT, verifyProCode } from '../utils/formatters';

interface ProSectionProps {
  isPro: boolean;
  productCount: number;
  onActivateSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ProSection: React.FC<ProSectionProps> = ({
  isPro,
  productCount,
  onActivateSuccess,
  onShowToast,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!inputCode.trim()) {
      setErrorMessage('Veuillez saisir votre code d\'activation.');
      return;
    }

    const isValid = verifyProCode(inputCode);
    if (isValid) {
      localStorage.setItem('quinca_paye', 'true');
      setSuccessMessage(true);
      onActivateSuccess();
      onShowToast('✓ QuincaStock PRO activé avec succès !', 'success');
    } else {
      setErrorMessage(
        "❌ Code invalide : Ce code PRO n'est pas reconnu. Vérifiez votre code et réessayez."
      );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero / Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Offre Spéciale Quincaillerie
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              ⭐ QuincaStock <span className="text-orange-500">PRO</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-2xl">
              Passez à la version professionnelle illimitée pour votre quincaillerie. Fini les limites, gérez tout votre commerce en toute sérénité.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[200px]">
            <div className="text-xs text-gray-400 font-bold uppercase">Statut Actuel</div>
            <div className="text-xl font-extrabold mt-1">
              {isPro ? (
                <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-5 h-5" />
                  PRO ILLIMITÉ
                </span>
              ) : (
                <span className="text-orange-400 flex items-center justify-center gap-1.5">
                  <Zap className="w-5 h-5" />
                  GRATUIT ({productCount}/5)
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {isPro ? 'Licence activée à vie' : '5 produits maximum'}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification if just activated */}
      {successMessage && (
        <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-md">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xl font-black text-emerald-900">
                🎉 Félicitations !
              </h3>
              <p className="text-base font-bold text-emerald-800 mt-1">
                QuincaStock PRO est maintenant activé.
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                Vous pouvez maintenant gérer un nombre illimité de produits pour votre quincaillerie.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid: Gratuit vs PRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GRATUIT */}
        <div className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs flex flex-col justify-between ${
          !isPro ? 'border-gray-300 ring-2 ring-gray-200' : 'border-gray-200 opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Plan Gratuit</h3>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gray-100 text-gray-700">
                0 FCFA
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Pour tester et débuter avec quelques références</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-700 font-medium">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Jusqu'à 5 produits différents</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700 font-medium">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Gestion des entrées et sorties</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700 font-medium">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Calcul automatique de la valeur du stock</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <span className="w-4 h-4 text-gray-300 text-center font-bold">✕</span>
                <span className="line-through">Produits illimités (bloqué à 5)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <span className="w-4 h-4 text-gray-300 text-center font-bold">✕</span>
                <span className="line-through">Support prioritaire WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs font-semibold text-gray-500">
            {productCount} sur 5 produits utilisés actuellement
          </div>
        </div>

        {/* PRO */}
        <div className={`bg-gradient-to-b from-orange-50/60 to-white rounded-3xl p-6 sm:p-8 border-2 shadow-lg flex flex-col justify-between relative overflow-hidden ${
          isPro ? 'border-emerald-500 ring-2 ring-emerald-400/30' : 'border-orange-500 ring-2 ring-orange-400/20'
        }`}>
          <div className="absolute top-0 right-0 bg-orange-500 text-white font-black text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-xs">
            Recommandé
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-1.5">
                🔥 QUINCASTOCK PRO
              </h3>
              <div className="text-right">
                <span className="text-2xl font-black text-orange-600">15 000 FCFA</span>
                <span className="text-xs text-gray-500 block font-bold">Paiement unique à vie</span>
              </div>
            </div>
            <p className="text-xs text-orange-950/80 mt-1 font-medium">
              Licence commerciale complète sans abonnement mensuel
            </p>

            <div className="mt-6 space-y-3.5">
              <div className="flex items-center space-x-3 text-sm text-gray-900 font-bold">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>✓ Produits illimités</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-900 font-bold">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>✓ Gestion complète du stock</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-900 font-bold">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>✓ Historique complet des mouvements</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-900 font-bold">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>✓ Export inventaire PDF & Excel (CSV)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-900 font-bold">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>✓ Utilisation à vie garantie</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-orange-100">
            {isPro ? (
              <div className="w-full py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-center text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Votre licence PRO est active
              </div>
            ) : (
              <a
                href={OWNER_CONTACT.whatsappProUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-center text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                📲 Payer / Contacter sur WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ZONE D'ACTIVATION DU CODE PRO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              🔐 Activer QuincaStock PRO
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Entrez le code d'activation reçu après paiement pour débloquer votre version illimitée.
            </p>
          </div>
        </div>

        {isPro ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Votre QuincaStock est déjà activé en version PRO illimitée.</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Voulez-vous réinitialiser le statut pour tester l'activation ?")) {
                  localStorage.removeItem('quinca_paye');
                  window.location.reload();
                }
              }}
              className="text-xs text-gray-500 hover:text-red-600 underline font-normal"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Entrez votre code PRO
                </label>
                <input
                  type="text"
                  id="pro-code-input"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Ex: QUINCA-PRO01 ou QUINCA-AF01"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base font-mono font-bold uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal"
                />
              </div>
              <div className="sm:self-end">
                <button
                  type="submit"
                  id="pro-code-submit-btn"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-2 min-h-[48px]"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Activer</span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <div className="font-bold">❌ Code invalide</div>
                  <div className="text-xs mt-0.5">
                    Ce code PRO n'est pas reconnu. Vérifiez votre code et réessayez.
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* PAIEMENT & INSTRUCTIONS MOBILE MONEY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          💳 Comment acheter votre code PRO ?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-900">
              Étape 1 : Paiement Mobile Money
            </div>
            <div className="text-sm text-gray-800">
              Envoyez <strong className="text-orange-950 font-black">15 000 FCFA</strong> par Mobile Money au numéro :
            </div>
            <div className="p-3 rounded-xl bg-white border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-bold block">MoMo / Orange Money</span>
                <span className="text-lg font-black text-gray-900 font-mono tracking-wider">
                  {OWNER_CONTACT.whatsappRaw}
                </span>
              </div>
              <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md">
                Cameroun
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Étape 2 : Réception du code
            </div>
            <div className="text-sm text-gray-800">
              "Après paiement, envoyez votre capture d'écran sur WhatsApp pour recevoir votre code PRO."
            </div>
            <a
              href={OWNER_CONTACT.whatsappProUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              📲 Payer / Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Direct Contacts Row */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-gray-600">
          <span className="font-semibold">Une question avant d'acheter ?</span>
          <div className="flex items-center space-x-4">
            <a
              href={OWNER_CONTACT.phoneUrl}
              className="inline-flex items-center text-blue-700 font-bold hover:underline"
            >
              <Phone className="w-4 h-4 mr-1" />
              Appeler ({OWNER_CONTACT.phoneDisplay})
            </a>
            <a
              href={OWNER_CONTACT.emailUrl}
              className="inline-flex items-center text-gray-700 font-bold hover:underline"
            >
              <Mail className="w-4 h-4 mr-1" />
              Email ({OWNER_CONTACT.email})
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
