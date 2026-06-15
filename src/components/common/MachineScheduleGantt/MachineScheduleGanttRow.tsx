import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

type ScheduleItemTone = 'primary' | 'navy' | 'orange' | 'slate';

/** 간트 표시 모드: 계획(schedule master) / 실적(work-status) */
type GanttViewMode = 'plan' | 'actual';

// 필드명은 docs/data.dbml 컬럼명을 따른다. (tone 은 UI 전용)
type MachineScheduleItem = {
  schedule_id: string; // schedule_master.schedule_id
  unit_id: string; // unit_master.unit_id
  priority: number; // schedule_master.priority (1 높음 ~ 5 낮음)
  start_time: number; // (호환) 병합 시각
  end_time: number;
  // 계획/실적 시각 (시 단위 소수)
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
  units: MachineScheduleItem[];
};

type MachineScheduleGanttRowProps = {
  schedule: MachineScheduleRowData;
  startHour: number;
  endHour: number;
  /** 현재 시각(시 단위) — 진행중 실적 막대를 여기까지 그린다 */
  currentHour: number;
  /** 표시 모드(계획/실적) */
  mode: GanttViewMode;
};

// 막대 사이 간격(%)과 최소 폭(%). 전체 시간폭 대비 비율.
const BAR_GAP = 0.3;
const MIN_BAR_WIDTH = 0.6;

// 계획 = 옅은 점선 고스트, 실적 = tone 색 채움
const PLAN_CLASS = 'border border-dashed border-gray-300 bg-gray-100/80 text-gray-600';
const actualToneClassMap: Record<ScheduleItemTone, string> = {
  primary: 'bg-primary-500/80 border border-primary-300 text-white',
  navy: 'bg-secondary-navy/75 border border-slate-400 text-white',
  orange: 'bg-secondary-orange/85 border border-orange-300 text-white',
  slate: 'bg-gray-400/85 border border-gray-300 text-white',
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

  // 모드별 막대 데이터 산출
  const bars = schedule.units
    .map((u) => {
      if (mode === 'plan') {
        const start = u.plan_start ?? u.start_time;
        const end = u.plan_end ?? u.end_time;
        return {
          u,
          start,
          end,
          cls: PLAN_CLASS,
          tip: `${u.unit_id} · P${u.priority} · 계획 ${fmtHour(start)}–${fmtHour(end)}`,
        };
      }
      // actual
      const start = u.actual_start ?? null;
      if (start == null) return null; // 미시작 → 실적 막대 없음
      const inProgress = (u.actual_end ?? null) == null;
      let end = u.actual_end ?? currentHour; // 진행중이면 현재 시각까지
      if (end < start) end = start; // 시계 오차 방어
      if (end > endHour) end = endHour;
      return {
        u,
        start,
        end,
        cls: actualToneClassMap[u.tone ?? 'primary'],
        tip: `${u.unit_id} · P${u.priority} · 현재 상태 ${fmtHour(start)}–${inProgress ? '진행중' : fmtHour(end)}`,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b != null);

  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-4 py-1">
      <h3 className="sticky left-0 z-30 flex items-center self-stretch overflow-hidden bg-white pr-3 text-body-2 font-semibold text-gray-900">
        <span className="truncate">{schedule.machine_id}</span>
      </h3>

      <div className="relative h-8">
        {bars.map(({ u, start, end, cls, tip: label }) => {
          const { left, width } = geom(start, end);
          return (
            <div
              key={u.schedule_id}
              className={`absolute top-1/2 flex h-7 -translate-y-1/2 items-center gap-1.5 overflow-hidden rounded-lg px-2 ${cls}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onMouseEnter={(e) => showTip(e, label)}
              onMouseMove={moveTip}
              onMouseLeave={hideTip}
            >
              <span className="truncate text-[11px] font-semibold leading-none">{u.unit_id}</span>
              <span className="ml-auto shrink-0 rounded bg-white/35 px-1 text-[9px] font-bold leading-tight">
                P{u.priority}
              </span>
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
