import { createBrowserRouter, Navigate } from 'react-router-dom';

import { SidebarLayout } from '@components/common';

import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import OrderPage from '@/pages/OrderPage';
import ReschedulePage from '@/pages/ReschedulePage';
import RescheduleDetailPage from '@/pages/RescheduleDetailPage';
import SignupPage from '@/pages/SignupPage';
import WorkerPage from '@/pages/WorkerPage';

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

      {
        path: 'orders',
        element: <OrderPage />,
      },

      {
        path: 'reschedule',
        element: <ReschedulePage />,
      },

      {
        path: 'reschedule/:groupId',
        element: <RescheduleDetailPage />,
      },

      {
        path: 'workers',
        element: <WorkerPage />,
      },
    ],
  },

  // 예외 처리
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
