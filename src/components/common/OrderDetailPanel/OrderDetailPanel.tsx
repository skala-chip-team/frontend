import type { ReactNode } from 'react';
import { Check, Clock, Cpu, X, Zap } from 'lucide-react';

import {
  districtShort,
  formatDueDate,
  formatPlanDate,
  orderProgress,
  orderStatus,
  orderStatusColor,
  priorityMeta,
  type StepState,
  unitStepStates,
} from '@/utils';
import type { Order, OrderUnit, OrderUnitStatus } from '@/types';

import { Chip, type ChipColor } from '../Chip';

function unitStatusColor(status: OrderUnitStatus): ChipColor {
  if (status === '완료') return 'emerald';
  if (status === '진행중') return 'primary';
  return 'gray';
}

interface OrderDetailPanelProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

/** 주문 클릭 시 우측에서 슬라이드되는 상세 패널 — 주문 정보 + 유닛별 공정 진행 */
export function OrderDetailPanel({ order, open, onClose }: OrderDetailPanelProps) {
  return (
    <div
      className={`fixed bottom-0 right-0 top-16 z-40 flex w-[420px] max-w-[90%] flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      {order ? <OrderDetailBody key={order.order_id} order={order} onClose={onClose} /> : null}
    </div>
  );
}

function OrderDetailBody({ order, onClose }: { order: Order; onClose: () => void }) {
  const status = orderStatus(order.units);
  const { done, total, percent } = orderProgress(order.units);
  const priority = priorityMeta(order.order_priority);

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
        <div className="min-w-0">
          <p className="text-label-3 font-semibold uppercase tracking-[0.18em] text-gray-400">
            주문 상세
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="text-heading-3 text-secondary-navy">{order.order_id}</h3>
            {order.is_burst ? (
              <Chip variant="subtle" color="red" size="xs" className="font-bold">
                <Zap className="h-3 w-3" aria-hidden />
                긴급
              </Chip>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Chip variant="outline" size="sm">
              구역 {districtShort(order.district_id)}
            </Chip>
            <Chip variant="soft" color={orderStatusColor(status)} size="sm">
              {status}
            </Chip>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="패널 닫기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-secondary-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        {/* 주문 정보 */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCell label="계획일" value={formatPlanDate(order.plan_date)} />
          <InfoCell label="납기" value={formatDueDate(order.due_date)} />
          <InfoCell label="계획 수량" value={`${order.planned_output_qty}`} />
          <InfoCell
            label="우선순위"
            value={
              <Chip variant="soft" color={priority.color} size="sm" className="font-semibold">
                P{order.order_priority} · {priority.label}
              </Chip>
            }
          />
        </div>

        {/* 전체 진행률 */}
        <div className="rounded-xl bg-surface-100 p-4">
          <div className="flex items-end justify-between">
            <p className="text-label-3 font-semibold text-gray-400">전체 진행률</p>
            <p className="text-label-2 font-bold text-secondary-navy">
              완료 <span className="text-[1.125rem]">{done}</span>
              <span className="text-gray-400"> / {total} UNIT</span>
            </p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
            <span
              className="block h-full rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* 유닛별 공정 진행 */}
        <div>
          <p className="mb-2 text-label-3 font-semibold text-gray-400">
            유닛별 진행 ({order.units.length})
          </p>
          <div className="flex flex-col gap-3">
            {order.units.map((unit) => (
              <UnitCard key={unit.unit_id} unit={unit} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <p className="text-label-3 text-gray-400">{label}</p>
      <div className="mt-1 text-label-1 font-bold tabular-nums text-secondary-navy">{value}</div>
    </div>
  );
}

/** 유닛 카드 — 상태 + 공정 파이프라인 + 현재 위치/완료 예상 */
function UnitCard({ unit }: { unit: OrderUnit }) {
  const steps = unitStepStates(unit);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-1 font-bold text-secondary-navy">{unit.unit_id}</span>
        <span className="flex items-center gap-2">
          <span className="text-label-3 text-gray-400">{unit.unit_size_qty}개</span>
          <Chip variant="soft" color={unitStatusColor(unit.unit_status)} size="xs">
            {unit.unit_status}
          </Chip>
        </span>
      </div>

      {/* 공정 파이프라인 A → B → C → D */}
      <StepPipeline steps={steps} className="mt-3.5" />

      {/* 현재 위치 / 완료 정보 */}
      <div className="mt-3.5 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
        {unit.unit_status === '진행중' ? (
          <Row icon={<Cpu className="h-3.5 w-3.5" />} label="현재 위치">
            <span className="font-semibold text-secondary-navy">{stepLabel(unit.current_step)}</span>
            {unit.current_machine ? (
              <span className="text-gray-400"> · {unit.current_machine}</span>
            ) : null}
          </Row>
        ) : null}
        {unit.unit_status === '완료' ? (
          <Row icon={<Check className="h-3.5 w-3.5" />} label="완료 시각">
            <span className="font-bold text-emerald-600">{unit.actual_complete_time}</span>
          </Row>
        ) : (
          <Row icon={<Clock className="h-3.5 w-3.5" />} label="완료 예상">
            <span className="font-bold text-secondary-navy">
              {unit.estimated_complete_time ?? '-'}
            </span>
          </Row>
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-label-3">
      <span className="flex items-center gap-1.5 text-gray-400">
        {icon}
        {label}
      </span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}

function stepLabel(step: string | null): string {
  if (!step) return '-';
  return `STEP ${step.replace('STEP_', '')}`;
}

/** 공정 파이프라인 — 완료(네이비+체크) / 진행중(프라이머리+링) / 대기(회색) */
function StepPipeline({
  steps,
  className = '',
}: {
  steps: { code: string; label: string; state: StepState }[];
  className?: string;
}) {
  const connector = (filled: boolean) =>
    `h-0.5 flex-1 rounded-full ${filled ? 'bg-secondary-navy' : 'bg-gray-200'}`;

  return (
    <div className={`flex items-start ${className}`}>
      {steps.map((step, index) => (
        <div key={step.code} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <span className={index === 0 ? 'flex-1 opacity-0' : connector(steps[index - 1].state === 'done')} />
            <StepNode label={step.label} state={step.state} />
            <span className={index === steps.length - 1 ? 'flex-1 opacity-0' : connector(step.state === 'done')} />
          </div>
          <span
            className={`mt-1.5 text-label-3 font-semibold ${
              step.state === 'pending' ? 'text-gray-400' : 'text-secondary-navy'
            }`}
          >
            STEP {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StepNode({ label, state }: { label: string; state: StepState }) {
  if (state === 'done') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-navy text-white">
        <Check className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-label-2 font-bold text-white ring-4 ring-primary-100">
        {label}
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-label-2 font-bold text-gray-400">
      {label}
    </span>
  );
}
