// 전체 공정 대시보드(커맨드센터) mock. 필드명은 백엔드 계약(snake_case) 기준.

export type OverviewMachineStatus = '가동중' | '점검중' | '정지' | '장애';
export type ProcessStep = 'A' | 'B' | 'C' | 'D';

export interface OverviewMachine {
  machine_id: string;
  machine_status: OverviewMachineStatus;
  step: ProcessStep; // 공정 스텝(A/B/C/D)
  utilization: number; // 장비 가동률(%)
  active_unit: string | null; // 현재 투입 UNIT
  fault_since: string | null; // 장애/정지 감지 시각 'HH:mm'
  fault_elapsed_hr: number | null; // 장애 지속 시간(시간)
  recovery_eta: string | null; // 목표 복구 시각 'HH:mm'
}

export interface OverviewDelayRisk {
  risk_id: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  detection_time: string; // 'HH:mm'
  estimated_delay_hr: number;
  delay_probability: number; // 0~1
  risk_factor: string;
}

/** 기계 단위 전파: 원인 기계 → 영향 기계 */
export interface PropagationNode {
  machine_id: string;
  role: 'cause' | 'impact';
}

export interface OverviewLatestReschedule {
  group_id: string;
  process_step: string;
  max_risk_score: number; // 0~1
  occurred_at: string; // 'HH:mm'
  cause: string; // root_cause.category
  affected_units: string[];
  affected_steps: string[];
  delay_risks: OverviewDelayRisk[];
  propagation: PropagationNode[]; // 원인 기계 → 영향 기계
}

export interface DistrictOverviewSummary {
  total_machine_count: number;
  available_machine_count: number;
  down_machine_count: number;
  avg_utilization_rate: number; // %
  total_waiting_unit_count: number;
  avg_wait_time_min: number;
  daily_output_qty: number;
}

export interface DistrictOverview {
  district_id: string;
  area: string; // 영문 공정명 (Photo, Etching …)
  label: string; // 한글 라벨
  color: string; // 구역 대표색(도넛/3D)
  summary: DistrictOverviewSummary;
  machines: OverviewMachine[];
  reschedule_group_count: number;
  latest_reschedule: OverviewLatestReschedule | null;
  top_queue: { step: string; waiting_unit_count: number } | null;
  queue_by_step: { step: string; waiting: number }[];
}

// 전체 공정 흐름(라인) 단계별 상태
export interface ProcessStepStatus {
  step: string;
  label: string;
  wip: number;
  waiting: number;
  throughput: number;
  machine_count: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
}

export const processFlow: ProcessStepStatus[] = [
  { step: 'STEP_A', label: '투입', wip: 5, waiting: 7, throughput: 320, machine_count: 28, risk_level: 'None' },
  { step: 'STEP_B', label: '식각', wip: 3, waiting: 42, throughput: 298, machine_count: 26, risk_level: 'High' },
  { step: 'STEP_C', label: '증착', wip: 8, waiting: 11, throughput: 210, machine_count: 30, risk_level: 'Low' },
  { step: 'STEP_D', label: '검사', wip: 2, waiting: 63, throughput: 186, machine_count: 36, risk_level: 'Critical' },
  { step: 'STEP_E', label: '클린', wip: 4, waiting: 12, throughput: 240, machine_count: 36, risk_level: 'Medium' },
];

const machineId = (n: number) => `MACHINE-${String(n).padStart(2, '0')}`;

/** 스텝별 실제 머신 ID 목록 → 가동 상태 부여 (down/inspect ID 지정) */
function buildMachines(
  groups: Record<ProcessStep, number[]>,
  down: number[],
  inspect: number[]
): OverviewMachine[] {
  const out: OverviewMachine[] = [];
  (['A', 'B', 'C', 'D'] as ProcessStep[]).forEach((step) => {
    groups[step].forEach((id) => {
      let status: OverviewMachineStatus = '가동중';
      if (down.includes(id)) status = id % 2 === 0 ? '장애' : '정지';
      else if (inspect.includes(id)) status = '점검중';
      const running = status === '가동중';
      const isFault = status === '장애' || status === '정지';
      out.push({
        machine_id: machineId(id),
        machine_status: status,
        step,
        utilization: running ? 78 + (id % 21) : status === '점검중' ? 12 + (id % 8) : 0,
        active_unit: running ? `UNIT-${1200 + id}` : null,
        fault_since: isFault ? `0${1 + (id % 4)}:${String((id * 11) % 60).padStart(2, '0')}` : null,
        fault_elapsed_hr: isFault ? Math.round((1.2 + (id % 4) + (id % 3) * 0.3) * 10) / 10 : null,
        recovery_eta: isFault ? `0${4 + (id % 2)}:00` : null,
      });
    });
  });
  return out;
}

