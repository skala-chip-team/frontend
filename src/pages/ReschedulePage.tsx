import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChevronRight } from 'lucide-react';

import { Pagination, RescheduleCard } from '@components/common';
import { districtLabels, useDistrictStore } from '@/stores';

import { rescheduleGroups } from '@/mocks';

const PAGE_SIZE = 5;

export default function ReschedulePage() {
  const navigate = useNavigate();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  const [page, setPage] = useState(1);
  const [prevDistrict, setPrevDistrict] = useState(selectedDistrict);

  // 구역 전환 시 첫 페이지로 (effect 대신 렌더 중 상태 조정)
  if (prevDistrict !== selectedDistrict) {
    setPrevDistrict(selectedDistrict);
    setPage(1);
  }

  const items = useMemo(
    () =>
      isAll
        ? rescheduleGroups
        : rescheduleGroups.filter((g) => (g.district_id as string) === selectedDistrict),
    [isAll, selectedDistrict]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 — 큰 글씨 */}
        <div className="flex items-center gap-2 text-heading-2">
          <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>재조정안 관리</span>
          {!isAll ? (
            <>
              <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
              <span className="text-secondary-navy">{districtLabels[selectedDistrict]}</span>
            </>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
            재조정안이 없습니다.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {pageItems.map((group) => (
                <RescheduleCard
                  key={group.group_id}
                  onOpenDetail={() => navigate(`/reschedule/${group.group_id}`)}
                  data={{
                    group_id: group.group_id,
                    districtLabel: `구역${group.district_id}`,
                    process_step: group.process_step,
                    max_risk_score: group.max_risk_score,
                    risk_level: group.risk_level,
                    risk_factor: group.risk_factor,
                    affected_units: group.affected_units,
                    group_status: group.group_status,
                  }}
                />
              ))}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} className="mt-2" />
          </>
        )}
      </div>
    </section>
  );
}
