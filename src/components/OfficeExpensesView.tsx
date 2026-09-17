import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  Tag,
  CreditCard,
  Building2,
  Wallet
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { OfficeExpense, ExpenseCategory } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface OfficeExpensesViewProps {
  expenses: OfficeExpense[];
  lang: Language;
  onAddExpense: (payload: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    paymentMethod: 'Cash' | 'Bank';
    date?: string;
    notes?: string;
  }) => Promise<void>;
  onRequestDeleteExpense: (expense: OfficeExpense) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Electricity',
  'Certificate / Card',
  'Fuel / Octane',
  'Maintenance',
  'Food',
  'Transport / Vara',
  'Other'
];

export const OfficeExpensesView: React.FC<OfficeExpensesViewProps> = ({
  expenses,
  lang,
  onAddExpense,
  onRequestDeleteExpense
}) => {
  const t = translations[lang];

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Maintenance');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculation of Today, This Month, and Total Expense
  const today = new Date().toISOString().split('T')[0];
  const currentYearMonth = today.slice(0, 7);

  const todayExpense = expenses
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpense = expenses
    .filter(e => (e.date || '').startsWith(currentYearMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Filtered list
  const filteredExpenses = expenses.filter(e => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      e.description.toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q);

    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(t.requiredField + ' (' + t.expenseDescription + ')');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError(lang === 'bn' ? 'খরচের পরিমাণ শূন্যের বেশি হতে হবে' : 'Amount must be greater than zero');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onAddExpense({
        description: description.trim(),
        category,
        amount: amt,
        paymentMethod,
        date,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
      setDescription('');
      setAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-orange-600" />
            <span>{t.navExpenses}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'অফিস পরিচালনা, জ্বালানি, মেরামত ও যন্ত্রপাতি রক্ষণাবেক্ষণ খরচ' : 'Operational, equipment maintenance, fuel & utility expenses'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold text-xs md:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addExpenseTitle}</span>
        </button>
      </div>

      {/* 3 Expense Stat Cards: Today, This Month, Total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.todayExpense}
          </span>
          <div className="text-2xl font-black text-slate-800">
            {formatCurrency(todayExpense, lang)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {formatDate(today, lang)}
          </span>
        </div>

        {/* This Month's Expense */}
        <div className="bg-white p-5 rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50/30 to-white shadow-xs">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
            {t.thisMonthExpense}
          </span>
          <div className="text-2xl font-black text-orange-700">
            {formatCurrency(thisMonthExpense, lang)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {lang === 'bn' ? 'চলতি মাসের মোট অফিস খরচ' : 'Total office expenses this month'}
          </span>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.totalExpense}
          </span>
          <div className="text-2xl font-black text-rose-600">
            {formatCurrency(totalExpense, lang)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lang === 'bn' ? 'সর্বমোট অফিস ও পরিচালন খরচ' : 'Lifetime operational cost'}
          </span>
        </div>
      </div>

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

        <div className="w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
          >
            <option value="ALL">{lang === 'bn' ? 'সকল খরচের খাত' : 'All Categories'}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{t.slipNumber}</th>
                <th className="py-3.5 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3.5 px-4">{t.expenseDescription}</th>
                <th className="py-3.5 px-3">{t.expenseCategory}</th>
                <th className="py-3.5 px-3 text-center">{t.paymentMethod}</th>
                <th className="py-3.5 px-3 text-right">{t.expenseAmount}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    {lang === 'bn' ? 'কোন খরচের এন্ট্রি পাওয়া যায়নি' : 'No expenses recorded yet'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-xs">
                      {exp.id}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(exp.date, lang)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{exp.description}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        exp.paymentMethod === 'Bank' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {exp.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-black text-rose-600 text-sm">
                      {formatCurrency(exp.amount, lang)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onRequestDeleteExpense(exp)}
                        title={t.deleteStudent}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{t.addExpenseTitle}</h3>
                  <p className="text-xs text-orange-100">JONOTA EQUIPMENT TRAINING CENTER</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.expenseDescription} *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Forklift hydraulic oil / Generator fuel..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.expenseCategory}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.expenseAmount} (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="2500"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-orange-500 outline-none font-black text-rose-600"
                />
              </div>

              {/* Payment Method (Cash vs Bank) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'পরিশোধ মাধ্যম (Payment Method)' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                      paymentMethod === 'Cash'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>নগদ ক্যাশ (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Bank')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                      paymentMethod === 'Bank'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>ব্যাংক (Bank)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {paymentMethod === 'Bank' 
                    ? (lang === 'bn' ? 'ব্যাংক সিলেক্ট করলে ব্যাংক লেজার হ্রাস পাবে।' : 'Bank expense reduces Bank balance.')
                    : (lang === 'bn' ? 'ক্যাশ সিলেক্ট করলে Net Cash হ্রাস পাবে।' : 'Cash expense reduces Net Cash.')}
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                  placeholder="Voucher or receipt details..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : t.addExpenseTitle}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