function risks(
  base: string,
  rows: Array<[OverviewDelayRisk['risk_level'], string, number, number, string]>
): OverviewDelayRisk[] {
  return rows.map(([lvl, t, hr, p, f], i) => ({
    risk_id: `${base}-${341 + i}`,
    risk_level: lvl,
    detection_time: t,
    estimated_delay_hr: hr,
    delay_probability: p,
    risk_factor: f,
  }));
}

export const districtOverviews: DistrictOverview[] = [
  {
    district_id: 'DST-01',
    area: 'Photo',
    label: '포토',
    color: '#34d399',
    summary: { total_machine_count: 18, available_machine_count: 16, down_machine_count: 2, avg_utilization_rate: 92.1, total_waiting_unit_count: 18, avg_wait_time_min: 12.3, daily_output_qty: 15220 },
    machines: buildMachines(
      { A: [1, 2, 3, 4], B: [10, 11, 12, 13, 14, 15], C: [22, 23, 24, 25], D: [31, 32, 33, 34] },
      [12, 33],
      [23]
    ),
    reschedule_group_count: 1,
    // 데모 시나리오와 정렬: STEP-PHOTO-A1 큐 적체(Queue_Bottleneck), 위험 유닛 UNIT-08·09.
    // group_id 는 어댑터가 어떤 값이든 데모 상세를 돌려주므로 표기만 시나리오에 맞춘다.
    latest_reschedule: {
      group_id: 'GRP-DEMO-IDEAL-0001', process_step: 'STEP-PHOTO-A1', max_risk_score: 0.91, occurred_at: '11:30', cause: 'Queue_Bottleneck',
      affected_units: ['UNIT-08', 'UNIT-09'], affected_steps: ['STEP-PHOTO-A1', 'STEP-PHOTO-A2'],
      delay_risks: risks('RISK', [
        ['Critical', '11:30', 4.5, 0.88, 'Queue_Bottleneck'],
        ['High', '11:30', 3.5, 0.78, 'Queue_Bottleneck'],
      ]),
      propagation: [
        { machine_id: 'MACHINE-10', role: 'cause' },
        { machine_id: 'MACHINE-22', role: 'impact' },
      ],
    },
    top_queue: { step: 'STEP-PHOTO-A1', waiting_unit_count: 9 },
    queue_by_step: [
      { step: 'STEP-PHOTO-A1', waiting: 9 }, { step: 'STEP-PHOTO-A2', waiting: 5 }, { step: 'STEP-ETCH-B1', waiting: 3 }, { step: 'STEP-PKG-C1', waiting: 1 },
    ],
  },
  {
    district_id: 'DST-02',
    area: 'Etching',
    label: '식각',
    color: '#fbbf24',
    summary: { total_machine_count: 21, available_machine_count: 15, down_machine_count: 6, avg_utilization_rate: 76.3, total_waiting_unit_count: 42, avg_wait_time_min: 31.2, daily_output_qty: 10120 },
    machines: buildMachines(
      { A: [5, 6, 7, 8, 9], B: [16, 17, 18, 19, 20, 21], C: [26, 27, 28, 29, 30], D: [35, 36, 37, 38, 39] },
      [6, 17, 18, 28, 37, 39],
      [16, 36]
    ),
    reschedule_group_count: 3,
    latest_reschedule: {
      group_id: 'GR-2025-0517-0131', process_step: 'STEP_B', max_risk_score: 0.81, occurred_at: '14:18', cause: 'Queue_Bottleneck',
      affected_units: ['UNIT-1102', 'UNIT-1110', 'UNIT-1133'], affected_steps: ['STEP_B', 'STEP_C'],
      delay_risks: risks('RISK', [['High', '14:18', 2.1, 0.74, 'Queue_Bottleneck'], ['Medium', '14:02', 1.2, 0.58, 'Machine_Capacity']]),
      propagation: [
        { machine_id: 'MACHINE-18', role: 'cause' },
        { machine_id: 'MACHINE-26', role: 'impact' },
      ],
    },
    top_queue: { step: 'STEP_B', waiting_unit_count: 27 },
    queue_by_step: [
      { step: 'STEP_B', waiting: 27 }, { step: 'STEP_C', waiting: 9 }, { step: 'STEP_A', waiting: 4 }, { step: 'STEP_D', waiting: 2 },
    ],
  },
];
