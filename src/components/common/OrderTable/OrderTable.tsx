import { Zap } from 'lucide-react';

import {
  districtShort,
  formatDueDate,
  formatPlanDate,
  orderProgress,
  orderStatus,
  orderStatusColor,
  priorityMeta,
} from '@/utils';
import type { Order } from '@/types';

import { Chip } from '../Chip';

interface OrderTableProps {
  orders: Order[];
  selectedId?: string | null;
  onSelect: (order: Order) => void;
}

/** 주문 테이블 — 주문ID / 구역 / 진행 상태 / 우선순위 / 수량 / 계획일 / 납기. 행은 스태거 등장. */
export function OrderTable({ orders, selectedId, onSelect }: OrderTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <table className="w-full text-left text-label-2">
        <thead className="border-b border-gray-200 bg-surface-100/70 text-label-3 text-gray-500">
          <tr>
            <th className="px-5 py-3 font-semibold">주문 ID</th>
            <th className="px-5 py-3 font-semibold">구역</th>
            <th className="px-5 py-3 font-semibold">진행 상태</th>
            <th className="px-5 py-3 font-semibold">우선순위</th>
            <th className="px-5 py-3 text-right font-semibold">수량</th>
            <th className="px-5 py-3 font-semibold">계획일</th>
            <th className="px-5 py-3 font-semibold">납기</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => {
            const status = orderStatus(order.units);
            const { done, total, percent } = orderProgress(order.units);
            const priority = priorityMeta(order.order_priority);
            return (
              <tr
                key={order.order_id}
                onClick={() => onSelect(order)}
                style={{
                  animationName: 'rowFadeUp',
                  animationDuration: '0.4s',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'both',
                  animationDelay: `${index * 0.05}s`,
                }}
                className={`cursor-pointer border-b border-gray-100 transition last:border-none hover:bg-surface-100/70 ${
                  selectedId === order.order_id ? 'bg-primary-50/50' : ''
                }`}
              >
                {/* 주문 ID + burst */}
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-secondary-navy">{order.order_id}</span>
                    {order.is_burst ? (
                      <Chip variant="subtle" color="red" size="xs" className="font-bold">
                        <Zap className="h-3 w-3" aria-hidden />
                        긴급
                      </Chip>
                    ) : null}
                  </span>
                </td>

                {/* 구역 */}
                <td className="px-5 py-3 font-semibold text-secondary-navy">
                  구역 {districtShort(order.district_id)}
                </td>

                {/* 진행 상태 — 칩 + 미니 진행바 */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Chip variant="soft" color={orderStatusColor(status)} size="sm">
                      {status}
                    </Chip>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
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
                </td>

                {/* 우선순위 */}
                <td className="px-5 py-3">
                  <Chip variant="soft" color={priority.color} size="sm" className="font-semibold">
                    P{order.order_priority} · {priority.label}
                  </Chip>
                </td>

                {/* 수량 */}
                <td className="px-5 py-3 text-right font-semibold tabular-nums text-secondary-navy">
                  {order.planned_output_qty}
                </td>

                {/* 계획일 */}
                <td className="px-5 py-3 tabular-nums text-gray-500">
                  {formatPlanDate(order.plan_date)}
                </td>

                {/* 납기 */}
                <td className="px-5 py-3 font-semibold tabular-nums text-secondary-navy">
                  {formatDueDate(order.due_date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
