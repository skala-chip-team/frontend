import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

type ScheduleItemTone = 'primary' | 'navy' | 'orange' | 'slate';

/** 간트 표시 모드: 계획(schedule master) / 현재 상태(work-status) */
type GanttViewMode = 'plan' | 'actual';

// 필드명은 docs/data.dbml 컬럼명을 따른다. (tone 은 UI 전용)
type MachineScheduleItem = {
  schedule_id: string; // schedule_master.schedule_id
  unit_id: string; // unit_master.unit_id
  priority: number; // schedule_master.priority (1 높음 ~ 5 낮음)
  start_time: number; // (호환) 병합 시각
  end_time: number;
  // 계획/현재 상태 시각 (시 단위 소수)
  plan_start?: number;
  plan_end?: number;
  actual_start?: number | null;
  actual_end?: number | null;
  tone?: ScheduleItemTone;
};

type MachineScheduleRowData = {
  machine_id: string; // machine_master.machine_id
  machine_type: string; // machine_master.machine_type (표시용 장비명)
  avg_utilization_rate: number; // 가동률(%)
  units: MachineScheduleItem[]; // 실제 투입 장비 기준('현재 상태')
  plan_units?: MachineScheduleItem[]; // 계획 장비 기준('계획')
};

type MachineScheduleGanttRowProps = {
  schedule: MachineScheduleRowData;
  startHour: number;
  endHour: number;
  /** 현재 시각(시 단위) — 진행중 막대를 여기까지 그린다 */
  currentHour: number;
  /** 표시 모드(계획/현재 상태) */
  mode: GanttViewMode;
  /** 승인된 재조정으로 계획이 바뀐 unit_id 집합 — 계획 탭에서 강조 */
  highlightUnitIds?: Set<string>;
};

// 막대 사이 간격(%)과 최소 폭(%). 전체 시간폭 대비 비율.
const BAR_GAP = 0.3;
const MIN_BAR_WIDTH = 0.6;

// 계획 = 옅은 점선 고스트, 현재 상태 = tone 색 채움(그라데이션)
const PLAN_CLASS = 'border border-dashed border-gray-300 bg-gray-50 text-gray-500';
// 승인된 재조정으로 바뀐 unit — 빨간색(채움)으로 강조. 계획/현재 상태 양쪽 모두 적용.
const RESCHEDULED_CLASS =
  'border border-primary-600 bg-primary-500 text-white shadow-[0_2px_8px_rgba(234,0,44,0.45)] ring-1 ring-primary-300';
const actualToneClassMap: Record<ScheduleItemTone, string> = {
  primary:
    'border border-primary-400/50 bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-[0_2px_7px_rgba(234,0,44,0.28)]',
  navy: 'border border-slate-500/50 bg-gradient-to-b from-secondary-navy to-slate-800 text-white shadow-[0_2px_7px_rgba(15,23,42,0.25)]',
  orange:
    'border border-orange-300/60 bg-gradient-to-b from-secondary-orange to-orange-500 text-white shadow-[0_2px_7px_rgba(234,88,12,0.22)]',
  slate: 'border border-gray-300/60 bg-gradient-to-b from-gray-400 to-gray-500 text-white shadow-[0_2px_7px_rgba(15,23,42,0.18)]',
};

