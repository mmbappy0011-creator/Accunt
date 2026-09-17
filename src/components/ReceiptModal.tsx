import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  X, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle,
  Tractor,
  HardHat,
  ShieldCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language, translations } from '../i18n';
import { Student, Payment } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  payment?: Payment | null;
  lang: Language;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  student,
  payment,
  lang,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const t = translations[lang];

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

  if (!isOpen || !student) return null;

  // Determine current receipt figures
  const totalFee = student.courseFee;
  const currentPayment = payment ? payment.amount : student.totalPaid;
  const previousPaid = payment ? (payment.previousDue !== undefined ? totalFee - payment.previousDue : 0) : 0;
  const totalPaid = payment ? previousPaid + currentPayment : student.totalPaid;
  const remainingDue = payment ? payment.currentDue : student.remainingDue;
  const payMethod = payment ? payment.paymentMethod : 'Cash';
  const payDate = payment ? payment.date : student.admissionDate;
  const receiptNo = payment ? payment.id : `SLIP-${student.serial}`;

  // Download JPG handler via html2canvas
  const handleDownloadJpg = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Jonota_Receipt_${student.serial}_${payDate}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate JPG receipt:', err);
    } finally {
      setDownloading(false);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const text = 
      `*JONOTA EQUIPMENT TRAINING CENTER*\n` +
      `*Official Money Receipt*\n` +
      `---------------------------\n` +
      `Student: ${student.name}\n` +
      `Serial: ${student.serial}\n` +
      `Father: ${student.fatherName || 'N/A'}\n` +
      `Course: ${student.course}\n` +
      `Date: ${payDate}\n` +
      `Total Fee: ৳${totalFee.toLocaleString('en-IN')}\n` +
      `Amount Paid: ৳${currentPayment.toLocaleString('en-IN')}\n` +
      `Total Paid: ৳${totalPaid.toLocaleString('en-IN')}\n` +
      `Remaining Due: ৳${remainingDue.toLocaleString('en-IN')}\n` +
      `Status: ${remainingDue === 0 ? 'PAID' : 'DUE'}\n` +
      `Method: ${payMethod}\n` +
      `Authorized: Omar Faroque\n` +
      `Training Center: JONOTA ETC\n` +
      `---------------------------`;

    const encoded = encodeURI(text);
    const phone = student.mobile ? student.mobile.replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=88${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden my-8">
        
        {/* Modal Controls Bar */}
        <div className="p-3.5 md:p-4 bg-slate-900 text-white flex items-center justify-between no-print sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Prominent Back / Exit Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              title={lang === 'bn' ? 'পিছনে যান / বন্ধ করুন' : 'Go Back / Close'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? '← পিছনে যান' : '← Go Back'}</span>
            </button>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            <div className="hidden sm:flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-xs md:text-sm">{t.paymentSlipTitle}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download JPG */}
            <button
              onClick={handleDownloadJpg}
              disabled={downloading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-xs cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">{downloading ? 'Processing...' : t.downloadReceiptJpg}</span>
            </button>

            {/* Share WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-xs cursor-pointer"
              title={t.shareWhatsapp}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.shareWhatsapp}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title={t.printSlip}
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Clear Close Button with text and icon */}
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-xs border border-slate-700"
              title={lang === 'bn' ? 'রিসিপ্ট বন্ধ করুন' : 'Close Receipt'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
            </button>
          </div>
        </div>

        {/* RECEIPT CANVAS (Exported to High-Res JPG & Print Friendly) */}
        <div className="p-6 md:p-8 bg-white" ref={receiptRef}>
          {/* Subtle In-canvas Back Banner (Ignored during JPG export and print) */}
          <div 
            data-html2canvas-ignore="true" 
            className="no-print mb-4 p-2.5 bg-orange-50 border border-orange-200/80 rounded-xl flex items-center justify-between text-xs text-orange-950 font-medium"
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{lang === 'bn' ? 'অফিসিয়াল মানি রিসিট প্রিভিউ' : 'Official Money Receipt Preview'}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-white hover:bg-orange-100 text-orange-800 font-bold text-xs border border-orange-300 shadow-xs cursor-pointer transition active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফিরে যান' : 'Go Back'}</span>
            </button>
          </div>

          <div className="border-4 border-orange-500 rounded-3xl p-6 md:p-8 relative bg-white overflow-hidden shadow-inner">
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
              <Tractor className="w-96 h-96 text-orange-600" />
            </div>

            {/* Header */}
            <div className="text-center pb-6 border-b-2 border-orange-500/30 relative">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <HardHat className="w-3.5 h-3.5 text-orange-600" />
                <span>GOVT. REGD. HEAVY EQUIPMENT TRAINING CENTER</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-orange-600 uppercase">
                {t.receiptHeader}
              </h1>
              <h2 className="text-xs md:text-sm font-bold text-slate-700 mt-0.5">
                {lang === 'bn' ? 'জনতা ইকুইপমেন্ট ট্রেনিং সেন্টার' : 'Jonota Equipment Training Center'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                Dhaka-Chittagong Highway, Siddhirganj, Narayanganj • Mobile: 01711-000000
              </p>

              {/* Receipt Number & Date Badge */}
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-600 px-2">
                <span className="bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  {t.slipNumber}: <span className="font-mono text-orange-700">{receiptNo}</span>
                </span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {t.paymentDate}: <span className="text-slate-800">{formatDate(payDate, lang)}</span>
                </span>
              </div>
            </div>

            {/* Student Information Grid */}
            <div className="my-6 grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">{t.studentName}:</span>
                  <span className="text-sm font-extrabold text-slate-800">{student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">{t.fathersName}:</span>
                  <span className="font-bold text-slate-700">{student.fatherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">{t.mobileNumber}:</span>
                  <span className="font-bold text-slate-700">{student.mobile || '—'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">{t.serial}:</span>
                  <span className="text-sm font-mono font-extrabold text-orange-600">{student.serial}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">{t.course}:</span>
                  <span className="text-xs font-bold text-slate-800 px-2 py-0.5 rounded bg-orange-100/70 text-orange-800 inline-block">
                    {student.course}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">{t.paymentMethod}:</span>
                  <span className="font-bold text-slate-700">{payMethod}</span>
                </div>
              </div>
            </div>

            {/* Financial Calculation Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-orange-50/80 text-orange-900 border-b border-slate-200 text-[11px] font-extrabold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">{lang === 'bn' ? 'বিবরণ' : 'Description'}</th>
                    <th className="py-2.5 px-4 text-right">{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4">{t.courseFee} ({student.course})</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800">{formatCurrency(totalFee, lang)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">{lang === 'bn' ? 'পূর্বের পরিশোধিত ফি' : 'Previous Paid'}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-600">{formatCurrency(previousPaid, lang)}</td>
                  </tr>
                  <tr className="bg-orange-50/30">
                    <td className="py-2.5 px-4 font-bold text-orange-800">{lang === 'bn' ? 'বর্তমান জমার পরিমাণ' : 'Current Payment'}</td>
                    <td className="py-2.5 px-4 text-right font-black text-orange-600 text-sm">{formatCurrency(currentPayment, lang)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold">{t.totalPaid}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{formatCurrency(totalPaid, lang)}</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="py-2.5 px-4 font-bold text-amber-900">{t.remainingDue}</td>
                    <td className="py-2.5 px-4 text-right font-black text-amber-700 text-sm">{formatCurrency(remainingDue, lang)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Status & Footer */}
            <div className="flex items-center justify-between pb-8">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t.paymentStatus}:</span>
                {remainingDue === 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PAID (পরিশোধিত)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                    DUE (বকেয়া আছে)
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block">{t.trainingCenterOffice}</span>
                <span className="text-xs font-bold text-slate-800">Jonota Training Management System</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="h-10 flex items-end justify-center font-script text-slate-600 italic">
                  {student.name}
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-600 text-[11px]">
                  {lang === 'bn' ? 'শিক্ষার্থীর স্বাক্ষর' : "Student's Signature"}
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

            {/* System Verification Tag */}
            <div className="mt-6 text-center text-[10px] text-slate-400 font-medium">
              * This is an officially generated computer slip from JONOTA EQUIPMENT TRAINING CENTER ERP system.
            </div>
          </div>
        </div>

        {/* Modal Bottom Navigation & Actions Bar (no-print) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs md:text-sm flex items-center justify-center space-x-2 transition cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>{lang === 'bn' ? '← বের হন / ফিরে যান' : '← Exit / Go Back'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={downloading}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloading
                  ? (lang === 'bn' ? 'রিসিপ্ট তৈরি হচ্ছে...' : 'Generating...')
                  : (lang === 'bn' ? 'রিসিপ্ট ডাউনলোড (JPG)' : 'Download Receipt')}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-xs cursor-pointer"
              title={t.shareWhatsapp}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.shareWhatsapp}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-xs cursor-pointer"
              title={t.printSlip}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
