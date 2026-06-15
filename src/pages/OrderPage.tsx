import { useMemo, useState, type ReactNode } from 'react';
import { AlarmClock, ChevronRight } from 'lucide-react';

import {
  OrderDetailPanel,
  OrderTable,
  Pagination,
  type OrderSort,
  type OrderSortKey,
} from '@components/common';
import { orders as allOrders } from '@/mocks';
import { districtLabels, useDistrictStore } from '@/stores';
import { useOrderDetail, useOrders, useSimStatus } from '@/hooks';
import { formatPlanDate, isDueToday, orderStatus } from '@/utils';
import type { Order, OrderStatus } from '@/types';

const PAGE_SIZE = 8;

const STATUS_FILTERS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: '대기', label: '대기' },
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
];

// mock fallback 기준 '오늘' — mock 주문의 계획일(plan_date). 서버 연동 시엔 서버 dueImminent 사용.
const TODAY = allOrders[0]?.plan_date ?? '';

export default function OrderPage() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';
  const districtId = isAll ? undefined : selectedDistrict;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sort, setSort] = useState<OrderSort>({ key: 'priority', dir: 'asc' });
  const [page, setPage] = useState(1);

  // 컬럼 헤더 클릭: 같은 컬럼이면 방향 토글, 다른 컬럼이면 오름차순부터
  const handleSort = (key: OrderSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // 서버 주문 목록 (GET /api/orders) — 실패/로딩이면 mock fallback
  const { data, isLoading, isError } = useOrders(districtId);
  const { data: detail } = useOrderDetail(selectedId);
  const { data: sim } = useSimStatus();
  const isMock = !data;

  // mock: 구역 필터를 직접 적용 (서버는 districtId 쿼리로 이미 필터됨)
  const mockDistrictOrders = useMemo(
    () => allOrders.filter((order) => isAll || order.district_id === selectedDistrict),
    [isAll, selectedDistrict]
  );

  const sourceOrders = data ? data.orders : mockDistrictOrders;

  // 납기 임박 기준 '오늘' = 시뮬레이션 현재일(sim_now_iso) — 대시보드와 동일 소스.
  // 시뮬 정지 시: mock은 계획일(TODAY), API는 서버 dueImminent(imminentCount)로 폴백.
  const simDate = sim?.sim_now_iso?.slice(0, 10) ?? null;
  const imminentBasis = simDate ?? (isMock ? TODAY : null);
  const imminentCount = imminentBasis
    ? sourceOrders.filter((order) => isDueToday(order.due_date, imminentBasis)).length
    : (data?.imminentCount ?? 0);

  // 상태 필터(화면) + 정렬(우선순위/계획일/납기, asc·desc)
  const visibleOrders = useMemo(() => {
    const filtered = sourceOrders.filter(
      (order) => statusFilter === 'all' || orderStatus(order.units) === statusFilter
    );
    const compare = (a: Order, b: Order) => {
      let r: number;
      if (sort.key === 'priority') {
        r = a.order_priority - b.order_priority || a.due_date.localeCompare(b.due_date);
      } else if (sort.key === 'plan') {
        r = a.plan_date.localeCompare(b.plan_date) || a.due_date.localeCompare(b.due_date);
      } else {
        r = a.due_date.localeCompare(b.due_date);
      }
      return sort.dir === 'asc' ? r : -r;
    };
    return [...filtered].sort(compare);
  }, [sourceOrders, statusFilter, sort]);

  // 페이지네이션 — 필터/구역/정렬 변경 시 1페이지로 리셋(렌더 중 상태 보정)
  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / PAGE_SIZE));
  const resetKey = `${selectedDistrict}|${statusFilter}|${sort.key}|${sort.dir}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }
  const safePage = Math.min(page, pageCount);
  const pageOrders = visibleOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 선택 주문: 상세(진짜 유닛) 우선 → 목록 → mock 순 fallback
  const selectedOrder: Order | null = selectedId
    ? (detail ??
      sourceOrders.find((order) => order.order_id === selectedId) ??
      allOrders.find((order) => order.order_id === selectedId) ??
      null)
    : null;

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 */}
        <div className="flex items-center gap-2 text-heading-2">
          <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>주문 관리</span>
          {!isAll ? (
            <>
              <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
              <span className="text-secondary-navy">{districtLabels[selectedDistrict]}</span>
            </>
          ) : null}
          {isLoading || isMock ? (
            <span className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-label-3 font-semibold shadow-sm">
              {isLoading ? (
                <span className="text-gray-500">주문 데이터 불러오는 중…</span>
              ) : isError ? (
                <span className="text-rose-500">API 연결 실패 · 데모 데이터</span>
              ) : (
                <span className="text-amber-600">데모 데이터</span>
              )}
            </span>
          ) : null}
        </div>

        {/* 납기 임박(오늘 납기) — 건수 강조 배너 */}
        {imminentCount > 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-red-50/40 px-5 py-4 shadow-[0_8px_24px_rgba(234,0,44,0.08)]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white shadow-[0_6px_16px_rgba(234,0,44,0.25)]">
              <AlarmClock className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-subtitle-1 font-bold text-secondary-navy">납기 임박</h2>
              <span className="text-heading-3 font-extrabold leading-none text-primary-600">
                {imminentCount}건
              </span>
            </div>
            <span className="ml-auto text-label-2 text-gray-500">
              {imminentBasis
                ? `오늘(${formatPlanDate(imminentBasis)}) 납기 주문입니다.`
                : '납기가 임박한 주문입니다.'}
            </span>
          </div>
        ) : null}

        {/* 상태 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-lg border px-3.5 py-1.5 text-label-2 font-semibold transition ${
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
          <span className="ml-auto text-label-2 text-gray-400">
            총 <b className="text-secondary-navy">{visibleOrders.length}</b>건
          </span>
        </div>

        {visibleOrders.length === 0 ? (
          <Message>해당 조건의 주문이 없습니다.</Message>
        ) : (
          <>
            <OrderTable
              key={`${selectedDistrict}-${statusFilter}-${sort.key}-${sort.dir}-${safePage}`}
              orders={pageOrders}
              selectedId={selectedId}
              today={imminentBasis ?? undefined}
              sort={sort}
              onSort={handleSort}
              onSelect={(order) => setSelectedId(order.order_id)}
            />
            <Pagination page={safePage} totalPages={pageCount} onChange={setPage} className="pt-1" />
          </>
        )}
      </div>

      <OrderDetailPanel
        order={selectedOrder}
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
      />
    </section>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
      {children}
    </div>
  );
}
