import React from 'react';
import { 
  Menu, 
  Lock, 
  LogOut, 
  Wallet, 
  Building2, 
  ShieldCheck, 
  Globe,
  Bell
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { formatCurrency } from '../utils/formatters';
import { AccountingSummary } from '../types';

interface TopNavProps {
  onToggleMobileMenu: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLock: () => void;
  onLogoutClick: () => void;
  summary: AccountingSummary | null;
  currentUser: { username: string; name: string } | null;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMobileMenu,
  lang,
  onLanguageChange,
  onLock,
  onLogoutClick,
  summary,
  currentUser,
}) => {
  const t = translations[lang];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile trigger & Center Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center space-x-2">
            <span>{t.appName}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200/60 hidden lg:inline-block">
              {lang === 'bn' ? 'সরাসরি লাইভ খাতা' : 'Live Ledger Active'}
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Center/Right: Quick Balance Badges & Controls */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Quick Ledger Pills */}
        {summary && (
          <div className="hidden lg:flex items-center space-x-2">
            {/* Net Cash Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 shadow-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <div className="text-[11px]">
                <span className="text-emerald-600 font-semibold mr-1">{t.netCash}:</span>
                <span className="font-extrabold">{formatCurrency(summary.netCash, lang)}</span>
              </div>
            </div>

            {/* Total Bank Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-800 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <div className="text-[11px]">
                <span className="text-blue-600 font-semibold mr-1">{t.totalBank}:</span>
                <span className="font-extrabold">{formatCurrency(summary.totalBank, lang)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Language Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
          <button
            onClick={() => onLanguageChange('bn')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === 'bn'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            বাংলা
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === 'en'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            English
          </button>
        </div>

        {/* Quick Lock Button */}
        <button
          onClick={onLock}
          title={t.lockApp}
          className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition border border-slate-200/80 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            OF
          </div>
          <div className="text-left hidden xl:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.name || 'Omar Faroque'}
            </div>
            <div className="text-[10px] text-orange-600 font-semibold">
              Authorized Administrator
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
