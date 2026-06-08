import { CircleSlash2, Clock, Gauge, Layers, Power } from 'lucide-react';

import type {
  DistrictDashboardData,
  DistrictMachine,
  MachineStatus,
  ProcessStep,
  ScheduledUnit,
  ScheduleTone,
  SummaryCard,
  UnitStatus,
} from '@/types';

const u = (
  schedule_id: string,
  unit_id: string,
  priority: number,
  status: UnitStatus,
  start_time: number,
  end_time: number,
  tone: ScheduleTone
): ScheduledUnit => ({ schedule_id, unit_id, priority, status, start_time, end_time, tone });

const m = (
  machine_id: string,
  machine_type: string,
  machine_status: MachineStatus,
  avg_utilization_rate: number,
  units: ScheduledUnit[]
): DistrictMachine => ({ machine_id, machine_type, machine_status, avg_utilization_rate, units });

const step = (
  step_id: string,
  process_step: string,
  avg_wait_time_min: number,
  machines: DistrictMachine[]
): ProcessStep => ({ step_id, process_step, avg_wait_time_min, machines });

const summary = (
  available: string,
  down: string,
  util: string,
  waiting: string,
  wait: string
): SummaryCard[] => [
  { label: '가동 가능 장비 수', value: available, unit: '대', icon: Power },
  { label: '가동 불가능 장비 수', value: down, unit: '대', icon: CircleSlash2 },
  { label: '평균 가동률', value: util, unit: '%', icon: Gauge },
  { label: '총 대기 UNIT 수', value: waiting, unit: '대', icon: Layers },
  { label: '평균 대기 시간', value: wait, unit: '분', icon: Clock },
];

export const districtLabels: Record<'all' | 'A' | 'B' | 'C', string> = {
  all: '전체 대시보드',
  A: '구역A',
  B: '구역B',
  C: '구역C',
};

