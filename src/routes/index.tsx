import { createBrowserRouter, Navigate } from 'react-router-dom';

import { SidebarLayout } from '@components/common';

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
        element: (
          <div className="p-6">
            <h1 className="text-heading-1 text-gray-900">
              Dashboard
            </h1>

            <p className="mt-1 text-body-1 text-gray-600">
              Welcome to chipScheduler.
            </p>
          </div>
        ),
      },
    ],
  },

  // 예외 처리
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);