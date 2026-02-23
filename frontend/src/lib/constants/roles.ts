import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'System Administrator',
  SUPERVISOR: 'Supervisor',
  MANAGER: 'Manager',
  ACCOUNTS: 'Accounts',
  PRODUCER: 'Producer',
};

export const EXPENSE_STATUS_LABELS = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  ManagerReturned: 'Returned by Manager',
  ManagerRejected: 'Rejected by Manager',
  ManagerApproved: 'Manager Approved',
  AccountsReturned: 'Returned by Accounts',
  AccountsApproved: 'Accounts Approved',
  Paid: 'Paid',
} as const;

export const BUDGET_ALERT_THRESHOLD = 0.8;
