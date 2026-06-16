import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChevronRight, Loader2 } from 'lucide-react';

import { Pagination, RescheduleCard } from '@components/common';
import { useRescheduleGroups } from '@/hooks';
import { districtLabels, useDistrictStore, type DistrictId } from '@/stores';
import { getApiErrorMessage, toCardData } from '@/utils';

const PAGE_SIZE = 5;

type StatusKey = 'all' | 'pending' | 'approved' | 'expired';
const STATUS_FILTERS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '신규' },
  { key: 'approved', label: '승인' },
  { key: 'expired', label: '만료' },
];

// 요일 필터 (getDay: 0=일 … 6=토)
const DAY_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '전체' },
  { key: '1', label: '월' },
  { key: '2', label: '화' },
  { key: '3', label: '수' },
  { key: '4', label: '목' },
  { key: '5', label: '금' },
  { key: '6', label: '토' },
  { key: '0', label: '일' },
];

/** 서버 시각(UTC 무접미사)을 KST 요일로. 오프셋 표기 있으면 그대로 */
function weekdayOf(iso: string): number {
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`).getDay();
}

export default function ReschedulePage() {
  const navigate = useNavigate();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  // status 없이 전체(만료 포함) 조회 → 클라이언트에서 상태/요일 필터링
  const { data, isLoading, isError, error } = useRescheduleGroups({ districtId: selectedDistrict });

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [dayFilter, setDayFilter] = useState('all');

  // 구역/필터 전환 시 첫 페이지로 (effect 대신 렌더 중 상태 조정)
  const filterKey = `${selectedDistrict}|${statusFilter}|${dayFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const items = useMemo(
    () =>
      (data ?? [])
        .filter((g) => statusFilter === 'all' || g.groupStatus === statusFilter)
        .filter((g) => dayFilter === 'all' || String(weekdayOf(g.createdAt)) === dayFilter),
    [data, statusFilter, dayFilter]
  );

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

        {/* 필터: 상태 + 요일 */}
        <div className="flex flex-col gap-2">
          <FilterRow label="상태" options={STATUS_FILTERS} value={statusFilter} onChange={(k) => setStatusFilter(k as StatusKey)} />
          <FilterRow label="요일" options={DAY_FILTERS} value={dayFilter} onChange={setDayFilter} />
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
            조건에 맞는 재조정안이 없습니다.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {pageItems.map((group) => {
                const expired = group.groupStatus === 'expired';
                return (
                  <RescheduleCard
                    key={group.groupId}
                    disabled={expired}
                    onOpenDetail={expired ? undefined : () => navigate(`/reschedule/${group.groupId}`)}
                    data={toCardData(group, districtLabel(group.districtId))}
                  />
                );
              })}
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

/** 라벨 + 칩 필터 한 줄 */
function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-label-3 font-semibold text-gray-400">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`rounded-lg border px-3 py-1.5 text-label-2 font-semibold transition ${
                active
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
