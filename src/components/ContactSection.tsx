import React from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  ShieldCheck, 
  HardHat, 
  FileText, 
  Smartphone,
  Info
} from 'lucide-react';
import { OWNER_CONTACT } from '../utils/formatters';

export const ContactSection: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Besoin d'aide ?
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Notre équipe est à votre disposition pour vous accompagner dans la prise en main de QuincaStock et l'optimisation de votre quincaillerie.
        </p>
      </div>

      {/* 3 Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* WhatsApp */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">WhatsApp</h3>
            <p className="text-xs text-gray-500 mt-1">Réponse rapide 7j/7</p>
            <div className="mt-4 font-mono font-bold text-emerald-800 text-sm">
              {OWNER_CONTACT.whatsappDisplay}
            </div>
          </div>
          <div className="mt-6">
            <a
              href={OWNER_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Ouvrir WhatsApp
            </a>
          </div>
        </div>

        {/* Téléphone */}
        <div className="bg-white rounded-2xl p-6 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Téléphone</h3>
            <p className="text-xs text-gray-500 mt-1">Appel direct commerçant</p>
            <div className="mt-4 font-mono font-bold text-blue-800 text-sm">
              {OWNER_CONTACT.phoneDisplay}
            </div>
          </div>
          <div className="mt-6">
            <a
              href={OWNER_CONTACT.phoneUrl}
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Appeler Maintenant
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Email</h3>
            <p className="text-xs text-gray-500 mt-1">Assistance technique</p>
            <div className="mt-4 font-mono font-bold text-gray-800 text-xs break-all">
              {OWNER_CONTACT.email}
            </div>
          </div>
          <div className="mt-6">
            <a
              href={OWNER_CONTACT.emailUrl}
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Envoyer un Email
            </a>
          </div>
        </div>
      </div>

      {/* Guide Pratique Quincaillerie */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-orange-600" />
          Conseils pour votre quincaillerie
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-1">📦 Entrée de stock (Achats)</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Dès la livraison de vos sacs de ciment ou paquets de fer, cliquez sur "+ Entrée Stock". Si l'article existe déjà, son stock s'ajoute automatiquement sans créer de doublon.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-1">💰 Sortie de stock (Ventes)</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              À chaque vente au comptoir, enregistrez la quantité. Le logiciel bloque automatiquement les ventes si le stock est insuffisant pour éviter tout stock négatif.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-1">⚠️ Alertes de rupture</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Dès qu'un article descend à 5 unités ou moins, il est marqué "Stock faible". À 0 unité, il passe en "Rupture" pour vous rappeler de commander chez le fournisseur.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-1">💾 Sauvegarde des données</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Vos données restent enregistrées localement sur votre téléphone ou ordinateur, même si vous fermez le navigateur ou redémarrez votre appareil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
