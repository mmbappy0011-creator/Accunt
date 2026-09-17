import { Student, Payment, OfficeExpense, StaffTransaction, StaffTransactionType, BankTransaction, Course, AccountingSummary, DatabaseState } from '../types';

export class ApiService {
  private static baseUrl = '/api';

  static async fetchInitialData(): Promise<{ data: DatabaseState; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/data`);
    if (!res.ok) {
      throw new Error('Failed to fetch ERP data from server');
    }
    return await res.json();
  }

  static async verifyAccountingPassword(password: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/auth/verify-accounting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return res.ok && data.authorized === true;
  }

  static async changeAccountingPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/auth/change-accounting-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to change accounting password');
    }
    return data;
  }

  static async createStudent(payload: {
    name: string;
    fatherName?: string;
    mobile?: string;
    address?: string;
    course: string;
    courseFee: number;
    initialPayment: number;
    paymentMethod: string;
    admissionDate?: string;
    notes?: string;
  }): Promise<{ student: Student; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to enroll student');
    return data;
  }

  static async updateStudent(id: string, payload: Partial<Student>): Promise<{ student: Student; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update student');
    return data;
  }

  static async deleteStudent(id: string, password: string): Promise<{ summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/students/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authorization failed');
    return data;
  }

  static async createPayment(payload: {
    studentId: string;
    amount: number;
    paymentMethod: string;
    date?: string;
    notes?: string;
  }): Promise<{ payment: Payment; student: Student; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record payment');
    return data;
  }

  static async deletePayment(id: string, password: string): Promise<{ summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/payments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authorization failed');
    return data;
  }

  static async createExpense(payload: {
    description: string;
    category: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank';
    date?: string;
    notes?: string;
  }): Promise<{ expense: OfficeExpense; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log expense');
    return data;
  }

  static async deleteExpense(id: string, password: string): Promise<{ summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authorization failed');
    return data;
  }

  static async createStaffTransaction(payload: {
    staffId?: string;
    staffName?: string;
    type?: StaffTransactionType | string;
    description?: string;
    month?: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank';
    date?: string;
    notes?: string;
  }): Promise<{ staffTransaction: StaffTransaction; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/staff-transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record staff transaction');
    return data;
  }

  static async deleteStaffTransaction(id: string, password: string): Promise<{ summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/staff-transactions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authorization failed');
    return data;
  }

  static async createBankTransaction(payload: {
    transactionType: string;
    description: string;
    amount: number;
    reference?: string;
    date?: string;
    notes?: string;
  }): Promise<{ bankTransaction: BankTransaction; summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/bank-transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create bank transaction');
    return data;
  }

  static async deleteBankTransaction(id: string, password: string): Promise<{ summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/bank-transactions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authorization failed');
    return data;
  }

  static async createStaff(payload: {
    name: string;
    designation?: string;
    mobile?: string;
    baseSalary?: number;
  }): Promise<{ staff: any }> {
    const res = await fetch(`${this.baseUrl}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create staff member');
    return data;
  }

  static async updateStaff(id: string, payload: any): Promise<{ staff: any }> {
    const res = await fetch(`${this.baseUrl}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update staff member');
    return data;
  }

  static async deleteStaff(id: string, password: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/staff/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete staff member');
  }

  static async updateCourses(courses: Course[]): Promise<{ courses: Course[] }> {
    const res = await fetch(`${this.baseUrl}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update courses');
    return data;
  }

  static async exportBackup(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/backup/export`);
    if (!res.ok) throw new Error('Backup export failed');
    return await res.json();
  }

  static async importBackup(backupData: any, password: string): Promise<{ summary: AccountingSummary }> {
    const res = await fetch(`${this.baseUrl}/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupData, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Backup import failed');
    return data;
  }

  static async resetDatabase(password: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    return data;
  }
}
