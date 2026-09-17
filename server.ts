import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default courses
const defaultCourses = [
  { id: 'c1', name: 'Forklift', fee: 12000, duration: '10 Days' },
  { id: 'c2', name: 'Excavator', fee: 25000, duration: '30 Days' },
  { id: 'c3', name: 'Payloader', fee: 25000, duration: '30 Days' },
  { id: 'c4', name: 'Scaffolder', fee: 10000, duration: '15 Days' },
  { id: 'c5', name: 'Video', fee: 1000, duration: 'Self-paced' },
  { id: 'c6', name: 'Cartificat', fee: 4500, duration: 'Official Processing' },
  { id: 'c7', name: 'Other', fee: 5000, duration: 'Custom' },
];

const defaultStaff = [
  { id: 's1', name: 'Farid', role: 'Chief Instructor', phone: '01711000001' },
  { id: 's2', name: 'Hossain', role: 'Equipment Operator', phone: '01711000002' },
  { id: 's3', name: 'Rabbi', role: 'Trainer', phone: '01711000003' },
  { id: 's4', name: 'Rubel', role: 'Field Technician', phone: '01711000004' },
  { id: 's5', name: 'Lisan', role: 'Coordinator', phone: '01711000005' },
  { id: 's6', name: 'Bappy', role: 'Administrator', phone: '01711000006' },
];

// Current date formatted YYYY-MM-DD
const todayStr = new Date().toISOString().split('T')[0];

// Required Accounting Test Scenario Seed:
// Student 1: Fee 12,000, Paid by Bank 12,000 -> Due 0
// Student 2: Fee 12,000, Paid Cash 6,000, Bank 6,000 -> Due 0
// Bank Expense: 1,000
// Expected: Income = 24,000, Expense = 1,000, Bank = 17,000, Net Cash = 6,000, Due = 0
const initialDbData = {
  accountingPassword: process.env.ACCOUNTING_PASSWORD || 'jonota2026',
  settings: {
    centerName: 'JONOTA EQUIPMENT TRAINING CENTER',
    centerSubtitle: 'Jonota Training Management System',
    centerTagline: 'Professional Heavy Equipment Training, Certification & Operator Services',
    centerPhone: '+880 1711-000000',
    centerEmail: 'info@jonotaetc.com',
    centerAddress: 'Dhaka-Chittagong Highway, Siddhirganj, Narayanganj',
    authorizedSignature: 'Omar Faroque',
    defaultCourses: defaultCourses,
    inactivityLockMinutes: 15,
  },
  users: [
    { id: 'u1', username: 'admin', name: 'Omar Faroque (Administrator)' }
  ],
  students: [
    {
      id: 'st-001',
      serial: 'JETC-2026-001',
      admissionDate: todayStr,
      name: 'Mohammad Karim',
      fatherName: 'Abdul Rahim',
      mobile: '01812345678',
      address: 'Signboard, Narayanganj',
      course: 'Forklift',
      courseFee: 12000,
      totalPaid: 12000,
      remainingDue: 0,
      paymentStatus: 'PAID',
      notes: 'Test Student 1 - Full payment via Bank',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'st-002',
      serial: 'JETC-2026-002',
      admissionDate: todayStr,
      name: 'Abdul Alim',
      fatherName: 'Nurul Islam',
      mobile: '01798765432',
      address: 'Kanchpur, Sonargaon',
      course: 'Forklift',
      courseFee: 12000,
      totalPaid: 12000,
      remainingDue: 0,
      paymentStatus: 'PAID',
      notes: 'Test Student 2 - 6k Cash + 6k Bank',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    }
  ],
  payments: [
    {
      id: 'pay-001',
      studentId: 'st-001',
      studentSerial: 'JETC-2026-001',
      studentName: 'Mohammad Karim',
      fatherName: 'Abdul Rahim',
      course: 'Forklift',
      date: todayStr,
      amount: 12000,
      previousDue: 12000,
      currentDue: 0,
      paymentMethod: 'Bank',
      notes: 'Bank Payment Admission Full',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'pay-002',
      studentId: 'st-002',
      studentSerial: 'JETC-2026-002',
      studentName: 'Abdul Alim',
      fatherName: 'Nurul Islam',
      course: 'Forklift',
      date: todayStr,
      amount: 6000,
      previousDue: 12000,
      currentDue: 6000,
      paymentMethod: 'Cash',
      notes: 'Installment 1 - Cash',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'pay-003',
      studentId: 'st-002',
      studentSerial: 'JETC-2026-002',
      studentName: 'Abdul Alim',
      fatherName: 'Nurul Islam',
      course: 'Forklift',
      date: todayStr,
      amount: 6000,
      previousDue: 6000,
      currentDue: 0,
      paymentMethod: 'Bank',
      notes: 'Installment 2 - Bank Transfer',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    }
  ],
  expenses: [
    {
      id: 'exp-001',
      date: todayStr,
      description: 'Forklift Hydraulic Oil & Filter Maintenance (Bank Transfer)',
      category: 'Maintenance',
      amount: 1000,
      paymentMethod: 'Bank',
      notes: 'Paid through Official Bank Account',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    }
  ],
  staff: defaultStaff,
  staffTransactions: [],
  bankTransactions: [
    {
      id: 'bt-001',
      date: todayStr,
      description: 'Student Payment - Mohammad Karim (JETC-2026-001)',
      amount: 12000,
      transactionType: 'Student Payment',
      reference: 'PAY-001',
      paymentId: 'pay-001',
      notes: 'Admission fee direct bank deposit',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'bt-002',
      date: todayStr,
      description: 'Student Payment - Abdul Alim (JETC-2026-002)',
      amount: 6000,
      transactionType: 'Student Payment',
      reference: 'PAY-003',
      paymentId: 'pay-003',
      notes: 'Installment 2 direct bank transfer',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'bt-003',
      date: todayStr,
      description: 'Bank Expense - Hydraulic Maintenance',
      amount: 1000,
      transactionType: 'Bank Expense',
      reference: 'EXP-001',
      notes: 'Official maintenance cheque/debit',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    }
  ],
  courses: defaultCourses,
  auditLogs: [
    {
      id: 'log-001',
      date: todayStr,
      time: '09:00 AM',
      action: 'System Initialized',
      details: 'Jonota Equipment Training Center ERP database mounted with initial test scenario records.',
      user: 'System Admin'
    }
  ]
};

