import { Menu } from 'lucide-react';

import { DISTRICT_OPTIONS, useDistrictStore, type DistrictId } from '@/stores';

import { DistrictSelect } from '../DistrictSelect';
import { NotificationBell } from './NotificationBell';
import { SimClock } from './SimClock';
import { UserInfo } from './UserInfo';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const setDistrict = useDistrictStore((state) => state.setDistrict);

  return (
    <header className="relative z-30 flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 lg:flex-nowrap lg:px-6 lg:py-0">
      <div className="flex items-center gap-2">
        {/* 모바일 사이드바 토글 */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="메뉴"
          className="grid h-9 w-9 shrink-0 place-content-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <DistrictSelect
          value={selectedDistrict}
          options={DISTRICT_OPTIONS}
          onChange={(value) => setDistrict(value as DistrictId)}
        />
      </div>

      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto">
        <SimClock />
        <NotificationBell />
        <UserInfo />
      </div>
    </header>
  );
}
