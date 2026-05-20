import { createBrowserRouter } from 'react-router-dom';

import { SidebarLayout } from '@/components/common/Sidebar';

import DashboardPage from '@/pages/DashboardPage';
import ReschedulePage from '@/pages/ReschedulePage';
import RescheduleDetailPage from '@/pages/RescheduleDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'reschedule',
        element: <ReschedulePage />,
      },
      {
        path: 'reschedule/:proposalId',
        element: <RescheduleDetailPage />,
      },
    ],
  },
]);