import { Activity, Cpu, Siren } from 'lucide-react';

import { DashboardInfoCard, MachineScheduleGanttBoard } from '@components/common';
import { MachineFleet3D } from '@components/three';

const summaryStats = [
  {
    label: '오늘 생산량',
    value: '1,284',
    unit: 'wafers',
    accent: 'text-primary-600',
    surface: 'bg-primary-50',
  },
  {
    label: '장비 가동률',
    value: '96.4',
    unit: '%',
    accent: 'text-secondary-navy',
    surface: 'bg-surface-100',
  },
];

const equipmentSummaryItems = [
  {
    label: '가동 장비 수',
    value: '1',
    unit: '개',
    icon: Cpu,
  },
  {
    label: '평균 가동률',
    value: '68',
    unit: '%',
    icon: Activity,
    trend: {
      value: '10%',
      direction: 'up' as const,
      label: '증가',
    },
  },
];

const machineSchedules = [
  {
    machineName: 'Diffusion Line A',
    machineCode: 'M-201',
    utilization: 72,
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

const fleetMachines = machineSchedules.map(({ machineName, machineCode, utilization }) => ({
  machineName,
  machineCode,
  utilization,
}));

export default function DashboardPage() {
  return (
    <section className="min-h-full bg-surface-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.9fr)]">
          <div className="relative overflow-hidden rounded-[2rem] bg-secondary-navy px-8 py-8 text-white shadow-[0_24px_60px_rgba(8,16,40,0.18)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[-8%] top-[-12%] h-52 w-52 rounded-full bg-primary-500/28 blur-3xl" />
              <div className="absolute bottom-[-18%] right-[-8%] h-44 w-44 rounded-full bg-secondary-orange/24 blur-3xl" />
            </div>

            <div className="relative flex flex-col gap-8">
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-primary-300">
                  ROOT OVERVIEW
                </p>
                <h1 className="mt-3 text-heading-2 text-white lg:text-heading-1">
                  로그인 화면의 브랜드 톤을
                  <br />
                  운영 대시보드까지 이어갑니다.
                </h1>
                <p className="mt-4 max-w-2xl text-body-1 text-white/68">
                  메인 컬러는 로그인 CTA의 레드로 통일하고, 좌측 배경에 쓰인 네이비와
                  오렌지는 보조 컬러로 정리했습니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-label-1">
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-white/78">
                  Main: Primary Red
                </span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-white/78">
                  Sub: Navy
                </span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-white/78">
                  Accent: Orange
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <DashboardInfoCard
              eyebrow="EQUIPMENT OVERVIEW"
              title="운영 장비 카드"
              items={equipmentSummaryItems}
            />

            <article className="rounded-[1.6rem] border border-gray-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label-2 uppercase tracking-[0.18em] text-gray-500">
                    긴급 대응
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-bold tracking-[-0.04em] text-secondary-orange">
                      03
                    </span>
                    <span className="pb-1 text-label-1 text-gray-500">cases</span>
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-secondary-orange">
                  <Siren className="h-5 w-5" />
                </div>
              </div>
            </article>

            {summaryStats.map((stat) => (
              <article
                key={stat.label}
                className={`rounded-[1.6rem] border border-gray-200/80 ${stat.surface} p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]`}
              >
                <p className="text-label-2 uppercase tracking-[0.18em] text-gray-500">
                  {stat.label}
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className={`text-4xl font-bold tracking-[-0.04em] ${stat.accent}`}>
                    {stat.value}
                  </span>
                  <span className="pb-1 text-label-1 text-gray-500">{stat.unit}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <article className="rounded-[1.6rem] border border-gray-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-2 uppercase tracking-[0.18em] text-gray-500">EQUIPMENT 3D</p>
              <h2 className="mt-2 text-heading-3 text-secondary-navy">장비 가동 현황</h2>
            </div>
            <span className="text-label-1 text-gray-500">드래그하여 회전</span>
          </div>
          <div className="mt-4 h-[360px] w-full overflow-hidden rounded-2xl bg-surface-100">
            <MachineFleet3D machines={fleetMachines} />
          </div>
        </article>

        <MachineScheduleGanttBoard
          startHour={8}
          endHour={18}
          schedules={machineSchedules}
        />
      </div>
    </section>
  );
}
