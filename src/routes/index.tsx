import { createBrowserRouter, Navigate } from 'react-router-dom';

import { SidebarLayout } from '@components/common';

import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import OrderPage from '@/pages/OrderPage';
import ReschedulePage from '@/pages/ReschedulePage';
import RescheduleDetailPage from '@/pages/RescheduleDetailPage';
import SignupPage from '@/pages/SignupPage';
import WorkerPage from '@/pages/WorkerPage';
import MachinePage from '@/pages/MachinePage';

import { RequireAuth } from './RequireAuth';
import { RequireAdmin } from './RequireAdmin';

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

  // 로그인 이후 (미로그인 시 RequireAuth가 /login으로 리다이렉트)
  {
    element: <RequireAuth />,
    children: [
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
            element: (
              <RequireAdmin>
                <WorkerPage />
              </RequireAdmin>
            ),
          },

          {
            path: 'machines',
            element: (
              <RequireAdmin>
                <MachinePage />
              </RequireAdmin>
            ),
          },
        ],
      },
    ],
  },

  // 예외 처리
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