// Database helper functions
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  // Initialize and write default
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDbData, null, 2), 'utf-8');
  return initialDbData;
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Calculate accounting statistics according to the critical cash/bank rules
function calculateAccounting(db: any) {
  const students = db.students || [];
  const payments = db.payments || [];
  const expenses = db.expenses || [];
  const staffTransactions = db.staffTransactions || [];
  const bankTransactions = db.bankTransactions || [];

  // Total Income = Sum of all received student payments (Unpaid due is NOT income)
  const totalIncome = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  // Total Office Expense = Sum of all office expenses
  const totalOfficeExpense = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

  // Total Staff Withdrawal = Sum of staff withdrawals (salaries + advances)
  const totalStaffWithdrawals = staffTransactions.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);

  // Total Expense = Total Office Expenses + Total Staff Salaries & Advances
  const totalExpense = totalOfficeExpense + totalStaffWithdrawals;

  // Total Due = Sum of all student outstanding balances
  const totalDue = students.reduce((sum: number, s: any) => sum + (Number(s.remainingDue) || 0), 0);

  // Cash and Bank Ledger tracking:
  // Payments received in Cash vs Bank:
  let cashFromPayments = 0;
  let bankFromPayments = 0;
  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    if (p.paymentMethod === 'Bank') {
      bankFromPayments += amt;
    } else {
      cashFromPayments += amt;
    }
  }

  // Expenses paid in Cash vs Bank:
  let cashExpenses = 0;
  let bankExpenses = 0;
  for (const e of expenses) {
    const amt = Number(e.amount) || 0;
    if (e.paymentMethod === 'Bank') {
      bankExpenses += amt;
    } else {
      cashExpenses += amt;
    }
  }

  // Staff withdrawals paid in Cash vs Bank:
  let cashStaffWithdrawals = 0;
  let bankStaffWithdrawals = 0;
  for (const st of staffTransactions) {
    const amt = Number(st.amount) || 0;
    if (st.paymentMethod === 'Bank') {
      bankStaffWithdrawals += amt;
    } else {
      cashStaffWithdrawals += amt;
    }
  }

  // Dedicated Bank Transactions (Transfers and adjustments):
  let cashToBankTransfers = 0; // Office Deposit: cash -> bank
  let bankToCashTransfers = 0; // Bank to Cash: bank -> cash
  let otherBankCredits = 0;   // direct adjustment credits
  let otherBankDebits = 0;    // direct adjustment debits / bank fees

  for (const bt of bankTransactions) {
    const amt = Number(bt.amount) || 0;
    if (bt.transactionType === 'Office Deposit') {
      cashToBankTransfers += amt;
    } else if (bt.transactionType === 'Bank To Net Cash') {
      bankToCashTransfers += amt;
    } else if (bt.transactionType === 'Adjustment') {
      if (amt > 0) otherBankCredits += amt;
      else otherBankDebits += Math.abs(amt);
    }
  }

  // Total Bank Ledger Balance:
  // Bank = (Bank Payments) + (Office Deposits: Cash->Bank) + (Bank Credits) 
  //        - (Bank Expenses) - (Bank Staff Withdrawals) - (Bank to Cash Transfers) - (Bank Debits)
  const totalBank = bankFromPayments + cashToBankTransfers + otherBankCredits 
                    - bankExpenses - bankStaffWithdrawals - bankToCashTransfers - otherBankDebits;

  // Net Cash Ledger Balance:
  // Net Cash = (Cash Payments) + (Bank to Cash Transfers) 
  //            - (Cash Expenses) - (Cash Staff Withdrawals) - (Office Deposits: Cash->Bank)
  const netCash = cashFromPayments + bankToCashTransfers 
                  - cashExpenses - cashStaffWithdrawals - cashToBankTransfers;

  // Today and Current Month Expense calculations:
  const today = new Date().toISOString().split('T')[0];
  const currentYearMonth = today.slice(0, 7);

  const todayExpense = expenses
    .filter((e: any) => e.date === today)
    .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    + staffTransactions
    .filter((st: any) => st.date === today)
    .reduce((sum: number, st: any) => sum + (Number(st.amount) || 0), 0);

  const thisMonthExpense = expenses
    .filter((e: any) => (e.date || '').startsWith(currentYearMonth))
    .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    + staffTransactions
    .filter((st: any) => (st.date || '').startsWith(currentYearMonth) || st.month === currentYearMonth)
    .reduce((sum: number, st: any) => sum + (Number(st.amount) || 0), 0);

  return {
    totalIncome,
    totalExpense,
    totalOfficeExpense,
    totalBank,
    totalDue,
    netCash,
    totalAdmissions: students.length,
    totalStaffWithdrawals,
    todayExpense,
    thisMonthExpense,
  };
}

