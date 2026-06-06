type ScheduleItemTone = 'primary' | 'navy' | 'orange' | 'slate';

type MachineScheduleItem = {
  id: string;
  unitName: string;
  startHour: number;
  endHour: number;
  tone?: ScheduleItemTone;
};

type MachineScheduleRowData = {
  machineName: string;
  machineCode: string;
  utilization: number;
  units: MachineScheduleItem[];
};

type MachineScheduleGanttRowProps = {
  schedule: MachineScheduleRowData;
  startHour: number;
  endHour: number;
};

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
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-4 py-3">
      <h3 className="text-body-2 font-semibold text-gray-900 lg:text-body-1">
        {schedule.machineName}
      </h3>

      <div className="relative h-12">
        <div className="relative h-full">
          {schedule.units.map((unit) => {
            const left = ((unit.startHour - startHour) / totalHours) * 100;
            const width = ((unit.endHour - unit.startHour) / totalHours) * 100;
            const toneClass = scheduleToneClassMap[unit.tone ?? 'primary'];

            return (
              <div
                key={unit.id}
                className={`absolute top-1/2 z-10 flex h-10 -translate-y-1/2 items-center rounded-xl px-3 text-label-2 font-semibold backdrop-blur-[1px] ${toneClass}`}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 8)}%`,
                }}
              >
                <span className="truncate">{unit.unitName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { MachineScheduleItem, MachineScheduleRowData, MachineScheduleGanttRowProps };
