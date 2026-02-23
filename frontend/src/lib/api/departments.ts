import { apiClient } from './client';
import type { Department } from '@/types';

export const departmentsApi = {
  list: () => apiClient.get<{ data: Department[] }>('/departments'),
};
