import { startTransition, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Lightbulb, ClipboardList, Users, Cpu, ChevronsRight } from 'lucide-react';
import { useAuthStore } from '@/stores';

import type { MenuItem, OptionProps, TitleSectionProps, ToggleCloseProps } from './types';
import skLogo from './image.png';

const MAIN_MENU: MenuItem[] = [
  { icon: Home, title: '대시보드', path: '/dashboard' },
  { icon: ClipboardList, title: '주문 관리', path: '/orders' },
  { icon: Lightbulb, title: '재조정 제안 관리', path: '/reschedule' },
];

/** 운영자(ADMIN) 전용 섹션 메뉴 */
const OPERATOR_MENU: MenuItem[] = [
  { icon: Users, title: '작업자 관리', path: '/workers' },
  { icon: Cpu, title: '장비 설정', path: '/machines' },
];

/** ADMIN만 접근 가능한 메뉴 경로 (재조정은 전 역할 조회 가능 — 제외) */
const ADMIN_ONLY_PATHS = new Set(['/workers', '/machines']);

/** 현재 경로에 해당하는 메뉴 타이틀(없으면 null). 하위 경로도 startsWith로 매칭. */
function matchTitleByPath(pathname: string): string | null {
  const match = [...MAIN_MENU, ...OPERATOR_MENU].find(
    (item) => item.path && pathname.startsWith(item.path)
  );
  return match?.title ?? null;
}

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // 선택 상태의 단일 소스. 라우트가 있는 메뉴는 URL과 동기화되고,
  // 라우트가 없는 메뉴(장비 모니터링 등)는 클릭 시 이 값만 갱신된다.
  const [selectedTitle, setSelectedTitle] = useState(() => matchTitleByPath(pathname) ?? '대시보드');

  // 외부 경로 변경(딥링크·뒤로가기 등)이 생기면 렌더 중 선택 상태를 URL에 맞춘다.
  // (effect 대신 직전 pathname과 비교하는 React 권장 패턴)
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    const title = matchTitleByPath(pathname);
    if (title) setSelectedTitle(title);
  }

  // ADMIN만 운영자 섹션 + 재조정 검토 메뉴 노출
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = (role ?? '').toUpperCase() === 'ADMIN';
  const canShow = (item: MenuItem) =>
    !item.path || !ADMIN_ONLY_PATHS.has(item.path) || isAdmin;
  const mainMenu = MAIN_MENU.filter(canShow);
  const operatorMenu = OPERATOR_MENU.filter(canShow);

  const isItemSelected = (item: MenuItem) => selectedTitle === item.title;

  const handleSelect = (item: MenuItem) => {
    // 클릭한 메뉴를 즉시 단일 선택으로(긴급 업데이트 → 사이드바 하이라이트 즉시 반영).
    setSelectedTitle(item.title);
    // 라우트 이동은 transition으로 표시해 비긴급 처리. 무거운 페이지(대시보드 3D 등)
    // 렌더가 사이드바의 즉시 반응을 막지 않도록 — 메뉴가 먼저 움직이고 페이지가 뒤따라 로딩된다.
    if (item.path) startTransition(() => navigate(item.path!));
  };

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 overflow-hidden border-r border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      <TitleSection open={open} />

      <div className="mb-8 space-y-1">
        {mainMenu.map((item) => (
          <Option
            key={item.title}
            icon={item.icon}
            title={item.title}
            notifs={item.notifs}
            isSelected={isItemSelected(item)}
            onClick={() => handleSelect(item)}
            open={open}
          />
        ))}
      </div>

      {open && operatorMenu.length > 0 && (
        <div className="space-y-1 border-t border-gray-200 pt-4">
          <div className="px-3 py-2 text-label-3 uppercase tracking-wide text-gray-500">
            운영자
          </div>
          {operatorMenu.map((item) => (
            <Option
              key={item.title}
              icon={item.icon}
              title={item.title}
              isSelected={isItemSelected(item)}
              onClick={() => handleSelect(item)}
              open={open}
            />
          ))}
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
}

function Option({ icon: Icon, title, isSelected, onClick, open, notifs }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-11 w-full items-center rounded-md ${
        isSelected
          ? 'border-l-2 border-primary-600 bg-primary-50 text-primary-600 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && <span className="whitespace-nowrap text-label-1">{title}</span>}

      {notifs !== undefined && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-label-3 text-white">
          {notifs}
        </span>
      )}
    </button>
  );
}

function TitleSection({ open }: TitleSectionProps) {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <div className="flex items-center gap-3 p-2">
        <Logo />
        {open && (
          <span className="whitespace-nowrap text-subtitle-2 font-bold text-gray-900">
            3S Scheduler
          </span>
        )}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid size-10 shrink-0 place-content-center overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]">
      <img src={skLogo} alt="3S Scheduler" className="size-full scale-[1.9] object-contain" />
    </div>
  );
}

function ToggleClose({ open, setOpen }: ToggleCloseProps) {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
        {open && <span className="whitespace-nowrap text-label-1 text-gray-600">Hide</span>}
      </div>
    </button>
  );
}
