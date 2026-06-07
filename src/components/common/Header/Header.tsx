import { useDistrictStore, type DistrictId } from '@/stores';

import { DistrictSelect } from '../DistrictSelect';
import { NotificationBell } from './NotificationBell';
import { UserInfo } from './UserInfo';

const districtOptions = [
  { value: 'all', label: '전체' },
  { value: 'A', label: '구역A' },
  { value: 'B', label: '구역B' },
  { value: 'C', label: '구역C' },
];

export function Header() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const setDistrict = useDistrictStore((state) => state.setDistrict);

  return (
    <header className="relative z-30 flex h-16 items-center justify-between gap-3 px-6">
      <DistrictSelect
        value={selectedDistrict}
        options={districtOptions}
        onChange={(value) => setDistrict(value as DistrictId)}
      />

      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserInfo />
      </div>
    </header>
  );
}
