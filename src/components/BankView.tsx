import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Calendar, 
  AlertCircle,
  ShieldCheck,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { BankTransaction, BankTransactionType, AccountingSummary } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface BankViewProps {
  bankTransactions: BankTransaction[];
  summary: AccountingSummary | null;
  lang: Language;
  onAddBankTransaction: (payload: {
    type: BankTransactionType;
    amount: number;
    accountName: string;
    accountNumber?: string;
    reference?: string;
    date?: string;
    notes?: string;
  }) => Promise<void>;
  onRequestDeleteBankTransaction: (tx: BankTransaction) => void;
}

export const BankView: React.FC<BankViewProps> = ({
  bankTransactions,
  summary,
  lang,
  onAddBankTransaction,
  onRequestDeleteBankTransaction
}) => {
  const t = translations[lang];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<BankTransactionType>('Deposit');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountName, setAccountName] = useState('Islami Bank Bangladesh PLC');
  const [accountNumber, setAccountNumber] = useState('20501234567890');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bank In / Out calculation
  const totalIn = bankTransactions
    .filter(t => t.type === 'Deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = bankTransactions
    .filter(t => t.type === 'Withdrawal' || t.type === 'Transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const bankBalance = summary ? summary.totalBank : (totalIn - totalOut);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError(lang === 'bn' ? 'লেনদেনের পরিমাণ লিখুন' : 'Enter a valid amount');
      return;
    }

    if ((type === 'Withdrawal' || type === 'Transfer') && amt > bankBalance) {
      setError(lang === 'bn' ? 'ব্যাংক ব্যালেন্সের বেশি উত্তোলন সম্ভব নয়' : 'Amount exceeds current bank balance');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onAddBankTransaction({
        type,
        amount: amt,
        accountName,
        accountNumber,
        reference,
        date,
        notes,
      });
      setIsModalOpen(false);
      setAmount('');
      setReference('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>{t.navBank}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' ? 'ব্যাংক জমা, উত্তোলন ও অর্থ স্থানান্তর লেজার' : 'Bank deposits, withdrawals, transfers & institutional ledger'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs md:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.bankTransaction}</span>
        </button>
      </div>

      {/* Critical Cash-to-Bank Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-extrabold text-blue-950">
            {lang === 'bn' ? 'ব্যাংক হিসাব নীতি (Cash / Bank Segregation)' : 'Strict Accounting Segregation Principle'}
          </div>
          <p className="text-blue-800/90 mt-0.5 leading-relaxed">
            {lang === 'bn'
              ? 'ক্যাশ থেকে ব্যাংকে জমা টাকা স্থানান্তর মাত্র। এটি কোনো ব্যয় নয় এবং এর কারণে নিট লাভ হ্রাস পাবে না। কেবল টাকার অবস্থান ক্যাশ থেকে ব্যাংকে পরিবর্তিত হবে।'
              : 'Depositing cash into the bank moves funds from drawer cash into the bank ledger. It is NEVER counted as an office expense or loss.'}
          </p>
        </div>
      </div>

      {/* 3 Bank Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bank Balance */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/30 to-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {t.bankBalance}
            </span>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            {formatCurrency(bankBalance, lang)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {lang === 'bn' ? 'বর্তমান সক্রিয় ব্যাংকিং স্থিতি' : 'Available institutional balance'}
          </span>
        </div>

        {/* Total Deposited (In) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              {t.bankIn}
            </span>
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrency(totalIn, lang)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {lang === 'bn' ? 'ব্যাংকে মোট জমাকৃত অর্থ' : 'Total lifetime deposits'}
          </span>
        </div>

        {/* Total Withdrawn (Out) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              {t.bankOut}
            </span>
            <ArrowDownLeft className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700">
            {formatCurrency(totalOut, lang)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {lang === 'bn' ? 'ব্যাংক থেকে মোট উত্তোলন' : 'Total withdrawals & transfers'}
          </span>
        </div>
      </div>

      {/* Bank Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {t.bankStatement}
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {lang === 'bn' ? `মোট ${toBengaliNumber(bankTransactions.length)}টি রেকর্ড` : `${bankTransactions.length} records`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{t.slipNumber}</th>
                <th className="py-3.5 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3.5 px-3">{t.transactionType}</th>
                <th className="py-3.5 px-4">{t.bankAccount}</th>
                <th className="py-3.5 px-3">{lang === 'bn' ? 'রেফারেন্স / চেক' : 'Reference'}</th>
                <th className="py-3.5 px-3 text-right">{t.expenseAmount}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bankTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    {lang === 'bn' ? 'কোন ব্যাংক লেনদেন পাওয়া যায়নি' : 'No bank transactions recorded'}
                  </td>
                </tr>
              ) : (
                bankTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      {tx.id}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(tx.date, lang)}
                    </td>

                    <td className="py-3.5 px-3">
                      {tx.type === 'Deposit' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          <span>{t.bankDeposit}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                          <span>{tx.type === 'Transfer' ? t.bankTransfer : t.bankWithdrawal}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{tx.accountName}</div>
                      {tx.accountNumber && (
                        <div className="text-[11px] font-mono text-slate-400">{tx.accountNumber}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-slate-500">
                      {tx.reference || '—'}
                    </td>

                    <td className={`py-3.5 px-3 text-right font-black text-sm ${
                      tx.type === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.type === 'Deposit' ? '+' : '-'} {formatCurrency(tx.amount, lang)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onRequestDeleteBankTransaction(tx)}
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

      {/* ADD BANK TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{t.bankTransaction}</h3>
                  <p className="text-xs text-blue-100">JONOTA EQUIPMENT TRAINING CENTER</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Transaction Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.transactionType}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('Deposit')}
                    className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center space-x-2 transition ${
                      type === 'Deposit'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{t.bankDeposit} (Cash In)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Withdrawal')}
                    className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center space-x-2 transition ${
                      type === 'Withdrawal'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>{t.bankWithdrawal} (Out)</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.expenseAmount} (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-black text-blue-700"
                />
              </div>

              {/* Bank Account Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'হিসাব নম্বর' : 'Account Number'}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'চেক নম্বর / রেফারেন্স' : 'Check No / Ref'}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="CHQ-890214"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : t.bankTransaction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
