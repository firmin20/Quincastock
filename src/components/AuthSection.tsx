import React, { useState } from 'react';
import { 
  Wrench, 
  Lock, 
  Mail, 
  Building2, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Database
} from 'lucide-react';
import { AuthView, UserProfile } from '../types';
import { cloudService } from '../services/cloudService';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseSetupBanner } from './SupabaseSetupBanner';

interface AuthSectionProps {
  onAuthSuccess: (user: { id: string; email: string; profile: UserProfile }) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  onAuthSuccess,
  onShowToast,
}) => {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign in submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const res = await cloudService.signIn(email, password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onShowToast('Bienvenue sur QuincaStock 👋', 'success');
      } else {
        setErrorMessage(res.error || 'Identifiants invalides.');
      }
    } catch {
      setErrorMessage('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Sign up submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!businessName.trim()) {
      setErrorMessage('Veuillez entrer le nom de votre quincaillerie.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Veuillez entrer le nom du responsable.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await cloudService.signUp({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });

      if (res.success && res.user && !res.needsEmailConfirmation) {
        onAuthSuccess(res.user);
        onShowToast('Compte créé avec succès ! Sauvegarde cloud activée.', 'success');
      } else if (res.success && res.needsEmailConfirmation) {
        setSuccessMessage(
          res.message ||
            'Compte créé dans Supabase ! Veuillez vérifier votre boîte e-mail pour confirmer votre compte (ou désactivez "Confirm email" dans Supabase pour connexion directe).'
        );
        setView('login');
      } else {
        setErrorMessage(res.error || 'Erreur lors de la création du compte.');
      }
    } catch {
      setErrorMessage('Une erreur est survenue lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Veuillez entrer votre adresse e-mail pour recevoir le lien.');
      return;
    }

    setLoading(true);
    try {
      const res = await cloudService.resetPassword(email);
      if (res.success) {
        setSuccessMessage('Un lien de récupération a été envoyé à votre adresse e-mail.');
      } else {
        setErrorMessage(res.message || 'Impossible d\'envoyer le lien de récupération.');
      }
    } catch {
      setErrorMessage('Erreur lors de l\'envoi du lien.');
    } finally {
      setLoading(false);
    }
  };

  const isLiveCloud = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-600/30 mb-3">
          <Wrench className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black tracking-wider text-gray-900">
          QUINCA<span className="text-orange-600">STOCK</span>
        </h1>
        <p className="text-sm font-semibold text-gray-600 mt-1">
          Gestion Quincaillerie Pro • Version 2 SaaS Cloud
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 border border-emerald-200 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sauvegarde Cloud Sécurisée & Récupération Mobile</span>
        </div>
      </div>

      {/* Supabase Status Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg mb-6">
        <SupabaseSetupBanner />
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
          {/* Mode Switcher Buttons */}
          <div className="flex border-b border-gray-200 mb-6 pb-2">
            <button
              type="button"
              onClick={() => {
                setView('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 pb-2 text-center text-sm font-black transition-colors cursor-pointer border-b-2 ${
                view === 'login'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setView('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 pb-2 text-center text-sm font-black transition-colors cursor-pointer border-b-2 ${
                view === 'register'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Créer mon compte
            </button>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-bold flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW 1: CONNEXION */}
          {/* ==================================================== */}
          {view === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  Connexion à QuincaStock
                </h2>
                <p className="text-xs text-gray-500 font-medium mb-4">
                  Retrouvez votre stock, vos achats et vos ventes sauvegardés.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Adresse e-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="quincaillerie@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot_password');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Connexion en cours...</span>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setErrorMessage('');
                    }}
                    className="text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    Créer un compte
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* VIEW 2: CRÉER MON COMPTE */}
          {/* ==================================================== */}
          {view === 'register' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  Créer mon compte
                </h2>
                <p className="text-xs text-gray-500 font-medium mb-3">
                  Sauvegardez vos stocks en ligne et retrouvez-les sur n'importe quel appareil.
                </p>
              </div>

              {/* Nom de la quincaillerie */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nom de la quincaillerie <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="register-business-input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Quincaillerie de la Paix"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Nom du responsable */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nom du responsable <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="register-owner-input"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex: Firmin Tela"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="register-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 696019303"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Adresse e-mail */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Adresse e-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="register-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre-email@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="register-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 caract."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Confirmation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="register-confirm-password-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="register-submit-btn"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Création du compte...</span>
                  ) : (
                    <>
                      <span>Créer mon compte</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  Déjà inscrit ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setErrorMessage('');
                    }}
                    className="text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* VIEW 3: MOT DE PASSE OUBLIÉ */}
          {/* ==================================================== */}
          {view === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  Mot de passe oublié
                </h2>
                <p className="text-xs text-gray-500 font-medium mb-4">
                  Saisissez votre adresse e-mail pour recevoir un lien sécurisé de réinitialisation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Adresse e-mail de votre compte <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="forgot-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre-email@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="forgot-submit-btn"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Envoi du lien...' : 'Envoyer le lien de récupération'}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-gray-600 hover:text-orange-600 font-bold transition-colors cursor-pointer"
                >
                  ← Retour à la page de connexion
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Cloud feature badges */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">
            Protégez les données de votre quincaillerie contre les vols et pertes de téléphone.
          </p>
          <p>
            Données chiffrées & isolées par quincaillerie avec Row Level Security.
          </p>
        </div>
      </div>
    </div>
  );
};