export const districtDashboards: Record<'A' | 'B' | 'C', DistrictDashboardData> = {
  // 구역A — 장비 많음
  A: {
    summaryCards: summary('18', '6', '68', '37', '82'),
    steps: [
      step('A-step1', 'Step 1', 14, [
        m('A-201', 'Diffusion Line A', '가동중', 72, [
          u('A1A1', 'UNIT-041', 1, '완료', 8, 10, 'primary'),
          u('A1A2', 'UNIT-117', 2, '진행중', 10, 13, 'navy'),
          u('A1A3', 'UNIT-233', 4, '대기', 14, 17, 'orange'),
        ]),
        m('A-305', 'Etching Line B', '점검중', 64, [
          u('A1B1', 'UNIT-012', 3, '완료', 9, 11, 'slate'),
          u('A1B2', 'UNIT-126', 1, '대기', 11, 15, 'primary'),
        ]),
        m('A-412', 'Packaging Cell C', '대기중', 81, [
          u('A1C1', 'UNIT-054', 2, '대기', 8, 12, 'orange'),
          u('A1C2', 'UNIT-075', 4, '대기', 15, 18, 'slate'),
        ]),
      ]),
      step('A-step2', 'Step 2', 9, [
        m('A-118', 'Litho Line D', '가동중', 88, [
          u('A2A1', 'UNIT-201', 1, '진행중', 8, 12, 'primary'),
          u('A2A2', 'UNIT-205', 3, '대기', 13, 17, 'navy'),
        ]),
        m('A-126', 'Cleaning Bay E', '대기중', 53, [
          u('A2B1', 'UNIT-210', 2, '대기', 9, 12, 'orange'),
          u('A2B2', 'UNIT-219', 5, '대기', 12, 16, 'slate'),
        ]),
      ]),
      step('A-step3', 'Step 3', 26, [
        m('A-330', 'Implant Line F', '가동중', 76, [
          u('A3A1', 'UNIT-301', 1, '완료', 8, 11, 'primary'),
          u('A3A2', 'UNIT-309', 2, '진행중', 11, 14, 'navy'),
          u('A3A3', 'UNIT-318', 4, '대기', 15, 18, 'orange'),
        ]),
        m('A-342', 'CMP Cell G', '점검중', 69, [
          u('A3B1', 'UNIT-322', 3, '완료', 8, 10, 'slate'),
          u('A3B2', 'UNIT-331', 1, '대기', 10, 15, 'primary'),
        ]),
        m('A-355', 'Metrology H', '가동중', 91, [
          u('A3C1', 'UNIT-340', 2, '완료', 9, 12, 'orange'),
          u('A3C2', 'UNIT-351', 3, '진행중', 12, 15, 'navy'),
        ]),
      ]),
      step('A-step4', 'Step 4', 41, [
        m('A-402', 'Anneal Line I', '대기중', 47, [
          u('A4A1', 'UNIT-401', 1, '대기', 8, 13, 'primary'),
          u('A4A2', 'UNIT-412', 4, '대기', 13, 18, 'navy'),
        ]),
      ]),
    ],
  },

  // 구역B — 중간 규모
  B: {
    summaryCards: summary('11', '3', '74', '21', '57'),
    steps: [
      step('B-step1', 'Step 1', 11, [
        m('B-210', 'Coating Line A', '가동중', 80, [
          u('B1A1', 'UNIT-510', 1, '진행중', 8, 12, 'primary'),
          u('B1A2', 'UNIT-522', 3, '대기', 12, 16, 'navy'),
        ]),
        m('B-218', 'Bake Unit B', '대기중', 49, [
          u('B1B1', 'UNIT-531', 2, '대기', 9, 13, 'orange'),
          u('B1B2', 'UNIT-540', 4, '대기', 14, 18, 'slate'),
        ]),
      ]),
      step('B-step2', 'Step 2', 33, [
        m('B-322', 'Develop Line C', '가동중', 67, [
          u('B2A1', 'UNIT-601', 1, '완료', 8, 10, 'primary'),
          u('B2A2', 'UNIT-612', 2, '진행중', 10, 14, 'navy'),
          u('B2A3', 'UNIT-620', 5, '대기', 15, 18, 'orange'),
        ]),
        m('B-334', 'Inspect Cell D', '점검중', 58, [
          u('B2B1', 'UNIT-631', 3, '완료', 8, 11, 'slate'),
        ]),
        m('B-340', 'Sort Cell E', '대기중', 72, [
          u('B2C1', 'UNIT-640', 2, '대기', 9, 13, 'orange'),
          u('B2C2', 'UNIT-651', 4, '대기', 13, 17, 'primary'),
        ]),
      ]),
      step('B-step3', 'Step 3', 19, [
        m('B-450', 'Test Line F', '가동중', 85, [
          u('B3A1', 'UNIT-701', 1, '진행중', 9, 13, 'primary'),
          u('B3A2', 'UNIT-712', 3, '대기', 13, 18, 'navy'),
        ]),
        m('B-462', 'Mark Cell G', '대기중', 41, [
          u('B3B1', 'UNIT-720', 2, '대기', 8, 12, 'slate'),
        ]),
      ]),
    ],
  },

  // 구역C — 소규모
  C: {
    summaryCards: summary('7', '2', '61', '13', '38'),
    steps: [
      step('C-step1', 'Step 1', 8, [
        m('C-101', 'Grind Line A', '가동중', 78, [
          u('C1A1', 'UNIT-801', 1, '진행중', 8, 12, 'primary'),
          u('C1A2', 'UNIT-815', 4, '대기', 13, 18, 'navy'),
        ]),
      ]),
      step('C-step2', 'Step 2', 22, [
        m('C-220', 'Polish Line B', '가동중', 69, [
          u('C2A1', 'UNIT-820', 1, '완료', 8, 11, 'primary'),
          u('C2A2', 'UNIT-831', 2, '진행중', 11, 15, 'navy'),
          u('C2A3', 'UNIT-840', 5, '대기', 15, 18, 'orange'),
        ]),
        m('C-232', 'Wash Cell C', '점검중', 44, [
          u('C2B1', 'UNIT-851', 3, '완료', 9, 12, 'slate'),
        ]),
        m('C-240', 'Dry Cell D', '대기중', 63, [
          u('C2C1', 'UNIT-860', 2, '대기', 8, 13, 'orange'),
        ]),
      ]),
      step('C-step3', 'Step 3', 47, [
        m('C-350', 'Final Line E', '대기중', 52, [
          u('C3A1', 'UNIT-901', 1, '대기', 8, 13, 'primary'),
          u('C3A2', 'UNIT-915', 3, '대기', 13, 18, 'navy'),
        ]),
        m('C-362', 'Ship Cell F', '가동중', 90, [
          u('C3B1', 'UNIT-920', 1, '진행중', 9, 14, 'orange'),
          u('C3B2', 'UNIT-931', 4, '대기', 14, 18, 'primary'),
        ]),
      ]),
    ],
  },
};
