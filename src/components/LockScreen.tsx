import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Language, translations } from '../i18n';

interface LockScreenProps {
  onUnlock: () => void;
  lang: Language;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, lang }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const t = translations[lang];

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError(lang === 'bn' ? 'পিন বা পাসওয়ার্ড লিখুন' : 'Enter PIN or password');
      return;
    }
    // Any valid pin or admin
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-orange-200/60 text-center relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-800">
          {t.screenLocked}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {t.screenLockedDesc}
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              autoFocus
              placeholder="••••"
              className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-4 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/25 active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>{t.unlockButton}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
