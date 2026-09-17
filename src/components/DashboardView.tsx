import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  AlertCircle, 
  Wallet,
  PlusCircle, 
  CreditCard, 
  Receipt, 
  Users, 
  ArrowRight,
  Tractor,
  HardHat,
  Calendar,
  Sparkles,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { AccountingSummary, Student, Course } from '../types';
import { formatCurrency, toBengaliNumber, getCurrentMonthYear } from '../utils/formatters';

interface DashboardViewProps {
  summary: AccountingSummary;
  students: Student[];
  courses: Course[];
  lang: Language;
  onOpenAddStudent: () => void;
  onOpenAddPayment: () => void;
  onOpenDuePayment?: () => void;
  onOpenAddExpense: () => void;
  onOpenStaffWithdrawal: () => void;
  onOpenBankTransaction: () => void;
  onNavigateTab: (tab: any) => void;
}

// Animated Counter Hook
function useAnimatedCounter(targetValue: number, duration: number = 800): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const difference = targetValue - startValue;

    if (difference === 0) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(startValue + difference * ease));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  return displayValue;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  students,
  courses,
  lang,
  onOpenAddStudent,
  onOpenAddPayment,
  onOpenDuePayment,
  onOpenAddExpense,
  onOpenStaffWithdrawal,
  onOpenBankTransaction,
  onNavigateTab
}) => {
  const t = translations[lang];
  const { monthNameBn, monthNameEn, year } = getCurrentMonthYear();
  const currentMonthName = lang === 'bn' ? `${monthNameBn} ${toBengaliNumber(year)}` : `${monthNameEn} ${year}`;

  // Animated numbers for the 5 mandated accounting statistics
  const animatedIncome = useAnimatedCounter(summary.totalIncome);
  const animatedExpense = useAnimatedCounter(summary.totalExpense);
  const animatedBank = useAnimatedCounter(summary.totalBank);
  const animatedDue = useAnimatedCounter(summary.totalDue);
  const animatedNetCash = useAnimatedCounter(summary.netCash);

  // Current month admissions by course
  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthStudents = students.filter(s => (s.admissionDate || '').startsWith(currentYearMonth));

  // Course wise breakdown
  const courseCounts: Record<string, number> = {};
  courses.forEach(c => {
    courseCounts[c.name] = 0;
  });

  students.forEach(s => {
    const cName = s.course || 'Other';
    courseCounts[cName] = (courseCounts[cName] || 0) + 1;
  });

  // Current month specific course counts
  const currentMonthCourseCounts: Record<string, number> = {};
  courses.forEach(c => {
    currentMonthCourseCounts[c.name] = 0;
  });
  currentMonthStudents.forEach(s => {
    const cName = s.course || 'Other';
    currentMonthCourseCounts[cName] = (currentMonthCourseCounts[cName] || 0) + 1;
  });

  // Chart data calculations
  const maxFinancialValue = Math.max(
    summary.totalIncome,
    summary.totalExpense,
    summary.totalBank,
    summary.totalDue,
    Math.max(0, summary.netCash),
    1
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 opacity-15 pointer-events-none">
          <Tractor className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3 text-orange-50 border border-white/30">
            <HardHat className="w-3.5 h-3.5 text-amber-200" />
            <span>{currentMonthName} • Live Accounting Overview</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            {t.appName}
          </h2>
          <p className="text-orange-100 text-xs md:text-sm font-medium leading-relaxed">
            {lang === 'bn' 
              ? 'বাস্তব খাতা ভিত্তিক ক্যাশ, ব্যাংক, বকেয়া এবং শিক্ষার্থী হিসাব ব্যবস্থাপনা।'
              : 'Real-time ledger management for cash, bank, receivables, and student training.'}
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS HUB */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>{t.quickActions}</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {lang === 'bn' ? 'সরাসরি এন্ট্রি করুন' : 'Click to launch instant modal'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Add Student */}
          <button
            onClick={onOpenAddStudent}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-orange-200/70 bg-gradient-to-b from-orange-50/60 to-white hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/10 transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {t.addStudent}
            </span>
          </button>

          {/* Add Payment */}
          <button
            onClick={onOpenAddPayment}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/60 to-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {t.addPayment}
            </span>
          </button>

          {/* Pay Due */}
          <button
            onClick={onOpenDuePayment || onOpenAddPayment}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 to-white hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/10 transition-all group cursor-pointer relative"
          >
            {summary.totalDue > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {lang === 'bn' ? 'বকেয়া পরিশোধ' : 'Pay Due'}
            </span>
          </button>

          {/* Add Expense */}
          <button
            onClick={onOpenAddExpense}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-rose-200/70 bg-gradient-to-b from-rose-50/60 to-white hover:border-rose-500 hover:shadow-md hover:shadow-rose-500/10 transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {t.addExpense}
            </span>
          </button>

          {/* Staff Withdrawal */}
          <button
            onClick={onOpenStaffWithdrawal}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50/60 to-white hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {t.staffWithdrawal}
            </span>
          </button>

          {/* Bank Transaction */}
          <button
            onClick={onOpenBankTransaction}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-blue-200/70 bg-gradient-to-b from-blue-50/60 to-white hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {t.bankTransaction}
            </span>
          </button>

          {/* Monthly Report */}
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-200/70 bg-gradient-to-b from-amber-50/60 to-white hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/10 transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 shadow-sm transition">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center leading-tight">
              {t.monthlyReport}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 8: 5 MANDATORY ACCOUNTING STATISTICS (No hardcoding, live calculation, animated) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            {lang === 'bn' ? 'মূল আর্থিক হিসাব পর্যালোচনা' : 'Primary Accounting Balances'}
          </h3>
          <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            {lang === 'bn' ? 'ক্যাশ-ব্যাংক পৃথকীকরণ সক্রিয়' : 'Strict Cash / Bank Segregation'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. মোট আয় (Total Income) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t.totalIncome}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrency(animatedIncome, lang)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {lang === 'bn' ? 'গৃহীত মোট ছাত্র পেমেন্ট' : 'All collected student fees'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          {/* 2. মোট ব্যয় (Total Expense) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t.totalExpense}
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrency(animatedExpense, lang)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium truncate">
              {lang === 'bn' 
                ? `অফিস + স্টাফ বেতন (${formatCurrency(summary.totalStaffWithdrawals, lang)})` 
                : `Office + Staff (${formatCurrency(summary.totalStaffWithdrawals, lang)})`}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
          </div>

          {/* 3. মোট Bank (Total Bank) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t.totalBank}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrency(animatedBank, lang)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {lang === 'bn' ? 'বর্তমান ব্যাংক লেজার ব্যালেন্স' : 'Active bank account ledger'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
          </div>

          {/* 4. মোট বকেয়া (Total Due) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t.totalDue}
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {formatCurrency(animatedDue, lang)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-slate-400 font-medium">
                {lang === 'bn' ? 'শিক্ষার্থীদের নিকট পাওনা' : 'Outstanding student dues'}
              </p>
              {summary.totalDue > 0 && (
                <button
                  onClick={onOpenDuePayment || onOpenAddPayment}
                  className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'পরিশোধ' : 'Pay Due'}</span>
                </button>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          </div>

          {/* 5. Net Cash (Net Cash) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t.netCash}
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrency(animatedNetCash, lang)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {lang === 'bn' ? 'হাতে নগদ তরল ক্যাশ' : 'Cash in hand / Drawer cash'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
          </div>
        </div>
      </div>

      {/* SECTION 17: STUDENT COUNTERS BY COURSE (Live for current month) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{t.currentMonthAdmissionsByCourse}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {currentMonthName} ({lang === 'bn' ? 'চলতি মাসে মোট ভর্তি:' : 'Total enrolled this month:'} {currentMonthStudents.length})
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('students')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'সকল শিক্ষার্থী দেখুন' : 'View all students'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {courses.map((course) => {
            const count = currentMonthCourseCounts[course.name] || 0;
            const totalCount = courseCounts[course.name] || 0;
            return (
              <div 
                key={course.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-orange-50/50 hover:border-orange-300 transition text-center"
              >
                <div className="text-xs font-bold text-slate-700 truncate mb-1">
                  {course.name}
                </div>
                <div className="text-2xl font-black text-orange-600 leading-none my-1">
                  {lang === 'bn' ? toBengaliNumber(count) : count}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {lang === 'bn' ? 'সর্বমোট' : 'Total'}: {lang === 'bn' ? toBengaliNumber(totalCount) : totalCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 12: CHARTS (Depth Financial Chart + Course Doughnut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Flow Depth Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-orange-500" />
                <span>{t.financialLedgerChart}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'আয়, ব্যয়, ব্যাংক ও ক্যাশ তুলনামূলক অবস্থান' : 'Live balance distribution comparison'}
              </p>
            </div>
          </div>

          {/* SVG 3D-Style Depth Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between px-4 pt-6 pb-2 border-b border-slate-100">
            {[
              { label: t.totalIncome, val: summary.totalIncome, color: 'from-emerald-600 to-emerald-400', barBg: 'bg-emerald-500' },
              { label: t.totalExpense, val: summary.totalExpense, color: 'from-rose-600 to-rose-400', barBg: 'bg-rose-500' },
              { label: t.totalBank, val: summary.totalBank, color: 'from-blue-600 to-blue-400', barBg: 'bg-blue-500' },
              { label: t.netCash, val: summary.netCash, color: 'from-orange-600 to-amber-500', barBg: 'bg-orange-500' },
              { label: t.totalDue, val: summary.totalDue, color: 'from-amber-600 to-yellow-400', barBg: 'bg-amber-500' },
            ].map((item, idx) => {
              const heightPercent = Math.max(8, Math.min(100, Math.round((Math.max(0, item.val) / maxFinancialValue) * 100)));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center max-w-[64px] mx-1 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 mb-1 opacity-90 group-hover:opacity-100 group-hover:text-orange-600 transition">
                    ৳{Math.round(item.val / 1000)}k
                  </div>
                  <div className="w-full relative flex items-end justify-center" style={{ height: `${heightPercent}%` }}>
                    {/* Bar Cylinder with Depth */}
                    <div className={`w-full rounded-t-xl bg-gradient-to-t ${item.color} shadow-md transition-all duration-500 group-hover:brightness-110 relative`} style={{ height: '100%' }}>
                      {/* Top rim highlight */}
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-white/40 rounded-t-xl" />
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-slate-600 text-center truncate w-full">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{t.totalIncome}: {formatCurrency(summary.totalIncome, lang)}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>{t.totalBank}: {formatCurrency(summary.totalBank, lang)}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>{t.netCash}: {formatCurrency(summary.netCash, lang)}</span>
            </span>
          </div>
        </div>

        {/* Course Doughnut/Ratio Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-orange-500" />
              <span>{t.courseDistributionChart}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'bn' ? 'সকল শিক্ষার্থীর কোর্স অনুপাত' : 'Overall student enrollment distribution'}
            </p>
          </div>

          {/* Clean Visual Distribution */}
          <div className="space-y-2.5 my-2">
            {courses.slice(0, 6).map((course, idx) => {
              const count = courseCounts[course.name] || 0;
              const percent = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
              const colors = [
                'bg-orange-500', 
                'bg-amber-500', 
                'bg-blue-500', 
                'bg-emerald-500', 
                'bg-indigo-500', 
                'bg-rose-500'
              ];
              const color = colors[idx % colors.length];

              return (
                <div key={course.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{course.name}</span>
                    <span className="text-slate-500">
                      {lang === 'bn' ? toBengaliNumber(count) : count} {lang === 'bn' ? 'জন' : 'students'} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'bn' ? 'মোট নিবন্ধিত শিক্ষার্থী:' : 'Total Registered:'}</span>
            <span className="font-extrabold text-slate-800">{students.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
