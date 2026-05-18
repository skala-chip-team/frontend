import { createBrowserRouter } from 'react-router-dom';
import { SidebarLayout } from '@components/common';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      {
        index: true,
        element: (
          <div className="p-6">
            <h1 className="text-heading-1 text-gray-900">Home</h1>
            <p className="mt-1 text-body-1 text-gray-600">Welcome.</p>
          </div>
        ),
      },
    ],
  },
]);
