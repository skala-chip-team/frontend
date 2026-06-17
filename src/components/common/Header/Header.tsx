import { DISTRICT_OPTIONS, useDistrictStore, type DistrictId } from '@/stores';

import { DistrictSelect } from '../DistrictSelect';
import { NotificationBell } from './NotificationBell';
import { SimClock } from './SimClock';
import { UserInfo } from './UserInfo';

export function Header() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const setDistrict = useDistrictStore((state) => state.setDistrict);

  return (
    <header className="relative z-30 flex h-16 items-center justify-between gap-3 px-6">
      <DistrictSelect
        value={selectedDistrict}
        options={DISTRICT_OPTIONS}
        onChange={(value) => setDistrict(value as DistrictId)}
      />

      <div className="flex items-center gap-3">
        <SimClock />
        <NotificationBell />
        <UserInfo />
      </div>
    </header>
  );
}