function logAudit(db: any, action: string, details: string, user = 'Admin') {
  if (!db.auditLogs) db.auditLogs = [];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toISOString().split('T')[0];
  db.auditLogs.unshift({
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    date: dateStr,
    time: timeStr,
    action,
    details,
    user
  });
  // Keep last 300 audit records
  if (db.auditLogs.length > 300) {
    db.auditLogs = db.auditLogs.slice(0, 300);
  }
}

// ================= API ROUTES ================= //

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', center: 'Jonota Equipment Training Center' });
});

// Full state + summary
app.get('/api/data', (req, res) => {
  const db = readDb();
  const summary = calculateAccounting(db);
  // Send everything except raw accounting password
  const { accountingPassword, ...safeDb } = db;
  res.json({
    data: safeDb,
    summary,
  });
});

// Verify Accounting Authorization Password
app.post('/api/auth/verify-accounting', (req, res) => {
  const { password } = req.body;
  const db = readDb();
  const currentPassword = db.accountingPassword || 'jonota2026';
  if (password === currentPassword) {
    res.json({ success: true, authorized: true });
  } else {
    res.status(401).json({ success: false, message: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }
});

// Change Accounting Password
app.post('/api/auth/change-accounting-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = readDb();
  if (currentPassword !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
  }
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' });
  }
  db.accountingPassword = newPassword.trim();
  logAudit(db, 'Protected Action', 'Accounting authorization password updated');
  writeDb(db);
  res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
});

