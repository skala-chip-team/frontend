import { useMemo, useState, type ReactNode } from 'react';
import { AlarmClock, ChevronRight, Clock, Zap } from 'lucide-react';

import { Chip, OrderDetailPanel, OrderTable } from '@components/common';
import { orders as allOrders } from '@/mocks';
import { districtLabels, useDistrictStore } from '@/stores';
import {
  districtShort,
  formatDueDate,
  formatPlanDate,
  isDueToday,
  orderProgress,
  orderStatus,
  orderStatusColor,
  sortOrders,
} from '@/utils';
import type { Order, OrderStatus } from '@/types';

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

  const imminentOrders = useMemo(
    () => sortOrders(districtOrders.filter((order) => isDueToday(order.due_date, TODAY))),
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

        {/* 납기 임박(오늘 납기) — 강조 섹션 */}
        {imminentOrders.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-red-50/40 shadow-[0_8px_24px_rgba(234,0,44,0.08)]">
            <div className="flex items-center gap-3 border-b border-primary-100/70 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white shadow-[0_6px_16px_rgba(234,0,44,0.25)]">
                <AlarmClock className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="text-subtitle-1 font-bold text-secondary-navy">납기 임박</h2>
                <span className="text-subtitle-1 font-extrabold text-primary-600">
                  {imminentOrders.length}건
                </span>
              </div>
              <span className="ml-auto text-label-2 text-gray-500">
                오늘({formatPlanDate(TODAY)}) 납기
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {imminentOrders.map((order) => (
                <ImminentCard
                  key={order.order_id}
                  order={order}
                  selected={selectedId === order.order_id}
                  onSelect={() => setSelectedId(order.order_id)}
                />
              ))}
            </div>
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

/** 납기 임박 주문 카드 — 클릭 시 상세 패널 오픈 */
function ImminentCard({
  order,
  selected,
  onSelect,
}: {
  order: Order;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = orderStatus(order.units);
  const { done, total, percent } = orderProgress(order.units);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col gap-2.5 rounded-xl border bg-white p-3.5 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition ${
        selected
          ? 'border-primary-500 ring-1 ring-primary-500/20'
          : 'border-primary-100 hover:border-primary-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="font-bold text-secondary-navy">{order.order_id}</span>
          {order.is_burst ? (
            <Chip variant="subtle" color="red" size="xs" className="font-bold">
              <Zap className="h-3 w-3" aria-hidden />
              긴급
            </Chip>
          ) : null}
        </span>
        <Chip variant="soft" color={orderStatusColor(status)} size="xs">
          {status}
        </Chip>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-label-2 font-bold text-primary-600">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {formatDueDate(order.due_date)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-label-3 text-gray-400">구역 {districtShort(order.district_id)}</span>
          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
            <span
              className="block h-full rounded-full bg-primary-500"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="text-label-3 tabular-nums text-gray-400">
            {done}/{total}
          </span>
        </span>
      </div>
    </button>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
      {children}
    </div>
  );
}
