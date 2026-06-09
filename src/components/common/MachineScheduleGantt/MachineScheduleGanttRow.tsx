type ScheduleItemTone = 'primary' | 'navy' | 'orange' | 'slate';

// 필드명은 docs/data.dbml 컬럼명을 따른다. (tone 은 UI 전용)
type MachineScheduleItem = {
  schedule_id: string; // schedule_master.schedule_id
  unit_id: string; // unit_master.unit_id
  priority: number; // schedule_master.priority (1 높음 ~ 5 낮음)
  start_time: number; // work_status.start_time (mock: 시 단위)
  end_time: number; // work_status.end_time
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
};

// 막대 사이 간격(%)과 최소 폭(%). 전체 시간폭 대비 비율.
const BAR_GAP = 0.4;
const MIN_BAR_WIDTH = 1.5;

const scheduleToneClassMap: Record<ScheduleItemTone, string> = {
  primary: 'border border-primary-200 bg-primary-500/16 text-primary-700',
  navy: 'border border-slate-200 bg-secondary-navy/12 text-secondary-navy',
  orange: 'border border-orange-200 bg-secondary-orange/14 text-orange-700',
  slate: 'border border-gray-200 bg-gray-200/80 text-gray-700',
};

export function MachineScheduleGanttRow({
  schedule,
  startHour,
  endHour,
}: MachineScheduleGanttRowProps) {
  const totalHours = endHour - startHour;

  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-4 py-1">
      <h3 className="sticky left-0 z-30 flex items-center self-stretch bg-white pr-3 text-body-2 font-semibold text-gray-900">
        {schedule.machine_type}
      </h3>

      <div className="relative h-8">
        <div className="relative h-full">
          {schedule.units.map((unit) => {
            const left = ((unit.start_time - startHour) / totalHours) * 100;
            const rawWidth = ((unit.end_time - unit.start_time) / totalHours) * 100;
            // 실제 시간 폭을 그대로 쓰되, 막대 사이 작은 간격(BAR_GAP)을 빼서 겹침 방지.
            // 너무 짧은 막대는 최소 폭으로 보이게 한다.
            const width = Math.max(rawWidth - BAR_GAP, MIN_BAR_WIDTH);
            const toneClass = scheduleToneClassMap[unit.tone ?? 'primary'];

            return (
              <div
                key={unit.schedule_id}
                className={`absolute top-1/2 z-10 flex h-7 -translate-y-1/2 items-center gap-1.5 rounded-lg px-2.5 text-label-3 font-semibold backdrop-blur-[1px] ${toneClass}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                }}
              >
                <span className="truncate">{unit.unit_id}</span>
                <span className="ml-auto shrink-0 rounded bg-white/65 px-1 text-[9px] font-bold leading-tight">
                  P{unit.priority}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { MachineScheduleItem, MachineScheduleRowData, MachineScheduleGanttRowProps };
