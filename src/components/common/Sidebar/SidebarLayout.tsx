import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from '../Header';

export function SidebarLayout() {
  return (
    <div className="flex min-h-screen w-full bg-surface-50 text-gray-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
