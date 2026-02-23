import { apiClient } from './client';
import type { Expense, PaginatedResponse } from '@/types';

export const expensesApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<Expense>>('/expenses', { params }),

  get: (id: string) =>
    apiClient.get<Expense>(`/expenses/${id}`),

  create: (data: Partial<Expense>) =>
    apiClient.post<Expense>('/expenses', data),

  update: (id: string, data: Partial<Expense>) =>
    apiClient.patch<Expense>(`/expenses/${id}`, data),

  uploadReceipt: (id: string, file: File) => {
    const form = new FormData();
    form.append('receipt', file);
    return apiClient.post(`/expenses/${id}/upload-receipt`, form);
  },

  submit: (id: string) =>
    apiClient.post(`/expenses/${id}/submit`),

  managerApprove: (id: string) =>
    apiClient.post(`/expenses/${id}/manager/approve`),

  managerReturn: (id: string, comment: string) =>
    apiClient.post(`/expenses/${id}/manager/return`, { comment }),

  managerReject: (id: string, comment: string) =>
    apiClient.post(`/expenses/${id}/manager/reject`, { comment }),

  accountsApprove: (id: string) =>
    apiClient.post(`/expenses/${id}/accounts/approve`),

  accountsReturn: (id: string, comment: string) =>
    apiClient.post(`/expenses/${id}/accounts/return`, { comment }),

  producerOverride: (id: string, reason: string) =>
    apiClient.post(`/expenses/${id}/producer/override-budget`, { reason }),

  markPaid: (id: string, data: { paymentMethod: string; referenceNumber: string; paymentDate: string }) =>
    apiClient.post(`/expenses/${id}/accounts/mark-paid`, data),
};
