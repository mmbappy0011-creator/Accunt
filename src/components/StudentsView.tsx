import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  CreditCard, 
  Edit, 
  Trash2, 
  FileText, 
  Phone, 
  MapPin, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { Student, Course, PaymentMethod } from '../types';
import { formatCurrency, formatDate, toBengaliNumber } from '../utils/formatters';

interface StudentsViewProps {
  students: Student[];
  courses: Course[];
  lang: Language;
  onAddStudent: (payload: any) => Promise<void>;
  onUpdateStudent: (id: string, payload: any) => Promise<void>;
  onRequestDeleteStudent: (student: Student) => void;
  onOpenPaymentModal: (student: Student) => void;
  onOpenDuePaymentModal?: (student?: Student) => void;
  onOpenReceiptModal: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  courses,
  lang,
  onAddStudent,
  onUpdateStudent,
  onRequestDeleteStudent,
  onOpenPaymentModal,
  onOpenDuePaymentModal,
  onOpenReceiptModal
}) => {
  const t = translations[lang];

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'due'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    mobile: '',
    address: '',
    course: courses[0]?.name || 'Forklift',
    courseFee: courses[0]?.fee || 12000,
    initialPayment: 0,
    paymentMethod: 'Cash' as PaymentMethod,
    admissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          s.name.toLowerCase().includes(query) ||
          (s.mobile || '').toLowerCase().includes(query) ||
          s.serial.toLowerCase().includes(query) ||
          (s.fatherName || '').toLowerCase().includes(query);

        const matchesCourse = selectedCourse === 'ALL' || s.course === selectedCourse;
        const matchesStatus = selectedStatus === 'ALL' || s.paymentStatus === selectedStatus;

        return matchesSearch && matchesCourse && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'due') {
          return b.remainingDue - a.remainingDue;
        }
        // Newest admission date first
        return new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime();
      });
  }, [students, searchQuery, selectedCourse, selectedStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const handleOpenAddModal = () => {
    const defaultCourse = courses[0] || { name: 'Forklift', fee: 12000 };
    setFormData({
      name: '',
      fatherName: '',
      mobile: '',
      address: '',
      course: defaultCourse.name,
      courseFee: defaultCourse.fee,
      initialPayment: 0,
      paymentMethod: 'Cash',
      admissionDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      fatherName: student.fatherName || '',
      mobile: student.mobile || '',
      address: student.address || '',
      course: student.course,
      courseFee: student.courseFee,
      initialPayment: 0,
      paymentMethod: 'Cash',
      admissionDate: student.admissionDate,
      notes: student.notes || '',
    });
    setFormError('');
  };

  const handleCourseChange = (courseName: string) => {
    const selected = courses.find((c) => c.name === courseName);
    setFormData(prev => ({
      ...prev,
      course: courseName,
      courseFee: selected ? selected.fee : prev.courseFee
    }));
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(t.requiredField + ' (' + t.studentName + ')');
      return;
    }
    if (formData.courseFee < 0) {
      setFormError(t.invalidNumber);
      return;
    }
    if (formData.initialPayment < 0 || formData.initialPayment > formData.courseFee) {
      setFormError(t.paymentCannotExceedDue);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, {
          name: formData.name.trim(),
          fatherName: formData.fatherName.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
          course: formData.course,
          courseFee: Number(formData.courseFee),
          notes: formData.notes,
        });
        setEditingStudent(null);
      } else {
        await onAddStudent({
          name: formData.name.trim(),
          fatherName: formData.fatherName.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
          course: formData.course,
          courseFee: Number(formData.courseFee),
          initialPayment: Number(formData.initialPayment),
          paymentMethod: formData.paymentMethod,
          admissionDate: formData.admissionDate,
          notes: formData.notes,
        });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
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
            <GraduationCap className="w-6 h-6 text-orange-600" />
            <span>{t.navStudents}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? `মোট নিবন্ধিত শিক্ষার্থী: ${toBengaliNumber(students.length)} জন` 
              : `Total enrolled students: ${students.length}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {students.filter(s => s.remainingDue > 0).length > 0 && (
            <button
              onClick={() => {
                if (onOpenDuePaymentModal) {
                  onOpenDuePaymentModal();
                } else {
                  const firstDue = students.find(s => s.remainingDue > 0);
                  if (firstDue) onOpenPaymentModal(firstDue);
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs md:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {lang === 'bn' 
                  ? `বকেয়া পরিশোধ (${toBengaliNumber(students.filter(s => s.remainingDue > 0).length)} জন)` 
                  : `Pay Due (${students.filter(s => s.remainingDue > 0).length})`}
              </span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold text-xs md:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addStudent}</span>
          </button>
        </div>
      </div>

      {/* Search, Filter and Sorting Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box (6 cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition"
            />
          </div>

          {/* Filter Course (2 cols) */}
          <div className="lg:col-span-3">
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
            >
              <option value="ALL">{t.allCourses}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Status (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
            >
              <option value="ALL">{t.allStatuses}</option>
              <option value="PAID">{t.paidBadge}</option>
              <option value="DUE">{t.dueBadge}</option>
            </select>
          </div>

          {/* Sort By (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold text-slate-700"
            >
              <option value="date">{t.sortByDate}</option>
              <option value="due">{t.sortByDue}</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 mr-1">
            {lang === 'bn' ? 'দ্রুত ফিল্টার:' : 'Quick Filters:'}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lang === 'bn' ? `সকল শিক্ষার্থী (${toBengaliNumber(students.length)})` : `All (${students.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('DUE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'DUE'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn' 
                ? `বকেয়া শিক্ষার্থী (${toBengaliNumber(students.filter(s => s.remainingDue > 0).length)} জন)` 
                : `Due Only (${students.filter(s => s.remainingDue > 0).length})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('PAID');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'PAID'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn' 
                ? `পরিশোধিত (${toBengaliNumber(students.filter(s => s.remainingDue <= 0).length)})` 
                : `Paid (${students.filter(s => s.remainingDue <= 0).length})`}
            </span>
          </button>
        </div>
      </div>

      {/* STUDENT TABLE (Section 34) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{t.serial}</th>
                <th className="py-3.5 px-3">{t.admissionDate}</th>
                <th className="py-3.5 px-4">{t.studentName}</th>
                <th className="py-3.5 px-3">{t.fathersName}</th>
                <th className="py-3.5 px-3">{t.course}</th>
                <th className="py-3.5 px-3 text-right">{t.courseFee}</th>
                <th className="py-3.5 px-3 text-right">{t.totalPaid}</th>
                <th className="py-3.5 px-3 text-right">{t.remainingDue}</th>
                <th className="py-3.5 px-3 text-center">{t.paymentStatus}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                    {t.noStudentsFound}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-orange-50/40 transition-colors"
                  >
                    {/* Serial */}
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-600 text-xs">
                      {student.serial}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(student.admissionDate, lang)}
                    </td>

                    {/* Student Name & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      {student.mobile && (
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{student.mobile}</span>
                        </div>
                      )}
                    </td>

                    {/* Father's Name */}
                    <td className="py-3.5 px-3 text-slate-600">
                      {student.fatherName || '—'}
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {student.course}
                      </span>
                    </td>

                    {/* Total Fee */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                      {formatCurrency(student.courseFee, lang)}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-600">
                      {formatCurrency(student.totalPaid, lang)}
                    </td>

                    {/* Due */}
                    <td className="py-3.5 px-3 text-right font-bold text-amber-600">
                      {formatCurrency(student.remainingDue, lang)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      {student.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.paidBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>{t.dueBadge}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center space-x-1">
                        {/* View Details */}
                        <button
                          onClick={() => setViewingStudent(student)}
                          title={t.viewDetails}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Money Receipt */}
                        <button
                          onClick={() => onOpenReceiptModal(student)}
                          title={t.receipt}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Pay Due Button */}
                        {student.remainingDue > 0 && (
                          <button
                            onClick={() => {
                              if (onOpenDuePaymentModal) {
                                onOpenDuePaymentModal(student);
                              } else {
                                onOpenPaymentModal(student);
                              }
                            }}
                            title={lang === 'bn' ? 'বকেয়া টাকা পরিশোধ করুন' : 'Pay Remaining Due'}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-[11px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'বকেয়া দিন' : 'Pay Due'}</span>
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          title={t.editStudent}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete (Protected with Second Authorization) */}
                        <button
                          onClick={() => onRequestDeleteStudent(student)}
                          title={t.deleteStudent}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            {lang === 'bn' 
              ? `মোট ${toBengaliNumber(filteredStudents.length)} জন শিক্ষার্থীর মধ্যে পৃষ্ঠা ${toBengaliNumber(currentPage)} / ${toBengaliNumber(totalPages)}` 
              : `Showing page ${currentPage} of ${totalPages} (${filteredStudents.length} students)`}
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 px-2">
              {lang === 'bn' ? toBengaliNumber(currentPage) : currentPage}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingStudent ? t.editStudent : t.addStudent}
                  </h3>
                  <p className="text-xs text-orange-100">
                    {editingStudent ? editingStudent.serial : 'JONOTA EQUIPMENT TRAINING CENTER'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.studentName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none"
                    placeholder="Mohammad Karim"
                  />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.fathersName}
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none"
                    placeholder="Abdul Rahim"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.mobileNumber}
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none"
                    placeholder="017XXXXXXXX"
                  />
                </div>

                {/* Admission Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.admissionDate}
                  </label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none"
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.course} *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} — {formatCurrency(c.fee, lang)} ({c.duration})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total Course Fee */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.courseFee} (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.courseFee}
                    onChange={(e) => setFormData({ ...formData, courseFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none font-bold text-slate-800"
                  />
                </div>

                {/* Initial Payment (Only for New Student Enrollment) */}
                {!editingStudent && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'bn' ? 'ভর্তিকালীন ফি জমা (৳)' : 'Initial Payment (৳)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formData.courseFee}
                        value={formData.initialPayment}
                        onChange={(e) => setFormData({ ...formData, initialPayment: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none font-bold text-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.paymentMethod}
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-orange-500 outline-none font-semibold"
                      >
                        <option value="Cash">{t.cash}</option>
                        <option value="Bank">{t.bank}</option>
                        <option value="Bkash">{t.bkash}</option>
                        <option value="Nagad">{t.nagad}</option>
                        <option value="Other">{t.other}</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Automatic Due Preview */}
              {!editingStudent && (
                <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-xl flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">{lang === 'bn' ? 'স্বয়ংক্রিয় বকেয়া হিসাব:' : 'Automatic Due Calculation:'}</span>
                  <span className="text-amber-700 font-extrabold text-sm">
                    {formatCurrency(Math.max(0, formData.courseFee - formData.initialPayment), lang)}
                  </span>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.address}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 outline-none"
                  placeholder="Signboard, Narayanganj"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.notes}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 outline-none"
                  placeholder="Special instructions or student batch..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingStudent ? t.saveChanges : t.addStudent)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENT DETAILS MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{viewingStudent.name}</h3>
                  <p className="text-xs text-orange-100 font-mono">{viewingStudent.serial}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">{t.fathersName}:</span>
                  <span className="font-bold text-slate-800">{viewingStudent.fatherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t.mobileNumber}:</span>
                  <span className="font-bold text-slate-800">{viewingStudent.mobile || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t.course}:</span>
                  <span className="font-bold text-orange-600">{viewingStudent.course}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t.admissionDate}:</span>
                  <span className="font-bold text-slate-800">{formatDate(viewingStudent.admissionDate, lang)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block font-bold">{t.courseFee}</span>
                  <span className="text-sm font-extrabold text-slate-800">{formatCurrency(viewingStudent.courseFee, lang)}</span>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
                  <span className="text-[10px] text-emerald-700 block font-bold">{t.totalPaid}</span>
                  <span className="text-sm font-extrabold text-emerald-700">{formatCurrency(viewingStudent.totalPaid, lang)}</span>
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-center">
                  <span className="text-[10px] text-amber-700 block font-bold">{t.remainingDue}</span>
                  <span className="text-sm font-extrabold text-amber-700">{formatCurrency(viewingStudent.remainingDue, lang)}</span>
                </div>
              </div>

              {viewingStudent.address && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold mb-0.5">{t.address}:</span>
                  <p className="text-slate-700 font-medium">{viewingStudent.address}</p>
                </div>
              )}

              {viewingStudent.notes && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold mb-0.5">{t.notes}:</span>
                  <p className="text-slate-700">{viewingStudent.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const s = viewingStudent;
                    setViewingStudent(null);
                    onOpenReceiptModal(s);
                  }}
                  className="px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-xl flex items-center space-x-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.receipt}</span>
                </button>

                {viewingStudent.remainingDue > 0 && (
                  <button
                    onClick={() => {
                      const s = viewingStudent;
                      setViewingStudent(null);
                      if (onOpenDuePaymentModal) {
                        onOpenDuePaymentModal(s);
                      } else {
                        onOpenPaymentModal(s);
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'বকেয়া পরিশোধ করুন' : 'Pay Outstanding Due'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
