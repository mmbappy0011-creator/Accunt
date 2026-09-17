import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Share2, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Wallet, 
  AlertCircle,
  Tractor,
  HardHat,
  Filter,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language, translations } from '../i18n';
import { Student, Payment, OfficeExpense, BankTransaction, Course, AuditLog, StaffTransaction } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface ReportsViewProps {
  students: Student[];
  payments: Payment[];
  expenses: OfficeExpense[];
  bankTransactions: BankTransaction[];
  courses: Course[];
  auditLogs: AuditLog[];
  staffTransactions?: StaffTransaction[];
  lang: Language;
}

type ReportType = 
  | 'monthly' 
  | 'daily' 
  | 'due' 
  | 'course' 
  | 'income_expense' 
  | 'bank' 
  | 'audit';

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  payments,
  expenses,
  bankTransactions,
  courses,
  auditLogs,
  staffTransactions = [],
  lang,
}) => {
  const t = translations[lang];
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Filter State
  const [activeReportType, setActiveReportType] = useState<ReportType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  // Month-filtered data
  const monthlyData = useMemo(() => {
    const mStudents = students.filter(s => (s.admissionDate || '').startsWith(selectedMonth));
    const mPayments = payments.filter(p => (p.date || '').startsWith(selectedMonth));
    const mExpenses = expenses.filter(e => (e.date || '').startsWith(selectedMonth));
    const mBankTx = bankTransactions.filter(b => (b.date || '').startsWith(selectedMonth));
    const mStaffTx = staffTransactions.filter(st => (st.date || '').startsWith(selectedMonth) || st.month === selectedMonth);

    const totalIncome = mPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOfficeExpense = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalStaffPayouts = mStaffTx.reduce((sum, st) => sum + st.amount, 0);
    const totalExpense = totalOfficeExpense + totalStaffPayouts;
    const netCash = totalIncome - totalExpense;

    const totalDue = mStudents.reduce((sum, s) => sum + s.remainingDue, 0);

    const bankDeposits = mBankTx.filter(b => b.type === 'Deposit').reduce((sum, b) => sum + b.amount, 0);
    const bankWithdrawals = mBankTx.filter(b => b.type !== 'Deposit').reduce((sum, b) => sum + b.amount, 0);
    const netBankFlow = bankDeposits - bankWithdrawals;

    // Course counts for this month
    const courseCounts: Record<string, number> = {};
    courses.forEach(c => courseCounts[c.name] = 0);
    mStudents.forEach(s => {
      courseCounts[s.course] = (courseCounts[s.course] || 0) + 1;
    });

    return {
      students: mStudents,
      payments: mPayments,
      expenses: mExpenses,
      staffTx: mStaffTx,
      totalIncome,
      totalOfficeExpense,
      totalExpense,
      totalStaffPayouts,
      netCash,
      totalDue,
      netBankFlow,
      courseCounts,
      isProfit: netCash >= 0,
    };
  }, [students, payments, expenses, bankTransactions, staffTransactions, courses, selectedMonth]);

  // Daily Data
  const dailyData = useMemo(() => {
    const dPayments = payments.filter(p => p.date === selectedDate);
    const dExpenses = expenses.filter(e => e.date === selectedDate);
    const dStaffTx = staffTransactions.filter(st => st.date === selectedDate);
    const dStudents = students.filter(s => s.admissionDate === selectedDate);
    const dIncome = dPayments.reduce((sum, p) => sum + p.amount, 0);
    const dOfficeExpense = dExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dStaffPayout = dStaffTx.reduce((sum, st) => sum + st.amount, 0);
    const dExpense = dOfficeExpense + dStaffPayout;

    return {
      payments: dPayments,
      expenses: dExpenses,
      staffTx: dStaffTx,
      students: dStudents,
      income: dIncome,
      officeExpense: dOfficeExpense,
      staffPayout: dStaffPayout,
      expense: dExpense,
      net: dIncome - dExpense,
    };
  }, [payments, expenses, staffTransactions, students, selectedDate]);

  // Due List data
  const dueStudents = useMemo(() => {
    return students
      .filter(s => s.remainingDue > 0)
      .sort((a, b) => b.remainingDue - a.remainingDue);
  }, [students]);

  const totalOutstandingDue = useMemo(() => {
    return dueStudents.reduce((sum, s) => sum + s.remainingDue, 0);
  }, [dueStudents]);

  // JPG Report Export via html2canvas
  const handleDownloadJpg = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Jonota_${activeReportType}_Report_${selectedMonth}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Report export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Control Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <span>{t.navReports}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'মাসিক ও দৈনিক সমন্বিত অডিট ও আর্থিক প্রতিবেদন' : 'Official institutional reports, audit trail & high-res JPG export'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download JPG Report */}
          <button
            onClick={handleDownloadJpg}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : t.downloadReportJpg}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Tabs & Period Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        {/* Report Type Selector */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'monthly' as ReportType, label: t.monthlyReport, icon: CalendarDays },
            { id: 'daily' as ReportType, label: t.dailyReport, icon: Calendar },
            { id: 'due' as ReportType, label: t.dueListReport, icon: AlertCircle },
            { id: 'course' as ReportType, label: t.courseWiseReport, icon: Tractor },
            { id: 'income_expense' as ReportType, label: t.incomeExpenseReport, icon: TrendingUp },
            { id: 'bank' as ReportType, label: t.bankStatementReport, icon: Building2 },
            { id: 'audit' as ReportType, label: t.auditReport, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportType(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters according to Report Type */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          {activeReportType === 'monthly' && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700">{lang === 'bn' ? 'মাস নির্বাচন:' : 'Select Month:'}</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          )}

          {activeReportType === 'daily' && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700">{lang === 'bn' ? 'তারিখ নির্বাচন:' : 'Select Date:'}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          )}

          {activeReportType === 'course' && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700">{t.course}:</span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">{t.allCourses}</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* OFFICIAL REPORT CANVAS (Exported to High-Res JPG & Print) */}
      <div 
        ref={reportRef}
        className="bg-white rounded-3xl border-2 border-orange-200/90 shadow-lg p-6 md:p-8 space-y-6 relative overflow-hidden"
      >
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none">
          <Tractor className="w-[450px] h-[450px] text-orange-600" />
        </div>

        {/* Official Report Header */}
        <div className="text-center pb-6 border-b-2 border-orange-500/40 relative">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
            <HardHat className="w-3.5 h-3.5 text-orange-600" />
            <span>OFFICIAL ACCOUNTING & AUDIT REPORT</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-orange-600 uppercase tracking-tight">
            {t.appName}
          </h1>
          <h2 className="text-xs md:text-sm font-bold text-slate-700 mt-0.5">
            {lang === 'bn' ? 'জনতা ইকুইপমেন্ট ট্রেনিং সেন্টার' : 'Jonota Equipment Training Center'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Dhaka-Chittagong Highway, Siddhirganj, Narayanganj • Mobile: 01711-000000
          </p>

          <div className="mt-4 inline-block px-4 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 font-bold text-xs">
            {activeReportType === 'monthly' && `${t.monthlyReport}: ${selectedMonth}`}
            {activeReportType === 'daily' && `${t.dailyReport}: ${formatDate(selectedDate, lang)}`}
            {activeReportType === 'due' && `${t.dueListReport} (${lang === 'bn' ? 'মোট বকেয়া তালিকা' : 'Active Due Registry'})`}
            {activeReportType === 'course' && `${t.courseWiseReport}: ${selectedCourse}`}
            {activeReportType === 'income_expense' && `${t.incomeExpenseReport}`}
            {activeReportType === 'bank' && `${t.bankStatementReport}`}
            {activeReportType === 'audit' && `${t.auditReport} (${lang === 'bn' ? 'সিস্টেম নিরাপত্তা ও নিরীক্ষা ট্রেইল' : 'System Audit Trail'})`}
          </div>
        </div>

        {/* 1. MONTHLY REPORT CONTENT */}
        {activeReportType === 'monthly' && (
          <div className="space-y-6">
            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">{t.totalIncome}</span>
                <span className="text-base font-black text-emerald-700">{formatCurrency(monthlyData.totalIncome, lang)}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">{t.totalExpense}</span>
                <span className="text-base font-black text-rose-700">{formatCurrency(monthlyData.totalExpense, lang)}</span>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
                <span className="text-[10px] font-bold text-orange-800 uppercase block">{t.netCash}</span>
                <span className="text-base font-black text-orange-700">{formatCurrency(monthlyData.netCash, lang)}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">{t.totalBank}</span>
                <span className="text-base font-black text-blue-700">{formatCurrency(monthlyData.netBankFlow, lang)}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">{t.totalDue}</span>
                <span className="text-base font-black text-amber-700">{formatCurrency(monthlyData.totalDue, lang)}</span>
              </div>
            </div>

            {/* Course Wise Enrollment this Month */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.currentMonthAdmissionsByCourse} ({selectedMonth})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {courses.map(c => (
                  <div key={c.id} className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">{c.name}</span>
                    <span className="text-base font-extrabold text-orange-600">
                      {lang === 'bn' ? toBengaliNumber(monthlyData.courseCounts[c.name] || 0) : (monthlyData.courseCounts[c.name] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Admissions Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                {lang === 'bn' ? 'চলতি মাসে ভর্তিকৃত শিক্ষার্থী তালিকা' : 'Students Enrolled This Month'}
              </h4>
              <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Serial</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Student</th>
                    <th className="py-2 px-3">Course</th>
                    <th className="py-2 px-3 text-right">Fee</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyData.students.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-400">No student admissions in this month.</td></tr>
                  ) : (
                    monthlyData.students.map(s => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 font-mono font-bold text-orange-600">{s.serial}</td>
                        <td className="py-2 px-3">{s.admissionDate}</td>
                        <td className="py-2 px-3 font-bold">{s.name}</td>
                        <td className="py-2 px-3">{s.course}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(s.courseFee, lang)}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-bold">{formatCurrency(s.totalPaid, lang)}</td>
                        <td className="py-2 px-3 text-right text-amber-600 font-bold">{formatCurrency(s.remainingDue, lang)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Monthly Expenses Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                {lang === 'bn' ? 'চলতি মাসের অফিস ও পরিচালন খরচ' : 'Monthly Operational Expenses'}
              </h4>
              <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Voucher ID</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyData.expenses.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-slate-400">No expenses recorded for this month.</td></tr>
                  ) : (
                    monthlyData.expenses.map(e => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-mono text-slate-400">{e.id}</td>
                        <td className="py-2 px-3">{e.date}</td>
                        <td className="py-2 px-3 font-semibold">{e.description}</td>
                        <td className="py-2 px-3">{e.category}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-600">{formatCurrency(e.amount, lang)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Monthly Staff Salaries & Advances Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800">
                  {lang === 'bn' ? 'চলতি মাসের স্টাফ বেতন ও অগ্রিম খাতা' : 'Monthly Staff Salaries & Advances'}
                </h4>
                <span className="text-[11px] font-bold text-indigo-700">
                  {lang === 'bn' ? `মোট প্রদান: ${formatCurrency(monthlyData.totalStaffPayouts, lang)}` : `Total: ${formatCurrency(monthlyData.totalStaffPayouts, lang)}`}
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Slip ID</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Staff Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyData.staffTx.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-400">No staff salary/advance recorded for this month.</td></tr>
                  ) : (
                    monthlyData.staffTx.map(st => (
                      <tr key={st.id}>
                        <td className="py-2 px-3 font-mono text-slate-400">{st.id}</td>
                        <td className="py-2 px-3">{st.date}</td>
                        <td className="py-2 px-3 font-bold">{st.staffName}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.type === 'Salary' || st.description === 'Salary'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {st.type === 'Salary' || st.description === 'Salary' ? (lang === 'bn' ? 'বেতন' : 'Salary') : (lang === 'bn' ? 'অগ্রিম' : 'Advance')}
                          </span>
                        </td>
                        <td className="py-2 px-3">{st.paymentMethod}</td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-700">{formatCurrency(st.amount, lang)}</td>
                        <td className="py-2 px-3 text-slate-500">{st.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. DUE LIST REPORT CONTENT */}
        {activeReportType === 'due' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">{t.totalDue}</span>
                <span className="text-xl font-black text-amber-700">{formatCurrency(totalOutstandingDue, lang)}</span>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">
                {dueStudents.length} {lang === 'bn' ? 'জন বকেয়া শিক্ষার্থী' : 'students with outstanding due'}
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Serial</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3 text-right">Course Fee</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dueStudents.map(s => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-600">{s.serial}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.mobile || '—'}</td>
                    <td className="py-2.5 px-3">{s.course}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(s.courseFee, lang)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">{formatCurrency(s.totalPaid, lang)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-700">{formatCurrency(s.remainingDue, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. DAILY REPORT */}
        {activeReportType === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">{t.todayIncome}</span>
                <span className="text-lg font-black text-emerald-700">{formatCurrency(dailyData.income, lang)}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">{t.todayExpense}</span>
                <span className="text-lg font-black text-rose-700">{formatCurrency(dailyData.expense, lang)}</span>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <span className="text-[10px] font-bold text-orange-800 uppercase block">{t.netCash}</span>
                <span className="text-lg font-black text-orange-700">{formatCurrency(dailyData.net, lang)}</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description / Party</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dailyData.payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">INCOME (Fee)</td>
                    <td className="py-2.5 px-3 font-bold">{p.studentName} ({p.studentSerial})</td>
                    <td className="py-2.5 px-3">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-600">{formatCurrency(p.amount, lang)}</td>
                  </tr>
                ))}
                {dailyData.expenses.map(e => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-3 font-bold text-rose-600">EXPENSE (Office)</td>
                    <td className="py-2.5 px-3 font-bold">{e.description} ({e.category})</td>
                    <td className="py-2.5 px-3">{e.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600">{formatCurrency(e.amount, lang)}</td>
                  </tr>
                ))}
                {dailyData.staffTx.map(st => (
                  <tr key={st.id}>
                    <td className="py-2.5 px-3 font-bold text-indigo-600">STAFF ({st.type || st.description || 'Salary'})</td>
                    <td className="py-2.5 px-3 font-bold">{st.staffName}</td>
                    <td className="py-2.5 px-3">{st.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-right font-black text-indigo-600">{formatCurrency(st.amount, lang)}</td>
                  </tr>
                ))}
                {dailyData.payments.length === 0 && dailyData.expenses.length === 0 && dailyData.staffTx.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">No transactions recorded on this date.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. AUDIT REPORT */}
        {activeReportType === 'audit' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'সিস্টেমের প্রতিটি ডিলিট, আপডেট ও সংবেদনশীল কাজের স্থায়ী ট্রেইল:' : 'Immutable audit trail of all sensitive financial actions & operations:'}
            </p>
            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3">Authorized By</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {auditLogs.slice(0, 20).map(log => (
                  <tr key={log.id}>
                    <td className="py-2 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 font-bold text-orange-600">{log.action}</td>
                    <td className="py-2 px-3">{log.entityType}</td>
                    <td className="py-2 px-3">{log.authorizedBy}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. COURSE-WISE REPORT */}
        {activeReportType === 'course' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-3">Serial</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Admission Date</th>
                  <th className="py-2 px-3">Mobile</th>
                  <th className="py-2 px-3 text-right">Fee</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                  <th className="py-2 px-3 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.filter(s => selectedCourse === 'ALL' || s.course === selectedCourse).map(s => (
                  <tr key={s.id}>
                    <td className="py-2 px-3 font-mono font-bold text-orange-600">{s.serial}</td>
                    <td className="py-2 px-3 font-bold">{s.name}</td>
                    <td className="py-2 px-3">{s.admissionDate}</td>
                    <td className="py-2 px-3">{s.mobile || '—'}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(s.courseFee, lang)}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-bold">{formatCurrency(s.totalPaid, lang)}</td>
                    <td className="py-2 px-3 text-right text-amber-600 font-bold">{formatCurrency(s.remainingDue, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures & Verification */}
        <div className="pt-8 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10 flex items-end justify-center font-script text-slate-600 italic">
              Accounts Officer
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-600 text-[11px]">
              Prepared By (হিসাবরক্ষক)
            </div>
          </div>

          <div>
            <div className="h-10 flex items-end justify-center font-bold text-orange-600">
              Omar Faroque
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-700 text-[11px]">
              {t.authorizedSignature}
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium">
          * Officially generated ledger summary from JONOTA EQUIPMENT TRAINING CENTER system.
        </div>
      </div>
    </div>
  );
};
