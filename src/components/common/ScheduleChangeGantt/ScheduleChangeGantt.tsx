import { useState } from 'react';

import type { ScheduleMachineRow } from '@/types';

interface ScheduleChangeGanttProps {
  rows: ScheduleMachineRow[];
  startHour: number;
  endHour: number;
}

const LABEL_W = '8.5rem';
const COL_GAP = '0.625rem';

function formatHour(hour: number) {
  return `${String(Math.floor(hour)).padStart(2, '0')}:00`;
}

/** 스케줄 변경 간트 — 장비별 유닛 바, 영향 유닛 클릭 시 납기 세로선 + 여유 시간 표시 */
export function ScheduleChangeGantt({ rows, startHour, endHour }: ScheduleChangeGanttProps) {
  const total = endHour - startHour;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pct = (hour: number) => ((hour - startHour) / total) * 100;
  const ticks = Array.from({ length: Math.floor(total / 2) + 1 }, (_, i) => startHour + i * 2);

  const selectedUnit =
    rows
      .flatMap((row) => row.units)
      .find(
        (unit) =>
          unit.unit_id === selectedId &&
          unit.affected &&
          (unit.due != null || unit.due_label != null)
      ) ?? null;

  // 납기가 오늘이면 차트 내 위치, 아니면 차트 맨 끝(100%)
  const dueToday = selectedUnit ? selectedUnit.due_today !== false : true;
  const duePct = selectedUnit && dueToday && selectedUnit.due != null ? pct(selectedUnit.due) : 100;
  const dueLeft = `calc(${LABEL_W} + ${COL_GAP} + (100% - ${LABEL_W} - ${COL_GAP}) * ${duePct / 100})`;
  const leadHours = selectedUnit
    ? dueToday && selectedUnit.due != null
      ? selectedUnit.due - selectedUnit.end
      : (selectedUnit.due_lead_hr ?? 0)
    : 0;
  const dueLabel = selectedUnit
    ? dueToday && selectedUnit.due != null
      ? formatHour(selectedUnit.due)
      : (selectedUnit.due_label ?? '')
    : '';

  return (
    <div>
      {/* 시간 눈금 */}
      <div
        className="grid items-end"
        style={{ gridTemplateColumns: `${LABEL_W} 1fr`, columnGap: COL_GAP }}
      >
        <div />
        <div className="relative h-4">
          {ticks.map((hour, index) => (
            <span
              key={hour}
              className="absolute top-0 text-caption-2 text-gray-400"
              style={{
                left: `${(index / (ticks.length - 1)) * 100}%`,
                transform:
                  index === 0
                    ? 'translateX(0)'
                    : index === ticks.length - 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
            >
              {formatHour(hour)}
            </span>
          ))}
        </div>
      </div>

      {/* 행 + 납기 세로선 */}
      <div className="relative mt-1 flex flex-col gap-1.5">
        {rows.map((row) => {
          return (
            <div
              key={row.machine}
              className="grid items-center"
              style={{ gridTemplateColumns: `${LABEL_W} 1fr`, columnGap: COL_GAP }}
            >
              <div className="min-w-0">
                <p className="truncate text-label-3 font-bold text-secondary-navy">{row.machine}</p>
              </div>

              <div className="relative h-7">
                {row.units.map((unit) => {
                  const left = pct(unit.start);
                  const width = Math.max(pct(unit.end) - pct(unit.start), 6);
                  const isSelected = unit.unit_id === selectedId;
                  return (
                    <button
                      key={unit.unit_id}
                      type="button"
                      disabled={!unit.affected}
                      onClick={() => setSelectedId(isSelected ? null : unit.unit_id)}
                      className={`absolute top-1/2 flex h-6 -translate-y-1/2 items-center justify-center truncate rounded-md px-2 text-caption-1 font-semibold transition ${
                        unit.affected
                          ? `bg-primary-500 text-white ${isSelected ? 'ring-2 ring-primary-300' : ''}`
                          : 'cursor-default bg-gray-200 text-gray-600'
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {unit.unit_id}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 선택된 영향 유닛의 납기 세로선 (오늘=차트 내 위치 / 오늘 아님=맨 끝 + 날짜) */}
        {selectedUnit ? (
          <div
            className={`pointer-events-none absolute bottom-0 top-0 z-20 ${
              dueToday
                ? 'w-px bg-secondary-navy-soft'
                : 'w-0 border-l border-dashed border-secondary-navy-soft'
            }`}
            style={{ left: dueLeft }}
          >
            <span
              className={`absolute -top-4 whitespace-nowrap rounded-full bg-secondary-navy-soft px-2 py-0.5 text-caption-2 font-semibold text-white ${
                dueToday ? 'left-1/2 -translate-x-1/2' : '-translate-x-full'
              }`}
            >
              납기 {dueLabel} · {leadHours}시간 전 완료
            </span>
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-caption-1 text-gray-400">
        * 강조된 유닛을 클릭하면 납기 기한과 여유 시간을 확인할 수 있습니다.
      </p>
    </div>
  );
}