// --- STUDENTS ---
app.post('/api/students', (req, res) => {
  const { name, fatherName, mobile, address, course, courseFee, initialPayment, paymentMethod, admissionDate, notes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Student name is required' });
  }
  if (!course) {
    return res.status(400).json({ error: 'Course selection is required' });
  }

  const db = readDb();
  const feeNum = Number(courseFee) || 0;
  const initPayNum = Math.min(Number(initialPayment) || 0, feeNum);
  const remainingDue = Math.max(0, feeNum - initPayNum);

  // Generate unique sequential serial
  const count = (db.students || []).length + 1;
  const serial = `JETC-2026-${String(count).padStart(3, '0')}`;

  const studentId = 'st-' + Date.now();
  const newStudent = {
    id: studentId,
    serial,
    admissionDate: admissionDate || new Date().toISOString().split('T')[0],
    name: name.trim(),
    fatherName: (fatherName || '').trim(),
    mobile: (mobile || '').trim(),
    address: (address || '').trim(),
    course,
    courseFee: feeNum,
    totalPaid: initPayNum,
    remainingDue,
    paymentStatus: remainingDue === 0 ? 'PAID' : 'DUE',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.students.unshift(newStudent);

  // If initial payment was made, record payment entry
  if (initPayNum > 0) {
    const payId = 'pay-' + Date.now();
    const newPayment = {
      id: payId,
      studentId,
      studentSerial: serial,
      studentName: newStudent.name,
      fatherName: newStudent.fatherName,
      course,
      date: newStudent.admissionDate,
      amount: initPayNum,
      previousDue: feeNum,
      currentDue: remainingDue,
      paymentMethod: paymentMethod || 'Cash',
      notes: 'Initial admission fee payment',
      createdAt: new Date().toISOString(),
    };
    db.payments.unshift(newPayment);

    // If payment method is Bank, record Bank Transaction
    if (paymentMethod === 'Bank') {
      db.bankTransactions.unshift({
        id: 'bt-' + Date.now(),
        date: newStudent.admissionDate,
        description: `Student Payment - ${newStudent.name} (${serial})`,
        amount: initPayNum,
        transactionType: 'Student Payment',
        reference: payId,
        paymentId: payId,
        notes: 'Direct admission payment to Bank',
        createdAt: new Date().toISOString(),
      });
    }
  }

  logAudit(db, 'Student Created', `Enrolled ${newStudent.name} (${serial}) for ${course} course. Fee: ৳${feeNum}, Paid: ৳${initPayNum}`);
  writeDb(db);

  res.json({ success: true, student: newStudent, summary: calculateAccounting(db) });
});

// Update student
app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, fatherName, mobile, address, course, courseFee, notes } = req.body;

  const db = readDb();
  const index = (db.students || []).findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const student = db.students[index];
  const oldFee = student.courseFee;
  const newFee = courseFee !== undefined ? Number(courseFee) : oldFee;
  const totalPaid = student.totalPaid || 0;
  const newDue = Math.max(0, newFee - totalPaid);

  db.students[index] = {
    ...student,
    name: name !== undefined ? name.trim() : student.name,
    fatherName: fatherName !== undefined ? fatherName.trim() : student.fatherName,
    mobile: mobile !== undefined ? mobile.trim() : student.mobile,
    address: address !== undefined ? address.trim() : student.address,
    course: course !== undefined ? course : student.course,
    courseFee: newFee,
    remainingDue: newDue,
    paymentStatus: newDue === 0 ? 'PAID' : 'DUE',
    notes: notes !== undefined ? notes : student.notes,
    updatedAt: new Date().toISOString(),
  };

  logAudit(db, 'Student Updated', `Updated student ${student.name} (${student.serial})`);
  writeDb(db);

  res.json({ success: true, student: db.students[index], summary: calculateAccounting(db) });
});

