import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

type ScheduleItemTone = 'primary' | 'navy' | 'orange' | 'slate';

// 필드명은 docs/data.dbml 컬럼명을 따른다. (tone 은 UI 전용)
type MachineScheduleItem = {
  schedule_id: string; // schedule_master.schedule_id
  unit_id: string; // unit_master.unit_id
  priority: number; // schedule_master.priority (1 높음 ~ 5 낮음)
  start_time: number; // (호환) 병합 시각
  end_time: number;
  // 계획/실적 2-레인용 (시 단위 소수)
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
};

// 막대 사이 간격(%)과 최소 폭(%). 전체 시간폭 대비 비율.
// 레인이 얇아 글씨를 넣지 않으므로 최소 폭을 작게 둬 좁은 막대가 옆을 침범하지 않게 한다.
const BAR_GAP = 0.3;
const MIN_BAR_WIDTH = 0.6;

// 계획 = 옅은 점선 고스트, 실적 = tone 색 채움
const PLAN_CLASS = 'border border-dashed border-gray-300 bg-gray-100/70';
const actualToneClassMap: Record<ScheduleItemTone, string> = {
  primary: 'bg-primary-500/75 border border-primary-300',
  navy: 'bg-secondary-navy/70 border border-slate-400',
  orange: 'bg-secondary-orange/80 border border-orange-300',
  slate: 'bg-gray-400/80 border border-gray-300',
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
}: MachineScheduleGanttRowProps) {
  const totalHours = endHour - startHour;

  // 막대가 좁아 글씨가 안 들어가므로, hover 시 풀네임·시간을 툴팁으로 보여준다.
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

  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-4 py-1">
      <h3 className="sticky left-0 z-30 flex items-center self-stretch overflow-hidden bg-white pr-3 text-body-2 font-semibold text-gray-900">
        <span className="truncate">{schedule.machine_id}</span>
      </h3>

      <div className="flex flex-col gap-0.5">
        {/* 계획 레인 */}
        <div className="relative h-3.5">
          {schedule.units.map((u) => {
            const ps = u.plan_start ?? u.start_time;
            const pe = u.plan_end ?? u.end_time;
            const { left, width } = geom(ps, pe);
            return (
              <div
                key={`plan-${u.schedule_id}`}
                className={`absolute top-1/2 h-3 -translate-y-1/2 rounded ${PLAN_CLASS}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onMouseEnter={(e) => showTip(e, `${u.unit_id} · P${u.priority} · 계획 ${fmtHour(ps)}–${fmtHour(pe)}`)}
                onMouseMove={moveTip}
                onMouseLeave={hideTip}
              />
            );
          })}
        </div>

        {/* 실적 레인 */}
        <div className="relative h-3.5">
          {schedule.units.map((u) => {
            const as = u.actual_start ?? null;
            if (as == null) return null; // 미시작 → 실적 막대 없음
            const inProgress = (u.actual_end ?? null) == null;
            let ae = u.actual_end ?? currentHour; // 진행중이면 현재 시각까지
            if (ae < as) ae = as; // 시계 오차 방어
            if (ae > endHour) ae = endHour;
            const { left, width } = geom(as, ae);
            const tone = actualToneClassMap[u.tone ?? 'primary'];
            return (
              <div
                key={`actual-${u.schedule_id}`}
                className={`absolute top-1/2 h-3 -translate-y-1/2 rounded ${tone}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onMouseEnter={(e) =>
                  showTip(
                    e,
                    `${u.unit_id} · P${u.priority} · 실적 ${fmtHour(as)}–${inProgress ? '진행중' : fmtHour(ae)}`
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={hideTip}
              />
            );
          })}
        </div>
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

export type { MachineScheduleItem, MachineScheduleRowData, MachineScheduleGanttRowProps };
