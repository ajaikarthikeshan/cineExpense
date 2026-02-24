// ─── Enums ────────────────────────────────────────────────────────────────────

export type ProductionStatus = 'active' | 'locked' | 'archived';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'MANAGER' | 'ACCOUNTS' | 'PRODUCER';

export type ExpenseStatus =
  | 'Draft'
  | 'Submitted'
  | 'ManagerReturned'
  | 'ManagerRejected'
  | 'ManagerApproved'
  | 'AccountsReturned'
  | 'AccountsApproved'
  | 'Paid';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Production {
  id: string;
  name: string;
  status: ProductionStatus;
  baseCurrency: string;
  budgetAlertThreshold: number; // e.g. 0.80
  producerOverrideEnabled: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  productionId: string;
  roleId: string;
  role: UserRole;
  name: string;
  email: string;
  isActive: boolean;
  departments: Department[];
  createdAt: string;
}

export interface Department {
  id: string;
  productionId: string;
  name: string;
  allocatedBudget: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  productionId: string;
  departmentId: string;
  department: Department;
  submittedBy: string;
  submittedByUser: Pick<User, 'id' | 'name'>;
  amount: number;
  currency: string;
  expenseDate: string;
  description: string;
  status: ExpenseStatus;
  receipts: ExpenseReceipt[];
  statusHistory: ExpenseStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseReceipt {
  id: string;
  expenseId: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ExpenseStatusHistory {
  id: string;
  expenseId: string;
  fromStatus: ExpenseStatus;
  toStatus: ExpenseStatus;
  comment?: string;
  performedBy: string;
  performedByUser: Pick<User, 'id' | 'name'>;
  performedAt: string;
}

export interface Payment {
  id: string;
  expenseId: string;
  paymentMethod: 'cash' | 'bank';
  referenceNumber: string;
  paymentDate: string;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  productionId: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface BudgetSummary {
  departmentId: string;
  departmentName: string;
  allocatedBudget: number;
  approvedSum: number;
  utilizationPercent: number;
  isOverThreshold: boolean;
}

export interface BudgetReport {
  production: Pick<Production, 'id' | 'name' | 'status' | 'baseCurrency' | 'budgetAlertThreshold'>;
  departments: BudgetSummary[];
}
