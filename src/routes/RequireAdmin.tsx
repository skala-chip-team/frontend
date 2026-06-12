import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/stores';

/** ADMIN role만 접근 허용. 그 외(로그인했지만 비-admin)는 /dashboard로 보낸다. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = (role ?? '').toUpperCase() === 'ADMIN';
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
