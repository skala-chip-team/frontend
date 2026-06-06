import { MachineScheduleGanttBoard } from '@components/common';
import { MachineFleet3D } from '@components/three';

const machineSchedules = [
  {
    machineName: 'Diffusion Line A',
    machineCode: 'M-201',
    utilization: 72,
    status: '가동중' as const,
    units: [
      {
        id: 'unit-a1',
        unitName: 'UNIT-041',
        startHour: 8,
        endHour: 10,
        tone: 'primary' as const,
      },
      {
        id: 'unit-a2',
        unitName: 'UNIT-117',
        startHour: 10,
        endHour: 13,
        tone: 'navy' as const,
      },
      {
        id: 'unit-a3',
        unitName: 'UNIT-233',
        startHour: 14,
        endHour: 17,
        tone: 'orange' as const,
      },
    ],
  },
  {
    machineName: 'Etching Line B',
    machineCode: 'M-305',
    utilization: 64,
    status: '점검중' as const,
    units: [
      {
        id: 'unit-b1',
        unitName: 'UNIT-012',
        startHour: 9,
        endHour: 11,
        tone: 'slate' as const,
      },
      {
        id: 'unit-b2',
        unitName: 'UNIT-126',
        startHour: 11,
        endHour: 15,
        tone: 'primary' as const,
      },
      {
        id: 'unit-b3',
        unitName: 'UNIT-188',
        startHour: 16,
        endHour: 18,
        tone: 'navy' as const,
      },
    ],
  },
  {
    machineName: 'Packaging Cell C',
    machineCode: 'M-412',
    utilization: 81,
    status: '대기중' as const,
    units: [
      {
        id: 'unit-c1',
        unitName: 'UNIT-054',
        startHour: 8,
        endHour: 12,
        tone: 'orange' as const,
      },
      {
        id: 'unit-c2',
        unitName: 'UNIT-061',
        startHour: 12,
        endHour: 14,
        tone: 'primary' as const,
      },
      {
        id: 'unit-c3',
        unitName: 'UNIT-075',
        startHour: 15,
        endHour: 18,
        tone: 'slate' as const,
      },
    ],
  },
];

const fleetMachines = machineSchedules.map(({ machineName, machineCode, utilization, status }) => ({
  machineName,
  machineCode,
  utilization,
  status,
}));

const queueUnits = machineSchedules.flatMap((schedule) =>
  schedule.units.map((unit) => unit.unitName)
);

export default function DashboardPage() {
  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-100/85 via-white/45 to-transparent" />
            <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-primary-500/6 blur-3xl" />
            <div className="absolute -left-12 bottom-8 h-36 w-36 rounded-full bg-secondary-orange/8 blur-3xl" />
          </div>
          <div className="relative h-[480px] w-full overflow-hidden bg-surface-100 lg:h-[620px]">
            <MachineFleet3D machines={fleetMachines} queuedUnits={queueUnits} />
          </div>
        </section>

        <MachineScheduleGanttBoard startHour={8} endHour={18} schedules={machineSchedules} />
      </div>
    </section>
  );
}
