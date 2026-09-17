import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Wallet,
  Building2,
  Calendar
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Payment, Student, PaymentMethod } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface PaymentsViewProps {
  payments: Payment[];
  students: Student[];
  lang: Language;
  onAddPayment: (payload: {
    studentId: string;
    amount: number;
    paymentMethod: string;
    date?: string;
    notes?: string;
  }) => Promise<void>;
  onRequestDeletePayment: (payment: Payment) => void;
  onOpenReceiptModal: (student: Student, payment?: Payment) => void;
  onOpenDuePaymentModal?: (student?: Student) => void;
  preselectedStudent?: Student | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  students,
  lang,
  onAddPayment,
  onRequestDeletePayment,
  onOpenReceiptModal,
  onOpenDuePaymentModal,
  preselectedStudent
}) => {
  const t = translations[lang];

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');

  // Add Payment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudent?.id || (students.find(s => s.remainingDue > 0)?.id || students[0]?.id || ''));
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active student calculation
  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Filtered payments
  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      p.studentName.toLowerCase().includes(q) ||
      p.studentSerial.toLowerCase().includes(q) ||
      (p.course || '').toLowerCase().includes(q) ||
      (p.notes || '').toLowerCase().includes(q);

    const matchesMethod = selectedMethod === 'ALL' || p.paymentMethod === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const handleOpenAddModal = (student?: Student) => {
    if (student) {
      setSelectedStudentId(student.id);
      setPaymentAmount(student.remainingDue > 0 ? student.remainingDue : '');
    } else {
      const firstDueStudent = students.find(s => s.remainingDue > 0) || students[0];
      if (firstDueStudent) {
        setSelectedStudentId(firstDueStudent.id);
        setPaymentAmount(firstDueStudent.remainingDue > 0 ? firstDueStudent.remainingDue : '');
      }
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
    setIsAddModalOpen(true);
  };

  const handleStudentSelectChange = (id: string) => {
    setSelectedStudentId(id);
    const s = students.find(item => item.id === id);
    if (s && s.remainingDue > 0) {
      setPaymentAmount(s.remainingDue);
    } else {
      setPaymentAmount('');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) {
      setError(lang === 'bn' ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student');
      return;
    }
    const amt = Number(paymentAmount) || 0;
    if (amt <= 0) {
      setError(lang === 'bn' ? 'টাকার পরিমাণ লিখুন' : 'Enter a valid amount');
      return;
    }
    if (amt > activeStudent.remainingDue) {
      setError(t.paymentCannotExceedDue + ` (বকেয়া: ৳${activeStudent.remainingDue})`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onAddPayment({
        studentId: activeStudent.id,
        amount: amt,
        paymentMethod,
        date: paymentDate,
        notes,
      });
      setIsAddModalOpen(false);
      setPaymentAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-orange-600" />
            <span>{t.navPayments}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'শিক্ষার্থী ফি জমা, কিস্তি এবং মানি রিসিট প্রদান' : 'Student fee collection, installment ledger & receipts'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {students.filter(s => s.remainingDue > 0).length > 0 && (
            <button
              onClick={() => {
                if (onOpenDuePaymentModal) {
                  onOpenDuePaymentModal();
                } else {
                  handleOpenAddModal();
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs md:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {lang === 'bn' 
                  ? `বকেয়া টাকা পরিশোধ করুন (${toBengaliNumber(students.filter(s => s.remainingDue > 0).length)} জন)` 
                  : `Pay Due (${students.filter(s => s.remainingDue > 0).length})`}
              </span>
            </button>
          )}

          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold text-xs md:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addPayment}</span>
          </button>
        </div>
      </div>

      {/* Outstanding Dues Quick Collection Bar (If dues exist) */}
      {students.filter(s => s.remainingDue > 0).length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                {lang === 'bn' ? 'বকেয়া শিক্ষার্থী তালিকা ও দ্রুত আদায়' : 'Outstanding Student Dues & Quick Collect'}
              </h3>
            </div>
            <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-lg border border-amber-200">
              {lang === 'bn' 
                ? `মোট বকেয়া: ${formatCurrency(students.reduce((acc, s) => acc + s.remainingDue, 0), lang)}` 
                : `Total Due: ${formatCurrency(students.reduce((acc, s) => acc + s.remainingDue, 0), lang)}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {students
              .filter(s => s.remainingDue > 0)
              .slice(0, 6)
              .map(s => (
                <div 
                  key={s.id} 
                  className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-xs flex items-center justify-between hover:border-amber-400 transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-800 truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>{s.serial}</span>
                      <span>•</span>
                      <span className="truncate">{s.course}</span>
                    </div>
                    <div className="text-xs font-black text-amber-700 mt-0.5">
                      {lang === 'bn' ? 'বকেয়া: ' : 'Due: '}{formatCurrency(s.remainingDue, lang)}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenDuePaymentModal) {
                        onOpenDuePaymentModal(s);
                      } else {
                        handleOpenAddModal(s);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'জমা নিন' : 'Collect'}</span>
                  </button>
                </div>
              ))}
          </div>

          {students.filter(s => s.remainingDue > 0).length > 6 && (
            <div className="text-right mt-2">
              <button
                onClick={() => {
                  if (onOpenDuePaymentModal) {
                    onOpenDuePaymentModal();
                  } else {
                    handleOpenAddModal();
                  }
                }}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                {lang === 'bn' 
                  ? `আরও ${toBengaliNumber(students.filter(s => s.remainingDue > 0).length - 6)} জন বকেয়া শিক্ষার্থীর তালিকা দেখুন →` 
                  : `View all ${students.filter(s => s.remainingDue > 0).length} due students →`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
          >
            <option value="ALL">{lang === 'bn' ? 'সকল পেমেন্ট মেথড' : 'All Payment Methods'}</option>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Bkash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{t.slipNumber}</th>
                <th className="py-3.5 px-3">{t.paymentDate}</th>
                <th className="py-3.5 px-4">{t.studentName}</th>
                <th className="py-3.5 px-3">{t.serial}</th>
                <th className="py-3.5 px-3">{t.course}</th>
                <th className="py-3.5 px-3 text-right">{t.previousDue}</th>
                <th className="py-3.5 px-3 text-right">{t.paymentAmount}</th>
                <th className="py-3.5 px-3 text-right">{t.currentDue}</th>
                <th className="py-3.5 px-3 text-center">{t.paymentMethod}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                    {t.noPaymentsRecorded}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => {
                  const student = students.find(s => s.id === pay.studentId);
                  return (
                    <tr key={pay.id} className="hover:bg-orange-50/40 transition-colors">
                      {/* Slip ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500 text-xs">
                        {pay.id}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(pay.date, lang)}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {pay.studentName}
                      </td>

                      {/* Serial */}
                      <td className="py-3.5 px-3 font-mono text-orange-600 font-bold">
                        {pay.studentSerial}
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
                          {pay.course}
                        </span>
                      </td>

                      {/* Previous Due */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-500">
                        {formatCurrency(pay.previousDue, lang)}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-3 text-right font-black text-emerald-600 text-sm">
                        {formatCurrency(pay.amount, lang)}
                      </td>

                      {/* Current Due */}
                      <td className="py-3.5 px-3 text-right font-bold text-amber-600">
                        {formatCurrency(pay.currentDue, lang)}
                      </td>

                      {/* Method Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.paymentMethod === 'Bank' 
                            ? 'bg-blue-100 text-blue-800' 
                            : pay.paymentMethod === 'Cash' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {pay.paymentMethod}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Print/Download Receipt */}
                          <button
                            onClick={() => {
                              if (student) {
                                onOpenReceiptModal(student, pay);
                              }
                            }}
                            title={t.receipt}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Delete Payment (Protected) */}
                          <button
                            onClick={() => onRequestDeletePayment(pay)}
                            title={t.deleteStudent}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PAYMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{t.addPayment}</h3>
                  <p className="text-xs text-orange-100">JONOTA EQUIPMENT TRAINING CENTER</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.studentName} *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-bold text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.serial}) — {s.course} [বকেয়া: ৳{s.remainingDue}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Summary Card */}
              {activeStudent && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.course}:</span>
                    <span className="font-bold text-slate-800">{activeStudent.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.courseFee}:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(activeStudent.courseFee, lang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.totalPaid}:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(activeStudent.totalPaid, lang)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span className="text-amber-800">{t.remainingDue}:</span>
                    <span className="text-amber-700 font-black">{formatCurrency(activeStudent.remainingDue, lang)}</span>
                  </div>
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t.paymentAmount} (৳) *
                  </label>
                  {activeStudent && activeStudent.remainingDue > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(activeStudent.remainingDue)}
                      className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                    >
                      {lang === 'bn' ? 'সম্পূর্ণ বকেয়া পূরণ করুন' : 'Fill Full Due'}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeStudent?.remainingDue || undefined}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="5000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none font-black text-emerald-600"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
                >
                  <option value="Cash">{t.cash}</option>
                  <option value="Bank">{t.bank}</option>
                  <option value="Bkash">{t.bkash}</option>
                  <option value="Nagad">{t.nagad}</option>
                  <option value="Other">{t.other}</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {paymentMethod === 'Bank' 
                    ? (lang === 'bn' ? 'ব্যাংক সিলেক্ট করলে সরাসরি ব্যাংক লেজারে জমা হবে।' : 'Bank method directly credits the Bank Ledger.')
                    : (lang === 'bn' ? 'ক্যাশ সিলেক্ট করলে সরাসরি Net Cash লেজারে যুক্ত হবে।' : 'Cash credits the Net Cash Ledger.')}
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.paymentDate}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.notes}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Installment 2 cheque/tx info..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !activeStudent || activeStudent.remainingDue <= 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Processing...' : t.addPayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
