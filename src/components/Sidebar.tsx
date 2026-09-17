import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CreditCard,
  TrendingUp,
  Receipt,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  Settings,
  Lock,
  LogOut,
  X,
  HardHat,
  Tractor
} from 'lucide-react';
import { Language, translations } from '../i18n';

export type NavTab = 
  | 'dashboard' 
  | 'students' 
  | 'payments' 
  | 'income' 
  | 'expenses' 
  | 'staff' 
  | 'bank' 
  | 'monthly' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lang: Language;
  onLock: () => void;
  onLogoutClick: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  studentCount?: number;
  dueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  lang,
  onLock,
  onLogoutClick,
  mobileOpen,
  onCloseMobile,
  studentCount = 0,
  dueCount = 0
}) => {
  const t = translations[lang];

  const menuItems = [
    { id: 'dashboard' as NavTab, label: t.navDashboard, icon: LayoutDashboard },
    { id: 'students' as NavTab, label: t.navStudents, icon: GraduationCap, badge: studentCount > 0 ? String(studentCount) : undefined },
    { id: 'payments' as NavTab, label: t.navPayments, icon: CreditCard },
    { id: 'staff' as NavTab, label: t.navStaff, icon: Users },
    { id: 'bank' as NavTab, label: t.navBank, icon: Building2 },
    { id: 'monthly' as NavTab, label: t.navMonthly, icon: CalendarDays },
    { id: 'reports' as NavTab, label: t.navReports, icon: BarChart3 },
    { id: 'settings' as NavTab, label: t.navSettings, icon: Settings },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-slate-200/80 shadow-sm select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <Tractor className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-wider text-orange-600 uppercase">JONOTA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">ETC</span>
            </div>
            <h2 className="text-xs font-bold text-slate-800 truncate leading-tight">
              Equipment Training Center
            </h2>
            <p className="text-[10px] font-medium text-slate-400 truncate">
              ERP & Accounting v2.6
            </p>
          </div>
          {mobileOpen && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden ml-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {lang === 'bn' ? 'প্রধান মেনু' : 'Main Navigation'}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all text-left cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/25 translate-x-1'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-white/25 text-white' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Session & Security Actions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
        <button
          onClick={onLock}
          className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Lock className="w-4 h-4 text-slate-400" />
          <span>{t.lockApp}</span>
        </button>

        <button
          onClick={onLogoutClick}
          className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
          />
          <div className="relative w-72 h-full bg-white z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
