import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Key, 
  BookOpen, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  AlertTriangle,
  FileText,
  Clock
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Course, AuditLog, Student, Payment, OfficeExpense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ApiService } from '../services/api';

interface SettingsViewProps {
  courses: Course[];
  auditLogs: AuditLog[];
  students: Student[];
  payments: Payment[];
  expenses: OfficeExpense[];
  lang: Language;
  onRefreshData: () => Promise<void>;
  onRequestResetDatabase: () => void;
  onRequestSecondAuth: (actionDescription: string, onVerified: (authCode: string) => Promise<void>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  courses,
  auditLogs,
  students,
  payments,
  expenses,
  lang,
  onRefreshData,
  onRequestResetDatabase,
  onRequestSecondAuth
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup Export
  const handleExportBackup = async () => {
    try {
      const data = await ApiService.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jonota_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: lang === 'bn' ? 'ডাটাবেস ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে' : 'Database backup downloaded successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Export failed' });
    }
  };

  // Restore Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onRequestSecondAuth(
      lang === 'bn' ? 'ডাটাবেস ব্যাকআপ রিস্টোর / প্রতিস্থাপন করতে অনুমতি দিন' : 'Authorize database restore and override',
      async (authPassword) => {
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const parsed = JSON.parse(event.target?.result as string);
              await ApiService.importBackup(parsed, authPassword);
              await onRefreshData();
              setMessage({ type: 'success', text: lang === 'bn' ? 'ডাটাবেস সফলভাবে রিস্টোর হয়েছে' : 'Database restored successfully' });
            } catch (err: any) {
              setMessage({ type: 'error', text: err.message || 'Invalid JSON file' });
            }
          };
          reader.readAsText(file);
        } catch (err: any) {
          setMessage({ type: 'error', text: err.message });
        }
      }
    );
  };

  // CSV Exports
  const handleExportStudentsCsv = () => {
    const headers = ['Serial', 'Admission Date', 'Student Name', 'Father Name', 'Mobile', 'Course', 'Course Fee', 'Total Paid', 'Remaining Due', 'Payment Status'];
    const rows = students.map(s => [
      s.serial,
      s.admissionDate,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.fatherName || '').replace(/"/g, '""')}"`,
      `"${s.mobile || ''}"`,
      s.course,
      s.courseFee,
      s.totalPaid,
      s.remainingDue,
      s.paymentStatus
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCsv(csvContent, `Jonota_Students_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPaymentsCsv = () => {
    const headers = ['Slip ID', 'Date', 'Student Name', 'Serial', 'Course', 'Amount', 'Payment Method', 'Previous Due', 'Current Due'];
    const rows = payments.map(p => [
      p.id,
      p.date,
      `"${p.studentName.replace(/"/g, '""')}"`,
      p.studentSerial,
      p.course,
      p.amount,
      p.paymentMethod,
      p.previousDue,
      p.currentDue
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCsv(csvContent, `Jonota_Payments_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportExpensesCsv = () => {
    const headers = ['Voucher ID', 'Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = expenses.map(e => [
      e.id,
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.paymentMethod,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCsv(csvContent, `Jonota_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-orange-600" />
          <span>{t.navSettings}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {lang === 'bn' ? 'সিস্টেম ব্যাকআপ, এক্সপোর্ট, কোর্স ফি ও নিরাপত্তা কনফিগারেশন' : 'Database backup, CSV exports, course fees & audit security configuration'}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Database Backup & Restore Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t.backupDatabase}</h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'সম্পূর্ণ হিসাব ও শিক্ষার্থী তথ্যের নিরাপদ অফলাইন ব্যাকআপ নিন বা রিস্টোর করুন' : 'Export and import complete application state as JSON'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* Download JSON Backup */}
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.backupDatabase} (JSON)</span>
          </button>

          {/* Restore JSON Backup */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t.restoreDatabase} (JSON)</span>
          </button>

          {/* Reset Database */}
          <button
            onClick={onRequestResetDatabase}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetDatabase}</span>
          </button>
        </div>
      </div>

      {/* CSV Export Hub */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {lang === 'bn' ? 'এক্সেল / CSV ডাটা এক্সপোর্ট' : 'Excel & CSV Data Exports'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'হিসাব বহি ও তালিকার স্প্রেডশীট ফাইল ডাউনলোড করুন' : 'Download standard CSV spreadsheets for external reporting'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleExportStudentsCsv}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Students List (.CSV)</span>
          </button>

          <button
            onClick={handleExportPaymentsCsv}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50/50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Fee Payments (.CSV)</span>
          </button>

          <button
            onClick={handleExportExpensesCsv}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-600" />
            <span>Office Expenses (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Courses Configuration List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t.coursesList}</h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'ট্রেনিং সেন্টারের ইকুইপমেন্ট কোর্স ও নির্ধারিত ফি' : 'Standard heavy machinery courses and fees'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((course) => (
            <div 
              key={course.id}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
            >
              <div>
                <h4 className="font-extrabold text-xs text-slate-800">{course.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{course.duration}</p>
              </div>
              <div className="text-right">
                <span className="font-black text-sm text-orange-600">
                  {formatCurrency(course.fee, lang)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Credentials Information */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {lang === 'bn' ? 'নিরাপত্তা ও দ্বি-স্তর অনুমোদন নীতি' : 'Two-Tier Security Credentials'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'সংবেদনশীল আর্থিক পরিবর্তন ও মোছার জন্য স্পেশাল অনুমোদন প্রযোজ্য' : 'Protected financial and deletion workflows'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-bold block">{t.adminUsername} / Login Password</span>
            <p className="font-mono text-slate-800 font-extrabold">Username: admin</p>
            <p className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'মূল সিস্টেমে লগইন করার প্রাথমিক ক্রেডেনশিয়াল।' : 'Primary credential for dashboard entry.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-1">
            <span className="text-orange-600 font-bold block">{t.authPassword} (Second Authorization)</span>
            <p className="font-mono text-orange-800 font-extrabold">Authorized Signature: Omar Faroque</p>
            <p className="text-[11px] text-orange-700/80">
              {lang === 'bn' ? 'যেকোনো ডিলিট বা ডাটাবেস রিস্টোরের সময় এই অনুমোদন পাসওয়ার্ড আবশ্যক।' : 'Required for any financial deletion, modification, or reset.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
