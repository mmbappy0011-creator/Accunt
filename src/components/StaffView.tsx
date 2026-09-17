import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Wallet, 
  Building2, 
  Trash2, 
  Edit, 
  Phone, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  ArrowDownCircle,
  TrendingDown,
  Banknote,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Receipt
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { StaffMember, StaffTransaction, StaffTransactionType } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface StaffViewProps {
  staff: StaffMember[];
  staffTransactions: StaffTransaction[];
  lang: Language;
  onAddStaff: (payload: {
    name: string;
    designation: string;
    mobile?: string;
    baseSalary?: number;
  }) => Promise<void>;
  onUpdateStaff: (id: string, payload: any) => Promise<void>;
  onRequestDeleteStaff: (member: StaffMember) => void;
  onAddStaffTransaction: (payload: {
    staffId: string;
    staffName?: string;
    type: StaffTransactionType | string;
    description?: string;
    month?: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank';
    date?: string;
    notes?: string;
  }) => Promise<void>;
  onRequestDeleteStaffTransaction: (transaction: StaffTransaction) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  staffTransactions,
  lang,
  onAddStaff,
  onUpdateStaff,
  onRequestDeleteStaff,
  onAddStaffTransaction,
  onRequestDeleteStaffTransaction
}) => {
  const t = translations[lang];

  // Modals
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Filter & Search State for transactions ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [txFilterType, setTxFilterType] = useState<'ALL' | 'Salary' | 'Advance'>('ALL');

  // Add/Edit Staff Form
  const [staffForm, setStaffForm] = useState({
    name: '',
    designation: '',
    mobile: '',
    baseSalary: 15000,
  });

  // Transaction Form (Salary / Advance)
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [txForm, setTxForm] = useState({
    staffId: staff[0]?.id || '',
    type: 'Salary' as StaffTransactionType,
    month: currentMonthStr,
    amount: '' as number | '',
    paymentMethod: 'Cash' as 'Cash' | 'Bank',
    date: todayStr,
    notes: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Month-name helper in Bengali & English
  const getMonthDisplayName = (yearMonth: string) => {
    try {
      const [y, m] = yearMonth.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, 1);
      if (lang === 'bn') {
        const bnMonths = [
          'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
          'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
        ];
        return `${bnMonths[Number(m) - 1]} ${toBengaliNumber(y)}`;
      }
      return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return yearMonth;
    }
  };

  // Calculate detailed stats for each staff member
  const getStaffStats = (staffId: string) => {
    const txs = staffTransactions.filter(tx => tx.staffId === staffId);
    
    // Salaries
    const salaryTxs = txs.filter(tx => tx.type === 'Salary' || tx.description === 'Salary');
    const totalSalary = salaryTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const thisMonthSalary = salaryTxs
      .filter(tx => (tx.date || '').startsWith(currentMonthStr) || tx.month === currentMonthStr)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Advances
    const advanceTxs = txs.filter(tx => tx.type === 'Advance' || tx.description === 'Advance');
    const totalAdvance = advanceTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const thisMonthAdvance = advanceTxs
      .filter(tx => (tx.date || '').startsWith(currentMonthStr))
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Total received all-time
    const totalReceived = txs.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalSalary,
      thisMonthSalary,
      totalAdvance,
      thisMonthAdvance,
      totalReceived,
      txCount: txs.length,
    };
  };

  // Overall institute stats
  const totalBaseSalaryBudget = staff.reduce((sum, m) => sum + (m.baseSalary || 0), 0);
  const totalSalaryPaidThisMonth = staffTransactions
    .filter(tx => (tx.type === 'Salary' || tx.description === 'Salary') && ((tx.date || '').startsWith(currentMonthStr) || tx.month === currentMonthStr))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalAdvancePaidThisMonth = staffTransactions
    .filter(tx => (tx.type === 'Advance' || tx.description === 'Advance') && (tx.date || '').startsWith(currentMonthStr))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalAllTimeStaffDisbursed = staffTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Handlers for Staff Form
  const handleOpenAddStaff = () => {
    setStaffForm({
      name: '',
      designation: 'Senior Instructor',
      mobile: '',
      baseSalary: 18000,
    });
    setEditingStaff(null);
    setError('');
    setIsAddStaffModalOpen(true);
  };

  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setStaffForm({
      name: member.name,
      designation: member.designation || member.role || '',
      mobile: member.mobile || member.phone || '',
      baseSalary: member.baseSalary || 15000,
    });
    setError('');
    setIsAddStaffModalOpen(true);
  };

  // Handlers for Transaction Form (Salary vs Advance)
  const handleOpenSalaryModal = (member?: StaffMember) => {
    const targetMember = member || staff[0];
    setTxForm({
      staffId: targetMember ? targetMember.id : '',
      type: 'Salary',
      month: currentMonthStr,
      amount: targetMember?.baseSalary || 18000,
      paymentMethod: 'Cash',
      date: todayStr,
      notes: lang === 'bn' ? `${getMonthDisplayName(currentMonthStr)} মাসের বেতন` : `${getMonthDisplayName(currentMonthStr)} Salary`,
    });
    setError('');
    setIsTxModalOpen(true);
  };

  const handleOpenAdvanceModal = (member?: StaffMember) => {
    const targetMember = member || staff[0];
    setTxForm({
      staffId: targetMember ? targetMember.id : '',
      type: 'Advance',
      month: currentMonthStr,
      amount: '',
      paymentMethod: 'Cash',
      date: todayStr,
      notes: lang === 'bn' ? 'জরুরি প্রয়োজনে স্টাফ অগ্রিম' : 'Staff advance payment',
    });
    setError('');
    setIsTxModalOpen(true);
  };

  // When staff changes inside modal, auto-fill baseSalary if type is Salary
  const handleTxStaffChange = (selectedStaffId: string) => {
    const target = staff.find(s => s.id === selectedStaffId);
    setTxForm(prev => ({
      ...prev,
      staffId: selectedStaffId,
      amount: prev.type === 'Salary' && target?.baseSalary ? target.baseSalary : prev.amount
    }));
  };

  // When type changes between Salary and Advance
  const handleTxTypeChange = (newType: StaffTransactionType) => {
    const target = staff.find(s => s.id === txForm.staffId);
    setTxForm(prev => ({
      ...prev,
      type: newType,
      amount: newType === 'Salary' ? (target?.baseSalary || 18000) : (prev.type === 'Salary' ? '' : prev.amount),
      notes: newType === 'Salary' 
        ? (lang === 'bn' ? `${getMonthDisplayName(prev.month)} মাসের বেতন` : `${getMonthDisplayName(prev.month)} Salary`)
        : (lang === 'bn' ? 'জরুরি স্টাফ অগ্রিম' : 'Staff advance payment')
    }));
  };

  // Save Staff Profile
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim()) {
      setError(t.requiredField + ' (' + t.staffName + ')');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingStaff) {
        await onUpdateStaff(editingStaff.id, {
          name: staffForm.name.trim(),
          designation: staffForm.designation.trim(),
          mobile: staffForm.mobile.trim(),
          baseSalary: Number(staffForm.baseSalary) || 0,
        });
      } else {
        await onAddStaff({
          name: staffForm.name.trim(),
          designation: staffForm.designation.trim(),
          mobile: staffForm.mobile.trim(),
          baseSalary: Number(staffForm.baseSalary) || 0,
        });
      }
      setIsAddStaffModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save staff profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Salary / Advance Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.staffId) {
      setError(lang === 'bn' ? 'স্টাফ নির্বাচন করুন' : 'Please select a staff member');
      return;
    }
    const amt = Number(txForm.amount);
    if (!amt || amt <= 0) {
      setError(lang === 'bn' ? 'টাকার পরিমাণ লিখুন (শূন্যের বেশি)' : 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    setError('');

    const selectedMember = staff.find(s => s.id === txForm.staffId);
    const resolvedStaffName = selectedMember ? selectedMember.name : '';

    try {
      await onAddStaffTransaction({
        staffId: txForm.staffId,
        staffName: resolvedStaffName,
        type: txForm.type,
        description: txForm.type,
        month: txForm.month,
        amount: amt,
        paymentMethod: txForm.paymentMethod,
        date: txForm.date,
        notes: txForm.notes.trim() || (txForm.type === 'Salary' ? `${txForm.month} Salary` : 'Advance payment'),
      });
      setIsTxModalOpen(false);
    } catch (err: any) {
      setError(err.message || (lang === 'bn' ? 'লেনদেন সম্পন্ন করা সম্ভব হয়নি' : 'Transaction failed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered transactions for table
  const filteredTransactions = staffTransactions.filter(tx => {
    // Type Filter
    if (txFilterType === 'Salary' && !(tx.type === 'Salary' || tx.description === 'Salary')) {
      return false;
    }
    if (txFilterType === 'Advance' && !(tx.type === 'Advance' || tx.description === 'Advance')) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (tx.staffName || '').toLowerCase().includes(q);
      const matchId = (tx.id || '').toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      return matchName || matchId || matchNotes;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Primary Action Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-6 h-6 text-orange-600" />
            <span>{lang === 'bn' ? 'স্টাফ ম্যানেজমেন্ট, বেতন ও অগ্রিম খাতা' : 'Staff Payroll, Salary & Advance Management'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'কর্মকর্তা ও প্রশিক্ষকদের নিয়মিত বেতন পরিশোধ, অগ্রিম ঋণ ও পূর্ণাঙ্গ হিসাব ট্র্যাকিং' 
              : 'Institutional staff salary disbursement, advance loans & ledger accounting'}
          </p>
        </div>

        {/* Dedicated Actions: Staff Salary, Staff Advance, Add Staff */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. PAY SALARY BUTTON (GREEN) */}
          <button
            onClick={() => handleOpenSalaryModal()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs md:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            <Banknote className="w-4 h-4" />
            <span>{t.paySalaryTitle}</span>
          </button>

          {/* 2. GIVE ADVANCE BUTTON (AMBER) */}
          <button
            onClick={() => handleOpenAdvanceModal()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-xs md:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>{t.giveAdvanceTitle}</span>
          </button>

          {/* 3. ADD STAFF BUTTON */}
          <button
            onClick={handleOpenAddStaff}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>{t.addStaffTitle}</span>
          </button>
        </div>
      </div>

      {/* Staff Financial Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Monthly Salary Budget */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'মাসিক বেতন বাজেট' : 'Monthly Salary Budget'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800">
            {formatCurrency(totalBaseSalaryBudget, lang)}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            {lang === 'bn' ? `মোট ${toBengaliNumber(staff.length)} জন কর্মকর্তা` : `${staff.length} staff profiles`}
          </span>
        </div>

        {/* This Month's Salary Paid */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {lang === 'bn' ? 'চলতি মাসে বেতন প্রদান' : 'Salary Paid This Month'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700">
            {formatCurrency(totalSalaryPaidThisMonth, lang)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {getMonthDisplayName(currentMonthStr)}
          </span>
        </div>

        {/* This Month's Advance Given */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs bg-gradient-to-br from-amber-50/40 to-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              {lang === 'bn' ? 'চলতি মাসে অগ্রিম প্রদান' : 'Advance Given This Month'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700">
            {formatCurrency(totalAdvancePaidThisMonth, lang)}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">
            {lang === 'bn' ? 'অগ্রিম ঋণ হিসাব' : 'Short-term advance'}
          </span>
        </div>

        {/* Total All-Time Disbursed */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs bg-gradient-to-br from-indigo-50/40 to-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
              {lang === 'bn' ? 'সর্বমোট প্রদান ও উত্তোলন' : 'Total All-Time Disbursed'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-700">
            {formatCurrency(totalAllTimeStaffDisbursed, lang)}
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold">
            {lang === 'bn' ? `${toBengaliNumber(staffTransactions.length)}টি ট্রানজেকশন` : `${staffTransactions.length} transactions`}
          </span>
        </div>
      </div>

      {/* Staff Profiles Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span>{lang === 'bn' ? 'কর্মকর্তা ও প্রশিক্ষকবৃন্দ' : 'Staff Members & Instructors'}</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            {lang === 'bn' ? `মোট ${toBengaliNumber(staff.length)} জন` : `${staff.length} staff`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const stats = getStaffStats(member.id);
            const isSalaryPaidThisMonth = stats.thisMonthSalary >= (member.baseSalary || 0) && stats.thisMonthSalary > 0;

            return (
              <div 
                key={member.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 font-extrabold flex items-center justify-center text-sm shadow-xs border border-orange-200">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{member.name}</h4>
                        <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {member.designation || member.role || 'Staff'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditStaff(member)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title={lang === 'bn' ? 'তথ্য সংশোধন' : 'Edit Staff'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRequestDeleteStaff(member)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete Staff'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {member.mobile && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.mobile}</span>
                    </div>
                  )}

                  {/* Financial Stats for this member */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {lang === 'bn' ? 'নির্ধারিত মাসিক বেতন:' : 'Monthly Base Salary:'}
                      </span>
                      <span className="font-black text-slate-800">
                        {formatCurrency(member.baseSalary || 0, lang)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                        <span>{lang === 'bn' ? 'চলতি মাসের বেতন:' : 'This Month Salary:'}</span>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(stats.thisMonthSalary, lang)}
                        </span>
                        {isSalaryPaidThisMonth ? (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            {lang === 'bn' ? 'চলমান' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {lang === 'bn' ? 'চলতি মাসের অগ্রিম:' : 'This Month Advance:'}
                      </span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(stats.thisMonthAdvance, lang)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {lang === 'bn' ? 'সর্বমোট প্রাপ্তি:' : 'Total Received:'}
                      </span>
                      <span className="font-black text-indigo-700">
                        {formatCurrency(stats.totalReceived, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons on Each Card: Pay Salary & Give Advance */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenSalaryModal(member)}
                    className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer active:scale-95"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ বেতন দিন' : '+ Pay Salary'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenAdvanceModal(member)}
                    className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ অগ্রিম দিন' : '+ Advance'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Controls: Title, Search, Filter Pills */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t.staffTransactionsTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'কর্মকর্তাদের প্রদানকৃত বেতন ও অগ্রিম হিসাব বিবরণী' : 'Staff salary payouts and advance loans transaction ledger'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills: All | Salary | Advance */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTxFilterType('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  txFilterType === 'ALL'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.allStaffTransactions}
              </button>
              <button
                onClick={() => setTxFilterType('Salary')}
                className={`px-3 py-1 rounded-lg transition ${
                  txFilterType === 'Salary'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                {t.onlySalary}
              </button>
              <button
                onClick={() => setTxFilterType('Advance')}
                className={`px-3 py-1 rounded-lg transition ${
                  txFilterType === 'Advance'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                {t.onlyAdvance}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'স্টাফের নাম বা বিবরণ...' : 'Search staff or notes...'}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{t.slipNumber}</th>
                <th className="py-3.5 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3.5 px-4">{t.staffName}</th>
                <th className="py-3.5 px-3">{t.transactionType}</th>
                <th className="py-3.5 px-3 text-center">{t.paymentMethod}</th>
                <th className="py-3.5 px-3 text-right">{t.expenseAmount}</th>
                <th className="py-3.5 px-4">{t.notes}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    {lang === 'bn' ? 'কোন লেনদেন রেকর্ড পাওয়া যায়নি' : 'No staff transactions found'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isSalary = tx.type === 'Salary' || tx.description === 'Salary';
                  const isAdvance = tx.type === 'Advance' || tx.description === 'Advance';

                  return (
                    <tr key={tx.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {tx.id}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(tx.date, lang)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {tx.staffName}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isSalary ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Banknote className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'বেতন (Salary)' : 'Salary'}</span>
                          </span>
                        ) : isAdvance ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'অগ্রিম (Advance)' : 'Advance'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <ArrowDownCircle className="w-3 h-3" />
                            <span>{tx.type || tx.description}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.paymentMethod === 'Bank' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {tx.paymentMethod === 'Bank' ? (lang === 'bn' ? 'ব্যাংক' : 'Bank') : (lang === 'bn' ? 'ক্যাশ' : 'Cash')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(tx.amount, lang)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {tx.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onRequestDeleteStaffTransaction(tx)}
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD / EDIT STAFF PROFILE MODAL */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingStaff ? (lang === 'bn' ? 'স্টাফ তথ্য সংশোধন' : 'Edit Staff') : t.addStaffTitle}
                  </h3>
                  <p className="text-xs text-orange-100">JONOTA EQUIPMENT TRAINING CENTER</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.staffName} *
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Md. Rafiqul Islam"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-orange-500 outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.designation} *
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.designation}
                  onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                  placeholder="Senior Excavator Instructor"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.mobileNumber}
                </label>
                <input
                  type="text"
                  value={staffForm.mobile}
                  onChange={(e) => setStaffForm({ ...staffForm, mobile: e.target.value })}
                  placeholder="018XXXXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.baseSalary} (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={staffForm.baseSalary}
                  onChange={(e) => setStaffForm({ ...staffForm, baseSalary: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-orange-500 outline-none font-bold text-slate-800 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : (editingStaff ? t.saveChanges : t.addStaffTitle)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DEDICATED STAFF SALARY & ADVANCE MODAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header: Green for Salary, Amber for Advance */}
            <div className={`p-5 text-white flex items-center justify-between transition-colors ${
              txForm.type === 'Salary' 
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                : 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  {txForm.type === 'Salary' ? (
                    <Banknote className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {txForm.type === 'Salary' ? t.paySalaryTitle : t.giveAdvanceTitle}
                  </h3>
                  <p className="text-xs text-white/80">JONOTA EQUIPMENT TRAINING CENTER</p>
                </div>
              </div>
            </div>

            {/* Option Selector Toggle: বেতন (Salary) vs অগ্রিম (Advance) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200/80">
              <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTxTypeChange('Salary')}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    txForm.type === 'Salary'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>{t.staffSalaryOption}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTxTypeChange('Advance')}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    txForm.type === 'Advance'
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{t.staffAdvanceOption}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Staff Member Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.staffName} *
                </label>
                <select
                  value={txForm.staffId}
                  onChange={(e) => handleTxStaffChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-none font-bold text-slate-800 text-xs"
                >
                  {staff.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.designation || 'Staff'} (মূল বেতন: ৳{m.baseSalary || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selection if Salary */}
              {txForm.type === 'Salary' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      {t.salaryMonth} *
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {getMonthDisplayName(txForm.month)}
                    </span>
                  </div>
                  <input
                    type="month"
                    required
                    value={txForm.month}
                    onChange={(e) => {
                      const newM = e.target.value;
                      setTxForm({
                        ...txForm,
                        month: newM,
                        notes: lang === 'bn' ? `${getMonthDisplayName(newM)} মাসের বেতন` : `${getMonthDisplayName(newM)} Salary`
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-bold text-slate-800"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    {txForm.type === 'Salary' 
                      ? (lang === 'bn' ? 'বেতনের পরিমাণ (৳) *' : 'Salary Amount (৳) *') 
                      : (lang === 'bn' ? 'অগ্রিমের পরিমাণ (৳) *' : 'Advance Amount (৳) *')}
                  </label>
                  {txForm.type === 'Salary' && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {lang === 'bn' ? 'নির্ধারিত বেতন স্বয়ংক্রিয়' : 'Base salary auto-filled'}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder={txForm.type === 'Salary' ? '18000' : '5000'}
                  className={`w-full px-3.5 py-2.5 text-base rounded-xl border outline-none font-black ${
                    txForm.type === 'Salary'
                      ? 'border-emerald-300 focus:border-emerald-500 text-emerald-800'
                      : 'border-amber-300 focus:border-amber-500 text-amber-800'
                  }`}
                />
              </div>

              {/* Payment Method: Cash vs Bank */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, paymentMethod: 'Cash' })}
                    className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      txForm.paymentMethod === 'Cash'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, paymentMethod: 'Bank' })}
                    className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      txForm.paymentMethod === 'Bank'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ব্যাংক (Bank)' : 'Bank'}</span>
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'প্রদানের তারিখ' : 'Payment Date'}
                </label>
                <input
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {txForm.type === 'Salary' ? t.notes : t.advanceReason}
                </label>
                <input
                  type="text"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  placeholder={txForm.type === 'Salary' ? 'Full monthly salary payout...' : 'Family emergency advance...'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 font-bold text-white rounded-xl shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer ${
                    txForm.type === 'Salary'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/20'
                  }`}
                >
                  {submitting 
                    ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                    : (txForm.type === 'Salary' ? t.salaryPayment : t.advancePayment)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
