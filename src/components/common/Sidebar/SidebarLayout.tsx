import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from '../Header';
import { Toaster } from '../Toast';
import { useRiskAlerts } from '@hooks/useRiskAlerts';

export function SidebarLayout() {
  // 위험 탐지 폴링 → 새 위험(High/Critical)이면 토스트
  useRiskAlerts();

  return (
    <div className="flex min-h-screen w-full bg-surface-50 text-gray-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
