import { useMemo, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { OrderDetailPanel, OrderTable } from '@components/common';
import { orders as allOrders } from '@/mocks';
import { districtLabels, useDistrictStore } from '@/stores';
import { orderStatus, sortOrders } from '@/utils';
import type { OrderStatus } from '@/types';

const STATUS_FILTERS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: '대기', label: '대기' },
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
];

export default function OrderPage() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const visibleOrders = useMemo(() => {
    const filtered = allOrders
      .filter((order) => isAll || order.district_id === selectedDistrict)
      .filter((order) => statusFilter === 'all' || orderStatus(order.units) === statusFilter);
    return sortOrders(filtered);
  }, [isAll, selectedDistrict, statusFilter]);

  const selectedOrder = allOrders.find((order) => order.order_id === selectedId) ?? null;

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
