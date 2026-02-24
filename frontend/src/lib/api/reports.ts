import { apiClient } from './client';
import type { BudgetReport } from '@/types';

export const reportsApi = {
  getBudgetVsActual: () =>
    apiClient.get<BudgetReport>('/reports/budget-vs-actual'),

  getDepartmentExpenses: (params?: { departmentId?: string; from?: string; to?: string }) =>
    apiClient.get('/reports/department-expenses', { params }),

  getPaymentStatus: (params?: { from?: string; to?: string }) =>
    apiClient.get('/reports/payment-status', { params }),
};
