import { create } from 'zustand';
import type { UserRole } from '@/types';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  productionId: string;
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const ROLE_ROUTES: Record<UserRole, string> = {
  SUPERVISOR: '/dashboard/supervisor',
  MANAGER:    '/dashboard/manager',
  ACCOUNTS:   '/dashboard/accounts',
  PRODUCER:   '/dashboard/producer',
  ADMIN:      '/admin/users',
};

export function getRedirectForRole(role: UserRole): string {
  return ROLE_ROUTES[role] ?? '/dashboard/supervisor';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: (accessToken, user) => {
    localStorage.setItem('access_token', accessToken);
    document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    set({ user, accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    document.cookie = 'access_token=; path=/; max-age=0';
    set({ user: null, accessToken: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  },
}));
