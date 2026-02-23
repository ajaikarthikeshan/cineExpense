import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return {
    canCreateExpense: role === 'SUPERVISOR',
    canManagerApprove: role === 'MANAGER',
    canAccountsApprove: role === 'ACCOUNTS',
    canProducerOverride: role === 'PRODUCER',
    canViewFullBudget: role === 'ACCOUNTS' || role === 'PRODUCER' || role === 'ADMIN',
    canMarkPaid: role === 'ACCOUNTS',
    canAdminister: role === 'ADMIN',
    isRole: (r: UserRole) => role === r,
  };
}
