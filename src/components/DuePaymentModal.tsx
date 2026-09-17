import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar, 
  FileText, 
  Building2, 
  Wallet,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Student, PaymentMethod, Payment } from '../types';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';

interface DuePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  initialStudent?: Student | null;
  onAddPayment: (payload: {
    studentId: string;
    amount: number;
    paymentMethod: string;
    date?: string;
    notes?: string;
  }) => Promise<Payment | void>;
  onPaymentSuccess?: (student: Student, payment?: Payment | null) => void;
  lang: Language;
}

export const DuePaymentModal: React.FC<DuePaymentModalProps> = ({
  isOpen,
  onClose,
  students,
  initialStudent,
  onAddPayment,
  onPaymentSuccess,
  lang,
}) => {
  const t = translations[lang];

  // Filter students who have remaining due
  const dueStudents = students.filter(s => s.remainingDue > 0);
  const eligibleStudents = dueStudents.length > 0 ? dueStudents : students;

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Selected student object
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // When modal opens or initialStudent changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      
      let targetStudent = initialStudent;
      if (!targetStudent || targetStudent.remainingDue <= 0) {
        targetStudent = dueStudents[0] || students[0];
      }

      if (targetStudent) {
        setSelectedStudentId(targetStudent.id);
        setAmount(targetStudent.remainingDue > 0 ? targetStudent.remainingDue : '');
      } else {
        setSelectedStudentId('');
        setAmount('');
      }
    }
  }, [isOpen, initialStudent, students]);

  // Close on Escape key
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

  // When selected student changes via dropdown
  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    setError('');
    const s = students.find(item => item.id === id);
    if (s && s.remainingDue > 0) {
      setAmount(s.remainingDue);
    } else {
      setAmount('');
    }
  };

  const handlePayFull = () => {
    if (selectedStudent && selectedStudent.remainingDue > 0) {
      setAmount(selectedStudent.remainingDue);
      setError('');
    }
  };

  const handlePayHalf = () => {
    if (selectedStudent && selectedStudent.remainingDue > 0) {
      setAmount(Math.round(selectedStudent.remainingDue / 2));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে শিক্ষার্থী নির্বাচন করুন।' : 'Please select a student.');
      return;
    }

    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      setError(lang === 'bn' ? 'সঠিক পেমেন্টের পরিমাণ দিন।' : 'Please enter a valid positive amount.');
      return;
    }

    if (payAmt > selectedStudent.remainingDue) {
      setError(
        lang === 'bn'
          ? `জমার পরিমাণ শিক্ষার্থীর বর্তমান বকেয়া (৳${selectedStudent.remainingDue}) এর চেয়ে বেশি হতে পারে না।`
          : `Amount cannot exceed student's remaining due (৳${selectedStudent.remainingDue}).`
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await onAddPayment({
        studentId: selectedStudent.id,
        amount: payAmt,
        paymentMethod,
        date,
        notes: notes.trim() || (lang === 'bn' ? 'বকেয়া পরিশোধ' : 'Due installment payment'),
      });

      onClose();
      if (onPaymentSuccess) {
        // Calculate updated student for receipt preview
        const updatedStudent: Student = {
          ...selectedStudent,
          totalPaid: selectedStudent.totalPaid + payAmt,
          remainingDue: Math.max(0, selectedStudent.remainingDue - payAmt),
          paymentStatus: selectedStudent.remainingDue - payAmt === 0 ? 'PAID' : 'DUE',
        };
        onPaymentSuccess(updatedStudent, (result as Payment) || null);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentDue = selectedStudent ? selectedStudent.remainingDue : 0;
  const numAmount = typeof amount === 'number' ? amount : 0;
  const newRemainingDue = Math.max(0, currentDue - numAmount);
  const willBeFullPaid = currentDue > 0 && numAmount >= currentDue;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>{lang === 'bn' ? 'শিক্ষার্থীর বকেয়া টাকা পরিশোধ' : 'Collect Student Outstanding Due'}</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {lang === 'bn' ? 'বকেয়া আদায়' : 'Due Collection'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn' 
                  ? 'বকেয়া টাকা জমা দিন এবং তৎক্ষণাৎ মানি রিসিট পান' 
                  : 'Receive pending due amount and generate money receipt'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
            title={lang === 'bn' ? 'বন্ধ করুন / ফিরে যান' : 'Close / Go Back'}
          >
            <X className="w-4 h-4" />
            <span>{lang === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {lang === 'bn' ? 'শিক্ষার্থী নির্বাচন করুন (বকেয়া তালিকা)' : 'Select Student (Outstanding Due List)'} *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none bg-white"
            >
              {dueStudents.length === 0 && (
                <option value="">{lang === 'bn' ? '-- কোনো শিক্ষার্থীর বকেয়া নেই --' : '-- No students with outstanding due --'}</option>
              )}
              {dueStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.serial} — {s.name} ({s.course}) • [বকেয়া: ৳{s.remainingDue.toLocaleString()}]
                </option>
              ))}
              {/* Also list already paid students if needed */}
              {students.filter(s => s.remainingDue <= 0).length > 0 && (
                <optgroup label={lang === 'bn' ? 'পরিশোধিত শিক্ষার্থী' : 'Paid Students'}>
                  {students.filter(s => s.remainingDue <= 0).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serial} — {s.name} ({s.course}) • [পরিশোধিত]
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Active Student Due Details Card */}
          {selectedStudent && (
            <div className="p-4 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white rounded-2xl border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>{selectedStudent.name}</span>
                    <span className="font-mono text-xs font-bold text-orange-600 bg-orange-100/70 px-1.5 py-0.5 rounded">
                      {selectedStudent.serial}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'bn' ? `কোর্স: ${selectedStudent.course} • মোবাইল: ${selectedStudent.mobile || 'নেই'}` : `Course: ${selectedStudent.course} • Mobile: ${selectedStudent.mobile || 'N/A'}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">
                    {lang === 'bn' ? 'বর্তমান বকেয়া' : 'Remaining Due'}
                  </span>
                  <span className="text-lg font-black text-amber-700">
                    {formatCurrency(selectedStudent.remainingDue, lang)}
                  </span>
                </div>
              </div>

              {/* 3-Part Financial Progress Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-100 text-center">
                <div className="p-1.5 bg-white/80 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-500 block font-medium">{t.totalFee}</span>
                  <span className="text-xs font-bold text-slate-800">{formatCurrency(selectedStudent.courseFee, lang)}</span>
                </div>
                <div className="p-1.5 bg-white/80 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-emerald-600 block font-medium">{t.totalPaid}</span>
                  <span className="text-xs font-bold text-emerald-700">{formatCurrency(selectedStudent.totalPaid, lang)}</span>
                </div>
                <div className="p-1.5 bg-amber-100/60 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block font-bold">{t.remainingDue}</span>
                  <span className="text-xs font-black text-amber-800">{formatCurrency(selectedStudent.remainingDue, lang)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Amount & Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {lang === 'bn' ? 'জমার পরিমাণ (টাকা)' : 'Payment Amount (BDT)'} *
              </label>
              {selectedStudent && selectedStudent.remainingDue > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePayHalf}
                    className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    {lang === 'bn' ? '৫০% বকেয়া' : '50% Due'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePayFull}
                    className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'সম্পূর্ণ বকেয়া পরিশোধ' : 'Full Due'}</span>
                  </button>
                </div>
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                setAmount(val);
                setError('');
              }}
              placeholder={selectedStudent ? `সর্বোচ্চ ৳${selectedStudent.remainingDue}` : '0'}
              min="1"
              max={selectedStudent ? selectedStudent.remainingDue : undefined}
              className="w-full text-base font-black text-slate-800 p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
              required
            />
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.paymentMethod}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                    paymentMethod === 'Cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>{t.cash}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                    paymentMethod === 'Bank'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t.bank}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none bg-white"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.notes} ({lang === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: ২য় কিস্তি বকেয়া প্রদান' : 'e.g. 2nd installment due cleared'}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none"
            />
          </div>

          {/* Live Outcome Summary */}
          {selectedStudent && currentDue > 0 && numAmount > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'জমা পরবর্তী অবশিষ্ট বকেয়া:' : 'Remaining due after this payment:'}
                </span>
                <span className="font-extrabold text-sm text-slate-800">
                  {formatCurrency(newRemainingDue, lang)}
                </span>
              </div>
              {willBeFullPaid ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত (Full Paid)' : 'Full Paid'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'bn' ? 'আংশিক পরিশোধ' : 'Partial Paid'}</span>
                </span>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStudent || (selectedStudent.remainingDue <= 0 && numAmount <= 0)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs md:text-sm font-black rounded-xl shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {submitting
                  ? (lang === 'bn' ? 'জমা হচ্ছে...' : 'Processing...')
                  : (lang === 'bn' ? 'বকেয়া টাকা গ্রহণ নিশ্চিত করুন' : 'Confirm Due Collection')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