// Delete student (Protected action)
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }

  const student = db.students.find((s: any) => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  // Remove student and related payments & bank transactions
  const relatedPaymentIds = (db.payments || [])
    .filter((p: any) => p.studentId === id)
    .map((p: any) => p.id);

  db.students = db.students.filter((s: any) => s.id !== id);
  db.payments = db.payments.filter((p: any) => p.studentId !== id);
  db.bankTransactions = db.bankTransactions.filter(
    (bt: any) => !bt.paymentId || !relatedPaymentIds.includes(bt.paymentId)
  );

  logAudit(db, 'Student Deleted', `Deleted student ${student.name} (${student.serial}) with associated payment records`);
  writeDb(db);

  res.json({ success: true, summary: calculateAccounting(db) });
});

// --- PAYMENTS ---
app.post('/api/payments', (req, res) => {
  const { studentId, amount, paymentMethod, date, notes } = req.body;
  const payAmt = Number(amount) || 0;

  if (payAmt <= 0) {
    return res.status(400).json({ error: 'পেমেন্টের পরিমাণ শূন্যের বেশি হতে হবে।' });
  }

  const db = readDb();
  const studentIndex = (db.students || []).findIndex((s: any) => s.id === studentId);
  if (studentIndex === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const student = db.students[studentIndex];
  if (payAmt > student.remainingDue) {
    return res.status(400).json({ error: `জমার পরিমাণ বকেয়ার (৳${student.remainingDue}) চেয়ে বেশি হতে পারে না।` });
  }

  const prevDue = student.remainingDue;
  const newDue = Math.max(0, prevDue - payAmt);
  const newTotalPaid = student.totalPaid + payAmt;

  student.totalPaid = newTotalPaid;
  student.remainingDue = newDue;
  student.paymentStatus = newDue === 0 ? 'PAID' : 'DUE';
  student.updatedAt = new Date().toISOString();

  const payId = 'pay-' + Date.now();
  const paymentRecord = {
    id: payId,
    studentId: student.id,
    studentSerial: student.serial,
    studentName: student.name,
    fatherName: student.fatherName,
    course: student.course,
    date: date || new Date().toISOString().split('T')[0],
    amount: payAmt,
    previousDue: prevDue,
    currentDue: newDue,
    paymentMethod: paymentMethod || 'Cash',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  db.payments.unshift(paymentRecord);

  // If Bank, sync to Bank Ledger
  if (paymentMethod === 'Bank') {
    db.bankTransactions.unshift({
      id: 'bt-' + Date.now(),
      date: paymentRecord.date,
      description: `Student Payment - ${student.name} (${student.serial})`,
      amount: payAmt,
      transactionType: 'Student Payment',
      reference: payId,
      paymentId: payId,
      notes: 'Installment payment into Bank',
      createdAt: new Date().toISOString(),
    });
  }

  logAudit(db, 'Payment Created', `Received ৳${payAmt} from ${student.name} (${student.serial}) via ${paymentMethod}. Remaining due: ৳${newDue}`);
  writeDb(db);

  res.json({ success: true, payment: paymentRecord, student, summary: calculateAccounting(db) });
});

// Delete Payment (Protected Action)
app.delete('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }

  const payment = (db.payments || []).find((p: any) => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  // Reverse payment on student record
  const student = (db.students || []).find((s: any) => s.id === payment.studentId);
  if (student) {
    student.totalPaid = Math.max(0, student.totalPaid - payment.amount);
    student.remainingDue = Math.max(0, student.courseFee - student.totalPaid);
    student.paymentStatus = student.remainingDue === 0 ? 'PAID' : 'DUE';
    student.updatedAt = new Date().toISOString();
  }

  // Remove from payments and bank transactions
  db.payments = db.payments.filter((p: any) => p.id !== id);
  db.bankTransactions = db.bankTransactions.filter((bt: any) => bt.paymentId !== id);

  logAudit(db, 'Payment Deleted', `Reversed payment ৳${payment.amount} for ${payment.studentName}`);
  writeDb(db);

  res.json({ success: true, summary: calculateAccounting(db) });
});

// --- OFFICE EXPENSES ---
app.post('/api/expenses', (req, res) => {
  const { description, category, amount, paymentMethod, date, notes } = req.body;
  const amt = Number(amount) || 0;

  if (amt <= 0) {
    return res.status(400).json({ error: 'খরচের পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'খরচের বিবরণ দেওয়া আবশ্যক।' });
  }

  const db = readDb();
  const expId = 'exp-' + Date.now();
  const newExpense = {
    id: expId,
    date: date || new Date().toISOString().split('T')[0],
    description: description.trim(),
    category: category || 'Other',
    amount: amt,
    paymentMethod: paymentMethod || 'Cash',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  db.expenses.unshift(newExpense);

  // If paid via Bank, sync as Bank Expense in bank ledger
  if (paymentMethod === 'Bank') {
    db.bankTransactions.unshift({
      id: 'bt-' + Date.now(),
      date: newExpense.date,
      description: `Bank Expense - ${newExpense.description} (${newExpense.category})`,
      amount: amt,
      transactionType: 'Bank Expense',
      reference: expId,
      notes: newExpense.notes,
      createdAt: new Date().toISOString(),
    });
  }

  logAudit(db, 'Expense Created', `Logged expense: ${newExpense.description} (৳${amt} via ${newExpense.paymentMethod})`);
  writeDb(db);

  res.json({ success: true, expense: newExpense, summary: calculateAccounting(db) });
});

// Delete Expense (Protected Action)
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }

  const exp = (db.expenses || []).find((e: any) => e.id === id);
  if (!exp) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  db.expenses = db.expenses.filter((e: any) => e.id !== id);
  db.bankTransactions = db.bankTransactions.filter((bt: any) => bt.reference !== id);

  logAudit(db, 'Expense Deleted', `Deleted expense: ${exp.description} (৳${exp.amount})`);
  writeDb(db);

  res.json({ success: true, summary: calculateAccounting(db) });
});

// --- STAFF TRANSACTIONS (SALARY & ADVANCE) ---
app.post('/api/staff-transactions', (req, res) => {
  const { staffId, staffName, description, type, month, amount, paymentMethod, date, notes } = req.body;
  const amt = Number(amount) || 0;

  if (amt <= 0) {
    return res.status(400).json({ error: 'টাকার পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।' });
  }

  const db = readDb();
  let resolvedStaffName = (staffName || '').trim();
  let resolvedStaffId = staffId || '';

  // If staffId provided but no staffName, resolve from db.staff
  if (resolvedStaffId && !resolvedStaffName) {
    const member = (db.staff || []).find((s: any) => s.id === resolvedStaffId);
    if (member) {
      resolvedStaffName = member.name;
    }
  }

  // If staffName provided but no staffId, resolve from db.staff
  if (resolvedStaffName && !resolvedStaffId) {
    const member = (db.staff || []).find((s: any) => s.name.toLowerCase() === resolvedStaffName.toLowerCase());
    if (member) {
      resolvedStaffId = member.id;
    }
  }

  if (!resolvedStaffName) {
    return res.status(400).json({ error: 'স্টাফের নাম নির্বাচন করুন।' });
  }

  // Determine transaction type: 'Salary' | 'Advance' | 'Withdrawal'
  const resolvedType = (type || description || 'Salary').trim();
  const txId = 'stx-' + Date.now();
  const txDate = date || new Date().toISOString().split('T')[0];
  const txMonth = month || txDate.slice(0, 7);

  const newStaffTx = {
    id: txId,
    staffId: resolvedStaffId,
    staffName: resolvedStaffName,
    type: resolvedType,
    description: resolvedType,
    month: txMonth,
    amount: amt,
    paymentMethod: paymentMethod || 'Cash',
    date: txDate,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  db.staffTransactions.unshift(newStaffTx);

  // If paid via Bank, sync as Bank Expense in Bank Ledger
  if (newStaffTx.paymentMethod === 'Bank') {
    const bTypeLabel = resolvedType === 'Salary' ? 'বেতন' : resolvedType === 'Advance' ? 'অগ্রিম' : resolvedType;
    db.bankTransactions.unshift({
      id: 'bt-' + Date.now(),
      date: newStaffTx.date,
      type: 'Withdrawal',
      description: `Staff ${bTypeLabel} - ${resolvedStaffName}`,
      amount: amt,
      accountName: 'Islami Bank Bangladesh PLC',
      accountNumber: '20501234567890',
      transactionType: 'Bank Expense',
      reference: txId,
      notes: `Staff payout: ${resolvedType} (${notes || 'No notes'})`,
      createdAt: new Date().toISOString(),
    });
  }

  const typeDisplay = resolvedType === 'Salary' ? 'বেতন' : resolvedType === 'Advance' ? 'অগ্রিম' : resolvedType;
  logAudit(db, 'Staff Transaction', `Staff ${typeDisplay}: ${resolvedStaffName} received ৳${amt} (${typeDisplay}) via ${newStaffTx.paymentMethod}`);
  writeDb(db);

  res.json({ success: true, staffTransaction: newStaffTx, summary: calculateAccounting(db) });
});

// Delete Staff Transaction (Protected Action)
app.delete('/api/staff-transactions/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }

  const tx = (db.staffTransactions || []).find((t: any) => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Staff transaction not found' });
  }

  db.staffTransactions = db.staffTransactions.filter((t: any) => t.id !== id);
  // Also remove associated bank expense if any
  db.bankTransactions = (db.bankTransactions || []).filter((bt: any) => bt.reference !== id);

  logAudit(db, 'Staff Transaction Deleted', `Deleted staff payment of ৳${tx.amount} for ${tx.staffName}`);
  writeDb(db);

  res.json({ success: true, summary: calculateAccounting(db) });
});

// --- BANK TRANSACTIONS ---
app.post('/api/bank-transactions', (req, res) => {
  const { transactionType, description, amount, reference, date, notes } = req.body;
  const amt = Number(amount) || 0;

  if (amt <= 0) {
    return res.status(400).json({ error: 'টাকার পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।' });
  }

  const db = readDb();
  const bId = 'bt-' + Date.now();
  const newBankTx = {
    id: bId,
    date: date || new Date().toISOString().split('T')[0],
    description: description || transactionType,
    amount: amt,
    transactionType: transactionType || 'Office Deposit',
    reference: reference || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  db.bankTransactions.unshift(newBankTx);

  logAudit(db, 'Bank Transaction', `Bank record: ${newBankTx.transactionType} of ৳${amt}`);
  writeDb(db);

  res.json({ success: true, bankTransaction: newBankTx, summary: calculateAccounting(db) });
});

// Delete Bank Transaction (Protected Action)
app.delete('/api/bank-transactions/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }

  const bt = (db.bankTransactions || []).find((t: any) => t.id === id);
  if (!bt) {
    return res.status(404).json({ error: 'Bank transaction not found' });
  }

  db.bankTransactions = db.bankTransactions.filter((t: any) => t.id !== id);

  logAudit(db, 'Bank Transaction Deleted', `Deleted bank transaction: ${bt.description} (৳${bt.amount})`);
  writeDb(db);

  res.json({ success: true, summary: calculateAccounting(db) });
});

// --- STAFF PROFILES ---
app.post('/api/staff', (req, res) => {
  const { name, designation, mobile, baseSalary } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Staff name is required' });
  }

  const db = readDb();
  const newStaff = {
    id: 'staff-' + Date.now(),
    name: name.trim(),
    designation: designation || 'Instructor',
    role: designation || 'Instructor',
    mobile: mobile || '',
    phone: mobile || '',
    baseSalary: Number(baseSalary) || 0,
    createdAt: new Date().toISOString(),
  };

  if (!db.staff) db.staff = [];
  db.staff.unshift(newStaff);
  logAudit(db, 'Staff Created', `Added staff member: ${newStaff.name} (${newStaff.designation})`);
  writeDb(db);

  res.json({ success: true, staff: newStaff });
});

app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, designation, mobile, baseSalary } = req.body;
  const db = readDb();

  const member = (db.staff || []).find((s: any) => s.id === id);
  if (!member) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  if (name) member.name = name.trim();
  if (designation) {
    member.designation = designation.trim();
    member.role = designation.trim();
  }
  if (mobile !== undefined) {
    member.mobile = mobile.trim();
    member.phone = mobile.trim();
  }
  if (baseSalary !== undefined) member.baseSalary = Number(baseSalary) || 0;

  logAudit(db, 'Staff Updated', `Updated staff profile: ${member.name}`);
  writeDb(db);

  res.json({ success: true, staff: member });
});

