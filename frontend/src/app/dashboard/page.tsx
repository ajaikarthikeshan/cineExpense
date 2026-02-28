'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getRedirectForRole } from '@/store/auth.store';

export default function DashboardRoot() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role) {
      router.replace(getRedirectForRole(user.role));
    } else {
      router.replace('/auth/login');
    }
  }, [user, router]);

  return null;
}
