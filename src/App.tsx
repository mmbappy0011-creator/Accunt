import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from './services/api';
import { 
  Student, 
  Payment, 
  OfficeExpense, 
  StaffMember, 
  StaffTransaction, 
  BankTransaction, 
  Course, 
  AuditLog, 
  AccountingSummary 
} from './types';
import { Language, translations } from './i18n';

// Components
import { LoginScreen } from './components/LoginScreen';
import { LockScreen } from './components/LockScreen';
import { TopNav } from './components/TopNav';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { PaymentsView } from './components/PaymentsView';
import { OfficeExpensesView } from './components/OfficeExpensesView';
import { StaffView } from './components/StaffView';
import { BankView } from './components/BankView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthorizationModal } from './components/AuthorizationModal';
import { DuePaymentModal } from './components/DuePaymentModal';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  // Auth & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('jonota_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string } | null>(() => {
    const saved = localStorage.getItem('jonota_user');
    return saved ? JSON.parse(saved) : { username: 'admin', name: 'Omar Faroque' };
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Localization
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('jonota_lang') as Language) || 'bn';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('jonota_lang', newLang);
  };

  // Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Database State
  const [loading, setLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<OfficeExpense[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffTransactions, setStaffTransactions] = useState<StaffTransaction[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);

  // Second-Level Authorization Modal State
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    actionDescription: string;
    onVerified: (password: string) => Promise<void>;
  }>({
    isOpen: false,
    actionDescription: '',
    onVerified: async () => {},
  });

  // Receipt Modal State
  const [receiptState, setReceiptState] = useState<{
    isOpen: boolean;
    student: Student | null;
    payment: Payment | null;
  }>({
    isOpen: false,
    student: null,
    payment: null,
  });

  // Dedicated Due Payment Modal State
  const [duePaymentModal, setDuePaymentModal] = useState<{
    isOpen: boolean;
    student: Student | null;
  }>({
    isOpen: false,
    student: null,
  });

  // Load All Data from Persistent API
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ApiService.fetchInitialData();
      const dbData = res.data;
      setStudents(dbData.students || []);
      setPayments(dbData.payments || []);
      setExpenses(dbData.expenses || []);
      setStaff(dbData.staff || []);
      setStaffTransactions(dbData.staffTransactions || []);
      setBankTransactions(dbData.bankTransactions || []);
      setCourses(dbData.courses || []);
      setAuditLogs(dbData.auditLogs || []);
      setSummary(res.summary || null);
      setInitError(null);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setInitError(err.message || 'Failed to connect to accounting server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  // Auth Handlers
  const handleLoginSuccess = (user: { username: string; name: string }) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('jonota_auth', 'true');
    localStorage.setItem('jonota_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('jonota_auth');
    localStorage.removeItem('jonota_user');
  };

  // Second Authorization Request Helper
  const triggerSecondAuth = (actionDescription: string, onVerified: (authPassword: string) => Promise<void>) => {
    setAuthModal({
      isOpen: true,
      actionDescription,
      onVerified,
    });
  };

  // Student Actions
  const handleAddStudent = async (payload: any) => {
    await ApiService.createStudent(payload);
    await refreshData();
  };

  const handleUpdateStudent = async (id: string, payload: any) => {
    await ApiService.updateStudent(id, payload);
    await refreshData();
  };

  const handleRequestDeleteStudent = (student: Student) => {
    triggerSecondAuth(
      lang === 'bn' 
        ? `শিক্ষার্থী "${student.name}" (${student.serial}) এর সকল তথ্য ও পেমেন্ট রেকর্ড মুছে ফেলতে অনুমোদন দিন`
        : `Authorize deleting student "${student.name}" (${student.serial}) and all linked records`,
      async (authPassword) => {
        await ApiService.deleteStudent(student.id, authPassword);
        await refreshData();
      }
    );
  };

  // Payment Actions
  const handleAddPayment = async (payload: any) => {
    const result = await ApiService.createPayment(payload);
    await refreshData();
    // Prompt receipt if student found
    const student = students.find(s => s.id === payload.studentId);
    if (student && result.payment) {
      setReceiptState({
        isOpen: true,
        student,
        payment: result.payment,
      });
    }
    return result.payment;
  };

  const handleOpenDuePaymentModal = (student?: Student) => {
    setDuePaymentModal({
      isOpen: true,
      student: student || null,
    });
  };

  const handleRequestDeletePayment = (payment: Payment) => {
    triggerSecondAuth(
      lang === 'bn'
        ? `মানি রিসিট #${payment.id} (টাকা ৳${payment.amount}) মুছে ফেলতে অনুমোদন দিন`
        : `Authorize deleting payment slip #${payment.id} (৳${payment.amount})`,
      async (authPassword) => {
        await ApiService.deletePayment(payment.id, authPassword);
        await refreshData();
      }
    );
  };

  // Expense Actions
  const handleAddExpense = async (payload: any) => {
    await ApiService.createExpense(payload);
    await refreshData();
  };

  const handleRequestDeleteExpense = (expense: OfficeExpense) => {
    triggerSecondAuth(
      lang === 'bn'
        ? `অফিস খরচ ভাউচার #${expense.id} ("${expense.description}" ৳${expense.amount}) মুছতে অনুমোদন দিন`
        : `Authorize deleting expense #${expense.id} ("${expense.description}" ৳${expense.amount})`,
      async (authPassword) => {
        await ApiService.deleteExpense(expense.id, authPassword);
        await refreshData();
      }
    );
  };

  // Staff Actions
  const handleAddStaff = async (payload: any) => {
    await ApiService.createStaff(payload);
    await refreshData();
  };

  const handleUpdateStaff = async (id: string, payload: any) => {
    await ApiService.updateStaff(id, payload);
    await refreshData();
  };

  const handleRequestDeleteStaff = (member: StaffMember) => {
    triggerSecondAuth(
      lang === 'bn'
        ? `স্টাফ প্রোফাইল "${member.name}" মুছে ফেলতে অনুমোদন দিন`
        : `Authorize deleting staff member "${member.name}"`,
      async (authPassword) => {
        await ApiService.deleteStaff(member.id, authPassword);
        await refreshData();
      }
    );
  };

  const handleAddStaffTransaction = async (payload: any) => {
    await ApiService.createStaffTransaction(payload);
    await refreshData();
  };

  const handleRequestDeleteStaffTransaction = (transaction: StaffTransaction) => {
    triggerSecondAuth(
      lang === 'bn'
        ? `স্টাফ লেনদেন #${transaction.id} (${transaction.staffName} ৳${transaction.amount}) মুছতে অনুমোদন দিন`
        : `Authorize deleting staff transaction #${transaction.id} (${transaction.staffName} ৳${transaction.amount})`,
      async (authPassword) => {
        await ApiService.deleteStaffTransaction(transaction.id, authPassword);
        await refreshData();
      }
    );
  };

  // Bank Actions
  const handleAddBankTransaction = async (payload: any) => {
    await ApiService.createBankTransaction(payload);
    await refreshData();
  };

  const handleRequestDeleteBankTransaction = (tx: BankTransaction) => {
    const txLabel = tx.transactionType || tx.type || 'Bank Transaction';
    triggerSecondAuth(
      lang === 'bn'
        ? `ব্যাংক লেনদেন #${tx.id} (${txLabel} ৳${tx.amount}) মুছে ফেলতে অনুমোদন দিন`
        : `Authorize deleting bank record #${tx.id} (${txLabel} ৳${tx.amount})`,
      async (authPassword) => {
        await ApiService.deleteBankTransaction(tx.id, authPassword);
        await refreshData();
      }
    );
  };

  // Reset Database Action
  const handleRequestResetDatabase = () => {
    triggerSecondAuth(
      lang === 'bn'
        ? 'সতর্কতা! সম্পূর্ণ ডাটাবেস রিসেট করে প্রাথমিক অবস্থায় ফিরিয়ে নিতে অনুমোদন দিন'
        : 'CRITICAL: Authorize resetting entire database to initial factory state',
      async (authPassword) => {
        await ApiService.resetDatabase(authPassword);
        await refreshData();
      }
    );
  };

  // 1. If not authenticated, display Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLoginSuccess}
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  // 2. If locked, display Lock Screen
  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} lang={lang} />;
  }

  // Calculate quick indicators
  const dueCount = students.filter(s => s.remainingDue > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Navigation */}
      <TopNav
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onLock={() => setIsLocked(true)}
        onLogoutClick={handleLogout}
        summary={summary}
        currentUser={currentUser}
      />

      <div className="flex-1 flex">
        {/* 3D Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          lang={lang}
          onLock={() => setIsLocked(true)}
          onLogoutClick={handleLogout}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          studentCount={students.length}
          dueCount={dueCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* Global Loading Spinner */}
          {loading && !summary && (
            <div className="flex flex-col items-center justify-center h-96 space-y-3">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">
                {lang === 'bn' ? 'ডাটাবেস লোড হচ্ছে...' : 'Loading accounting records...'}
              </p>
            </div>
          )}

          {/* Connection Error Banner */}
          {initError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-3 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block">{initError}</span>
                <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন বা সার্ভার স্ট্যাটাস চেক করুন।' : 'Please check your connection and retry.'}</span>
              </div>
              <button
                onClick={refreshData}
                className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-xl"
              >
                Retry
              </button>
            </div>
          )}

          {/* Main Views Switcher */}
          {!loading && summary && (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  summary={summary}
                  students={students}
                  courses={courses}
                  lang={lang}
                  onOpenAddStudent={() => setCurrentTab('students')}
                  onOpenAddPayment={() => setCurrentTab('payments')}
                  onOpenDuePayment={() => handleOpenDuePaymentModal()}
                  onOpenAddExpense={() => setCurrentTab('expenses')}
                  onOpenStaffWithdrawal={() => setCurrentTab('staff')}
                  onOpenBankTransaction={() => setCurrentTab('bank')}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'students' && (
                <StudentsView
                  students={students}
                  courses={courses}
                  lang={lang}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onRequestDeleteStudent={handleRequestDeleteStudent}
                  onOpenPaymentModal={(student) => {
                    setCurrentTab('payments');
                  }}
                  onOpenDuePaymentModal={handleOpenDuePaymentModal}
                  onOpenReceiptModal={(student) => {
                    setReceiptState({
                      isOpen: true,
                      student,
                      payment: null,
                    });
                  }}
                />
              )}

              {currentTab === 'payments' && (
                <PaymentsView
                  payments={payments}
                  students={students}
                  lang={lang}
                  onAddPayment={handleAddPayment}
                  onRequestDeletePayment={handleRequestDeletePayment}
                  onOpenReceiptModal={(student, payment) => {
                    setReceiptState({
                      isOpen: true,
                      student,
                      payment: payment || null,
                    });
                  }}
                  onOpenDuePaymentModal={handleOpenDuePaymentModal}
                />
              )}

              {currentTab === 'income' && (
                <PaymentsView
                  payments={payments}
                  students={students}
                  lang={lang}
                  onAddPayment={handleAddPayment}
                  onRequestDeletePayment={handleRequestDeletePayment}
                  onOpenReceiptModal={(student, payment) => {
                    setReceiptState({
                      isOpen: true,
                      student,
                      payment: payment || null,
                    });
                  }}
                  onOpenDuePaymentModal={handleOpenDuePaymentModal}
                />
              )}

              {currentTab === 'expenses' && (
                <OfficeExpensesView
                  expenses={expenses}
                  lang={lang}
                  onAddExpense={handleAddExpense}
                  onRequestDeleteExpense={handleRequestDeleteExpense}
                />
              )}

              {currentTab === 'staff' && (
                <StaffView
                  staff={staff}
                  staffTransactions={staffTransactions}
                  lang={lang}
                  onAddStaff={handleAddStaff}
                  onUpdateStaff={handleUpdateStaff}
                  onRequestDeleteStaff={handleRequestDeleteStaff}
                  onAddStaffTransaction={handleAddStaffTransaction}
                  onRequestDeleteStaffTransaction={handleRequestDeleteStaffTransaction}
                />
              )}

              {currentTab === 'bank' && (
                <BankView
                  bankTransactions={bankTransactions}
                  summary={summary}
                  lang={lang}
                  onAddBankTransaction={handleAddBankTransaction}
                  onRequestDeleteBankTransaction={handleRequestDeleteBankTransaction}
                />
              )}

              {currentTab === 'monthly' && (
                <ReportsView
                  students={students}
                  payments={payments}
                  expenses={expenses}
                  bankTransactions={bankTransactions}
                  courses={courses}
                  auditLogs={auditLogs}
                  staffTransactions={staffTransactions}
                  lang={lang}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  students={students}
                  payments={payments}
                  expenses={expenses}
                  bankTransactions={bankTransactions}
                  courses={courses}
                  auditLogs={auditLogs}
                  staffTransactions={staffTransactions}
                  lang={lang}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  courses={courses}
                  auditLogs={auditLogs}
                  students={students}
                  payments={payments}
                  expenses={expenses}
                  lang={lang}
                  onRefreshData={refreshData}
                  onRequestResetDatabase={handleRequestResetDatabase}
                  onRequestSecondAuth={triggerSecondAuth}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Second-Level Authorization Modal */}
      <AuthorizationModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
        onVerified={authModal.onVerified}
        actionDescription={authModal.actionDescription}
        lang={lang}
      />

      {/* Official Money Receipt Modal */}
      <ReceiptModal
        isOpen={receiptState.isOpen}
        onClose={() => setReceiptState({ isOpen: false, student: null, payment: null })}
        student={receiptState.student}
        payment={receiptState.payment}
        lang={lang}
      />

      {/* Dedicated Due Payment Modal */}
      <DuePaymentModal
        isOpen={duePaymentModal.isOpen}
        onClose={() => setDuePaymentModal({ isOpen: false, student: null })}
        students={students}
        initialStudent={duePaymentModal.student}
        onAddPayment={handleAddPayment}
        onPaymentSuccess={(updatedStudent, payment) => {
          refreshData();
          if (payment) {
            setReceiptState({
              isOpen: true,
              student: updatedStudent,
              payment: payment,
            });
          }
        }}
        lang={lang}
      />
    </div>
  );
}
