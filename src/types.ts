export type PaymentMethod = 'Cash' | 'Bank' | 'Bkash' | 'Nagad' | 'Other';

export type PaymentStatus = 'PAID' | 'DUE';

export type ExpenseCategory = 
  | 'Electricity' 
  | 'Certificate / Card' 
  | 'Fuel / Octane' 
  | 'Maintenance' 
  | 'Food' 
  | 'Transport / Vara' 
  | 'Other';

export type StaffTransactionType = 'Salary' | 'Advance' | 'Withdrawal' | 'Loan';

export type BankTransactionType = 
  | 'Student Payment' 
  | 'Office Deposit' 
  | 'Bank Expense' 
  | 'Adjustment' 
  | 'Bank To Net Cash';

export interface Student {
  id: string;
  serial: string;
  admissionDate: string; // YYYY-MM-DD
  name: string;
  fatherName: string;
  mobile: string;
  address: string;
  course: string;
  courseFee: number;
  totalPaid: number;
  remainingDue: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentSerial: string;
  studentName: string;
  fatherName: string;
  course: string;
  date: string; // YYYY-MM-DD
  amount: number;
  previousDue: number;
  currentDue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface OfficeExpense {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'Cash' | 'Bank';
  notes?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  designation?: string;
  role?: string;
  mobile?: string;
  phone?: string;
  baseSalary?: number;
  totalReceived?: number;
  currentMonthReceived?: number;
  createdAt?: string;
}

export interface StaffTransaction {
  id: string;
  staffId?: string;
  staffName: string;
  date: string;
  type?: StaffTransactionType | string;
  description: StaffTransactionType | string;
  month?: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank';
  notes?: string;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transactionType: BankTransactionType;
  type?: string;
  accountName?: string;
  accountNumber?: string;
  reference?: string;
  paymentId?: string;
  notes?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  fee: number;
  duration: string;
}

export interface AuditLog {
  id: string;
  date: string;
  time: string;
  action: string;
  details: string;
  user: string;
}

export interface AppSettings {
  centerName: string;
  centerSubtitle: string;
  centerTagline: string;
  centerPhone: string;
  centerEmail: string;
  centerAddress: string;
  authorizedSignature: string;
  defaultCourses: Course[];
  inactivityLockMinutes: number;
}

export interface AccountingSummary {
  totalIncome: number;
  totalExpense: number;
  totalOfficeExpense?: number;
  totalBank: number;
  totalDue: number;
  netCash: number;
  totalAdmissions: number;
  totalStaffWithdrawals: number;
  todayExpense: number;
  thisMonthExpense: number;
}

export interface DatabaseState {
  users: Array<{ id: string; username: string; name: string }>;
  students: Student[];
  payments: Payment[];
  expenses: OfficeExpense[];
  staff: StaffMember[];
  staffTransactions: StaffTransaction[];
  bankTransactions: BankTransaction[];
  courses: Course[];
  settings: AppSettings;
  auditLogs: AuditLog[];
}
