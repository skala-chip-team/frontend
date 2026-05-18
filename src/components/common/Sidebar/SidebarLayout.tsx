import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function SidebarLayout() {
  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
