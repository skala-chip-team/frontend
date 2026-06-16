import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChevronRight, History, Loader2 } from 'lucide-react';

import { Pagination, RescheduleCard } from '@components/common';
import { useRescheduleGroups } from '@/hooks';
import { districtLabels, useDistrictStore, type DistrictId } from '@/stores';
import { toCardData } from '@/utils';
import { getApiErrorMessage } from '@/utils';

const PAGE_SIZE = 5;

export default function ReschedulePage() {
  const navigate = useNavigate();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  // 목록은 pending(미처리) 기준 — 승인 완료된 건은 제외. 구역 선택 시 districtId 필터
  const { data, isLoading, isError, error } = useRescheduleGroups({
    districtId: selectedDistrict,
    status: 'pending',
  });

  const [page, setPage] = useState(1);
  const [prevDistrict, setPrevDistrict] = useState(selectedDistrict);

  // 구역 전환 시 첫 페이지로 (effect 대신 렌더 중 상태 조정)
  if (prevDistrict !== selectedDistrict) {
    setPrevDistrict(selectedDistrict);
    setPage(1);
  }

  // 시뮬 진행으로 위험이 해소된 stale 그룹(영향 유닛 0)은 숨김 → 살아있는 위험만
  const items = useMemo(() => (data ?? []).filter((g) => g.affectedUnits.length > 0), [data]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [items, currentPage]
  );

  const districtLabel = (districtId: string) =>
    districtLabels[districtId as DistrictId] ?? `구역 ${districtId}`;

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 + 기간별 이력 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-heading-2">
            <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>재조정안 관리</span>
            {!isAll ? (
              <>
                <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
                <span className="text-secondary-navy">{districtLabels[selectedDistrict]}</span>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => navigate('/reschedule/history')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
          >
            <History className="h-4 w-4" aria-hidden />
            기간별 이력
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            재조정안을 불러오는 중…
          </div>
        ) : isError ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 text-body-2 text-red-500">
            {getApiErrorMessage(error, '재조정안을 불러오지 못했습니다.')}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
            재조정안이 없습니다.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {pageItems.map((group) => (
                <RescheduleCard
                  key={group.groupId}
                  onOpenDetail={() => navigate(`/reschedule/${group.groupId}`)}
                  data={toCardData(group, districtLabel(group.districtId))}
                />
              ))}
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setPage}
              className="mt-2"
            />
          </>
        )}
      </div>
    </section>
  );
}
