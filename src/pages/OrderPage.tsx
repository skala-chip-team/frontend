import { useMemo, useState, type ReactNode } from 'react';
import { AlarmClock, ChevronRight } from 'lucide-react';

import { OrderDetailPanel, OrderTable } from '@components/common';
import { orders as allOrders } from '@/mocks';
import { districtLabels, useDistrictStore } from '@/stores';
import { isDueToday, orderStatus, sortOrders } from '@/utils';
import type { OrderStatus } from '@/types';

const STATUS_FILTERS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: '대기', label: '대기' },
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
];

// 기준 '오늘' — mock 주문의 계획일(plan_date). 실제 API 연동 시 서버 기준일로 대체.
const TODAY = allOrders[0]?.plan_date ?? '';

export default function OrderPage() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const districtOrders = useMemo(
    () => allOrders.filter((order) => isAll || order.district_id === selectedDistrict),
    [isAll, selectedDistrict]
  );

  const imminentCount = useMemo(
    () => districtOrders.filter((order) => isDueToday(order.due_date, TODAY)).length,
    [districtOrders]
  );

  const visibleOrders = useMemo(
    () =>
      sortOrders(
        districtOrders.filter(
          (order) => statusFilter === 'all' || orderStatus(order.units) === statusFilter
        )
      ),
    [districtOrders, statusFilter]
  );

  const selectedOrder = allOrders.find((order) => order.order_id === selectedId) ?? null;

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 + 납기 임박 건수 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-heading-2">
            <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>주문 관리</span>
            {!isAll ? (
              <>
                <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
                <span className="text-secondary-navy">{districtLabels[selectedDistrict]}</span>
              </>
            ) : null}
          </div>

          {imminentCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-label-2 font-semibold text-primary-600">
              <AlarmClock className="h-4 w-4" aria-hidden />
              납기 임박 <b className="font-bold">{imminentCount}건</b>
            </span>
          ) : null}
        </div>

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
          <OrderTable
            key={`${selectedDistrict}-${statusFilter}`}
            orders={visibleOrders}
            selectedId={selectedId}
            today={TODAY}
            onSelect={(order) => setSelectedId(order.order_id)}
          />
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
