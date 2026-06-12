import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/stores';

/** 미로그인 사용자는 /login으로 리다이렉트. 로그인 상태면 자식 라우트 렌더. */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
