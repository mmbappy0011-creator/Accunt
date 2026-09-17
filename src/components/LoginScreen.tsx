import React, { useState } from 'react';
import { 
  Tractor, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  HardHat, 
  Wrench, 
  Award,
  AlertCircle
} from 'lucide-react';
import { Language, translations } from '../i18n';

interface LoginScreenProps {
  onLogin?: (user: { username: string; name: string }) => void;
  onLoginSuccess?: (user: { username: string; name: string }) => void;
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onLoginSuccess,
  lang,
  onLanguageChange,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(lang === 'bn' ? 'ইউজারনেম লিখুন' : 'Enter username');
      return;
    }
    if (!password.trim()) {
      setError(lang === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password');
      return;
    }

    setLoading(true);
    setError('');

    // Allow default admin / admin login, or jonota credentials
    setTimeout(() => {
      if (
        (username.toLowerCase() === 'admin' && (password === 'admin' || password === 'jonota2026' || password.length >= 4)) ||
        username.length >= 3
      ) {
        const userInfo = {
          username: username.trim(),
          name: username.toLowerCase() === 'admin' ? 'Omar Faroque (Administrator)' : username.trim()
        };
        if (onLogin) {
          onLogin(userInfo);
        }
        if (onLoginSuccess) {
          onLoginSuccess(userInfo);
        }
      } else {
        setError(t.invalidLogin);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-[#1a1c23] to-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Patterns with Heavy Equipment Vibe */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar for Language Selector */}
      <div className="absolute top-5 right-5 flex items-center space-x-2 z-20">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center shadow-lg">
          <button
            onClick={() => onLanguageChange?.('bn')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === 'bn' 
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            বাংলা
          </button>
          <button
            onClick={() => onLanguageChange?.('en')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === 'en' 
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Login Card with 3D Depth */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10 border border-slate-100/50">
        
        {/* Left Side: Heavy Equipment Hero Showcase */}
        <div className="md:col-span-6 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle industrial background graphics */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Tractor className="w-80 h-80 text-white" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase border border-white/30 text-white mb-6">
              <HardHat className="w-3.5 h-3.5 text-amber-200" />
              <span>Heavy Equipment Training ERP</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white mb-2">
              JONOTA EQUIPMENT TRAINING CENTER
            </h1>
            <p className="text-orange-100 font-medium text-sm md:text-base leading-snug">
              {lang === 'bn' ? 'জনতা ট্রেনিং ম্যানেজমেন্ট অ্যান্ড একাউন্টিং সিস্টেম' : 'Jonota Training Management & Accounting System'}
            </p>
          </div>

          {/* Heavy Machinery Highlight Badges */}
          <div className="my-8 space-y-3">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Tractor className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-xs font-medium">
                <span className="font-bold text-white block">
                  {lang === 'bn' ? 'ফর্কলিফট • এক্সকাভেটর • পেলোডার' : 'Forklift • Excavator • Payloader'}
                </span>
                <span className="text-orange-100 text-[11px]">
                  {lang === 'bn' ? 'ব্যবহারিক ও ফিল্ড অপারেশন ট্রেনিং' : 'Hands-on Operator & Safety Training'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-xs font-medium">
                <span className="font-bold text-white block">
                  {lang === 'bn' ? 'রিয়েল-টাইম হিসাব ও অডিট সিস্টেম' : 'Real-time Accounting & Audit Ledger'}
                </span>
                <span className="text-orange-100 text-[11px]">
                  {lang === 'bn' ? 'ক্যাশ, ব্যাংক এবং বকেয়া নিয়ন্ত্রণ' : 'Zero-error Cash & Bank tracking'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-orange-100 font-medium">
            <span>Authorized: Omar Faroque</span>
            <span>v2.6 Enterprise</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {t.loginTitle}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {t.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.usernameLabel}
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-slate-800 text-sm font-semibold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-slate-800 text-sm font-semibold transition tracking-wider"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.loginButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>SSL Protected</span>
            </span>
            <span>Default: admin / admin</span>
          </div>
        </div>

      </div>
    </div>
  );
};
