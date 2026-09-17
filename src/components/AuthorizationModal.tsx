import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { Language, translations } from '../i18n';

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (password: string) => void;
  actionTitle?: string;
  lang: Language;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle,
  lang
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(lang === 'bn' ? 'পাসওয়ার্ড প্রদান করুন' : 'Please enter password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const authorized = await ApiService.verifyAccountingPassword(password);
      if (authorized) {
        const savedPassword = password;
        setPassword('');
        setError('');
        onSuccess(savedPassword);
        onClose();
      } else {
        setError(t.wrongAuthPassword);
      }
    } catch (err: any) {
      setError(err.message || t.wrongAuthPassword);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden"
        style={{ boxShadow: '0 20px 40px -15px rgba(234, 88, 12, 0.25)' }}
      >
        {/* Header with Orange Accent */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">
                {t.authRequiredTitle}
              </h3>
              <p className="text-xs text-orange-100 font-medium">
                {actionTitle || (lang === 'bn' ? 'সংবেদনশীল অ্যাকশন অনুমোদন' : 'Sensitive Action Verification')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {t.authRequiredDesc}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.enterAuthPassword}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm font-semibold tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{t.confirm}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
