import { X } from 'lucide-react';

import type { MachineDatum, MachineUnit } from './Machine';
import { machineStatusBadgeClass } from './fleetStatus';
import { formatHour, useCurrentHour } from './useCurrentHour';

interface MachineDetailPanelProps {
  machine: MachineDatum | null;
  open: boolean;
  onClose: () => void;
}

/** 우선순위(1~5) 칩 색상 — 낮은 숫자일수록 높은 우선순위(긴급) */
function priorityChipClass(priority: number) {
  if (priority <= 2) {
    return 'border-primary-100 bg-primary-50 text-primary-600';
  }
  if (priority === 3) {
    return 'border-orange-100 bg-orange-50 text-orange-700';
  }
  return 'border-gray-200 bg-gray-100 text-gray-600';
}

/** 현재 진행 중인 UNIT 카드: 우선순위 + 시작→예상 종료 + 진행 바 */
function CurrentUnitCard({ unit, currentHour }: { unit: MachineUnit; currentHour: number }) {
  const ratio = (currentHour - unit.start_time) / (unit.end_time - unit.start_time);
  const progress = Math.min(Math.max(ratio, 0), 1);

  return (
    <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[15px] font-bold text-secondary-navy">{unit.unit_id}</span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityChipClass(unit.priority)}`}
        >
          우선순위 {unit.priority}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] font-medium text-gray-500">
        <span>
          {formatHour(unit.start_time)} → {formatHour(unit.end_time)}
        </span>
        <span className="font-semibold text-primary-600">{Math.round(progress * 100)}%</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-primary-500 transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** 장비 클릭 시 우측에서 슬라이드되어 나오는 상세 패널 */
export function MachineDetailPanel({ machine, open, onClose }: MachineDetailPanelProps) {
  const currentHour = useCurrentHour();
  const currentUnit = machine?.units?.find((unit) => unit.status === '진행중') ?? null;

  return (
    <div
      className={`absolute bottom-0 right-0 top-0 z-20 flex w-[340px] max-w-[85%] p-3 transition-transform duration-500 ease-out ${
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      <div className="flex h-full w-full flex-col rounded-[1.5rem] border border-gray-200/85 bg-white/96 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur">
        {/* 헤더 — 장비 이름이 가장 큰 글씨 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-heading-2 text-secondary-navy">
              {machine?.machine_type ?? '-'}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[13px] font-medium text-gray-400">{machine?.machine_id}</span>
              {machine ? (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${machineStatusBadgeClass(machine.machine_status)}`}
                >
                  {machine.machine_status}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="상세 패널 닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-secondary-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 가동률 — 숫자만 */}
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-100 px-4 py-3">
          <span className="text-[13px] font-medium text-gray-500">가동률</span>
          <span className="text-[26px] font-bold leading-none text-secondary-navy">
            {machine?.avg_utilization_rate ?? 0}
            <span className="ml-0.5 text-[14px] font-semibold text-gray-400">%</span>
          </span>
        </div>

        {/* 현재 진행 중인 UNIT */}
        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <p className="mb-2 text-[12px] font-semibold text-gray-500">현재 진행 중 UNIT</p>
          {currentUnit ? (
            <CurrentUnitCard unit={currentUnit} currentHour={currentHour} />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-surface-100/60 text-[13px] font-medium text-gray-400">
              진행 중인 UNIT이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