app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' });
  }

  const member = (db.staff || []).find((s: any) => s.id === id);
  if (!member) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  db.staff = (db.staff || []).filter((s: any) => s.id !== id);
  logAudit(db, 'Staff Deleted', `Deleted staff member: ${member.name}`);
  writeDb(db);

  res.json({ success: true });
});

// --- COURSES SETTINGS ---
app.post('/api/courses', (req, res) => {
  const { courses } = req.body;
  if (!Array.isArray(courses)) {
    return res.status(400).json({ error: 'Invalid courses array' });
  }

  const db = readDb();
  db.courses = courses;
  logAudit(db, 'Settings Updated', 'Course fees and duration configuration updated');
  writeDb(db);

  res.json({ success: true, courses: db.courses });
});

// --- DATA BACKUP & RESTORE ---
app.get('/api/backup/export', (req, res) => {
  const db = readDb();
  const { accountingPassword, ...safeDb } = db;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=jonota_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.json(safeDb);
});

app.post('/api/backup/import', (req, res) => {
  const { backupData, password } = req.body;
  const db = readDb();

  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। রিস্টোরের জন্য অনুমোদন প্রয়োজন।' });
  }

  if (!backupData || !Array.isArray(backupData.students)) {
    return res.status(400).json({ error: 'অকার্যকর ব্যাকআপ ফাইল কাঠামো।' });
  }

  // Restore fields safely while keeping secure password
  db.students = backupData.students || [];
  db.payments = backupData.payments || [];
  db.expenses = backupData.expenses || [];
  db.staffTransactions = backupData.staffTransactions || [];
  db.bankTransactions = backupData.bankTransactions || [];
  if (backupData.courses) db.courses = backupData.courses;
  if (backupData.staff) db.staff = backupData.staff;
  if (backupData.settings) db.settings = { ...db.settings, ...backupData.settings };

  logAudit(db, 'Backup Restored', `Full database restored with ${db.students.length} students and ${db.payments.length} payments`);
  writeDb(db);

  res.json({ success: true, message: 'ডাটা সফলভাবে রিস্টোর হয়েছে!', summary: calculateAccounting(db) });
});

// Reset / Seed Test Data
app.post('/api/reset-data', (req, res) => {
  const { password } = req.body;
  const db = readDb();
  if (password !== (db.accountingPassword || 'jonota2026')) {
    return res.status(401).json({ error: 'ভুল পাসওয়ার্ড।' });
  }
  writeDb(initialDbData);
  res.json({ success: true, message: 'সফলভাবে টেস্ট ডাটা রিসেট করা হয়েছে।' });
});

// --- VITE INTEGRATION ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jonota ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