/** 시(소수) → 'HH:MM' */
function fmtHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function MachineScheduleGanttRow({
  schedule,
  startHour,
  endHour,
  currentHour,
  mode,
  highlightUnitIds,
}: MachineScheduleGanttRowProps) {
  const totalHours = endHour - startHour;

  // 좁은 막대는 글씨가 잘리므로 hover 시 풀네임·시간을 툴팁으로 보여준다.
  // (간트 스크롤 컨테이너 overflow에 잘리지 않도록 body로 portal)
  const [tip, setTip] = useState<{ x: number; y: number; label: string } | null>(null);
  const moveTip = (e: MouseEvent<HTMLDivElement>) =>
    setTip((p) => (p ? { ...p, x: e.clientX, y: e.clientY } : p));
  const hideTip = () => setTip(null);
  const showTip = (e: MouseEvent<HTMLDivElement>, label: string) =>
    setTip({ x: e.clientX, y: e.clientY, label });

  const geom = (start: number, end: number) => {
    const left = ((start - startHour) / totalHours) * 100;
    const rawWidth = ((end - start) / totalHours) * 100;
    const width = Math.max(rawWidth - BAR_GAP, MIN_BAR_WIDTH);
    return { left, width };
  };

  // 모드별 소스: 계획은 계획 장비 기준(plan_units), 현재 상태는 실제 장비 기준(units)
  const source = mode === 'plan' ? (schedule.plan_units ?? schedule.units) : schedule.units;

  // 모드별 막대 데이터 산출
  const bars = source
    .map((u) => {
      const rescheduled = highlightUnitIds?.has(u.unit_id) ?? false; // 승인된 재조정으로 바뀐 unit
      if (mode === 'plan') {
        const start = u.plan_start ?? u.start_time;
        const end = u.plan_end ?? u.end_time;
        return {
          u,
          start,
          end,
          inProgress: false,
          cls: rescheduled ? RESCHEDULED_CLASS : PLAN_CLASS,
          tip: `${u.unit_id} · P${u.priority} · 계획 ${fmtHour(start)}–${fmtHour(end)}${rescheduled ? ' · 재조정 반영' : ''}`,
        };
      }
      // 현재 상태(work-status)
      const start = u.actual_start ?? null;
      if (start == null) return null; // 미시작 → 막대 없음
      const inProgress = (u.actual_end ?? null) == null;
      let end = u.actual_end ?? currentHour; // 진행중이면 현재 시각까지
      if (end < start) end = start; // 시계 오차 방어
      if (end > endHour) end = endHour;
      return {
        u,
        start,
        end,
        inProgress,
        // 재조정으로 바뀐 unit 은 현재 상태 탭에서도 빨갛게 강조
        cls: rescheduled ? RESCHEDULED_CLASS : actualToneClassMap[u.tone ?? 'primary'],
        tip: `${u.unit_id} · P${u.priority} · 현재 상태 ${fmtHour(start)}–${inProgress ? '진행중' : fmtHour(end)}${rescheduled ? ' · 재조정 반영' : ''}`,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b != null);

  return (
    <div className="group grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-4 py-1">
      <h3 className="sticky left-0 z-30 flex items-center self-stretch overflow-hidden bg-white pr-3 text-body-2 font-semibold text-gray-900">
        <span className="truncate">{schedule.machine_id}</span>
      </h3>

      <div className="relative h-8 rounded-md transition group-hover:bg-surface-100/40">
        {bars.map(({ u, start, end, inProgress, cls, tip: label }) => {
          const { left, width } = geom(start, end);
          return (
            <div
              key={u.schedule_id}
              className={`absolute top-1/2 flex h-7 -translate-y-1/2 items-center gap-1.5 overflow-hidden rounded-lg px-2 transition hover:z-10 hover:brightness-105 ${cls}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onMouseEnter={(e) => showTip(e, label)}
              onMouseMove={moveTip}
              onMouseLeave={hideTip}
            >
              {/* 상단 하이라이트 — 입체감 */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-white/15" aria-hidden />
              <span className="relative truncate text-[11px] font-semibold leading-none">{u.unit_id}</span>
              <span className="relative ml-auto shrink-0 rounded bg-white/25 px-1 text-[9px] font-bold leading-tight ring-1 ring-inset ring-white/20">
                P{u.priority}
              </span>
              {/* 진행중 — 우측 끝 펄스 캡 */}
              {inProgress ? (
                <span className="pointer-events-none absolute inset-y-0 right-0 w-1.5 animate-pulse bg-white/60" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>

      {tip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-50 -translate-y-full rounded-md bg-secondary-navy px-2 py-1 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)]"
              style={{ left: tip.x + 12, top: tip.y - 8 }}
            >
              {tip.label}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export type {
  MachineScheduleItem,
  MachineScheduleRowData,
  MachineScheduleGanttRowProps,
  GanttViewMode,
};
