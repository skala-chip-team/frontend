import { useEffect, useRef, type ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { useAuthStore, useToastStore } from '@/stores';

/**
 * ADMIN(운영자) role만 접근 허용. 그 외(로그인했지만 권한 없음)는
 * 접근 거부 메시지를 띄운 뒤 /dashboard로 리다이렉트한다.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = (role ?? '').toUpperCase() === 'ADMIN';
  const addToast = useToastStore((state) => state.addToast);
  const notified = useRef(false);

  useEffect(() => {
    if (!isAdmin && !notified.current) {
      notified.current = true;
      addToast({
        tone: 'critical',
        title: '접근 권한이 없습니다',
        description: '운영자(관리자)만 들어갈 수 있는 화면입니다. 대시보드로 이동합니다.',
      });
    }
  }, [isAdmin, addToast]);

  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
