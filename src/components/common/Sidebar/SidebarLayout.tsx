import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from '../Header';
import { Toaster } from '../Toast';
import { useProductionAlerts, useRiskAlerts } from '@hooks/index';

export function SidebarLayout() {
  // 위험 탐지/해소 폴링 → 새 위험·해소 토스트
  useRiskAlerts();
  // 생산 완료 폴링 → 완성품 증가분 토스트
  useProductionAlerts();

  // 모바일 사이드바(드로어) 열림 상태 — 헤더 햄버거로 토글
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-surface-50 text-gray-900">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
