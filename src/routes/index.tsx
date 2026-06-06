import { createBrowserRouter, Navigate } from 'react-router-dom';

import { SidebarLayout } from '@components/common';

import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

export const router = createBrowserRouter([
  // 인증 페이지
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },

  // 로그인 이후
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
    ],
  },

  // 예외 처리
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
