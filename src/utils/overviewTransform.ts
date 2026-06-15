import type { DistrictOverviewDto, OverviewLatestReschedule } from '@/apis/types';
import type {
  DistrictOverview,
  OverviewMachine,
  OverviewMachineStatus,
  ProcessStep,
  PropagationNode,
} from '@/mocks/districtOverview';

const STEP_LETTERS: ProcessStep[] = ['A', 'B', 'C', 'D'];

/**
 * 고정 매핑(추론 X): MACHINE-NN 번호로 스텝 결정.
 * DST-01: A 01~04 / B 10~15 / C 22~25 / D 31~34
 * DST-02: A 05~09 / B 16~21 / C 26~30 / D 35~39
 * → 번호 구간: 1~9=A, 10~21=B, 22~30=C, 31~ =D
 */
function stepOf(machineId: string): ProcessStep {
  const n = parseInt(machineId.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n)) return 'A';
  if (n <= 9) return 'A';
  if (n <= 21) return 'B';
  if (n <= 30) return 'C';
  return 'D';
}

/** processStep 문자열 → 스텝 레터 ('STEP_A' / 'A' 모두 허용) */
function stepLetterOf(processStep: string): ProcessStep | null {
  const s = processStep.replace(/^STEP_/i, '').trim().toUpperCase();
  return (STEP_LETTERS as string[]).includes(s) ? (s as ProcessStep) : null;
}

/** 백엔드 machineStatus → overview 상태 (가동 / 점검중 / 정지) */
function toStatus(s: string): OverviewMachineStatus {
  switch (s) {
    case '가동':
    case '가동중':
      return '가동중';
    case '점검중':
      return '점검중';
    case '장애':
    case '고장':
      return '장애';
    case '정지':
    case '대기중':
    case '대기':
      return '정지';
    default:
      return '가동중';
  }
}

function round1(v: number | null | undefined): number {
  return v == null ? 0 : Math.round(v * 10) / 10;
}

/** ISO/시각 문자열 → 'HH:mm' */
function hhmm(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = iso.includes('T') ? iso.split('T')[1] : iso;
  return t.slice(0, 5);
}

/**
 * 원인→영향 전파 유추 (propagation 배열 미제공):
 * 원인 = 재조정 스텝의 정지 장비, 영향 = delayRisks[].machineId.
 */
function derivePropagation(machines: OverviewMachine[], latest: OverviewLatestReschedule): PropagationNode[] {
  const causeLetter = latest.processStep ? stepLetterOf(latest.processStep) : null;
  let cause: OverviewMachine | undefined;
  if (causeLetter) {
    const inStep = machines.filter((m) => m.step === causeLetter);
    cause = inStep.find((m) => m.machine_status === '정지' || m.machine_status === '장애') ?? inStep[0];
  }
  if (!cause) cause = machines.find((m) => m.machine_status === '정지' || m.machine_status === '장애');
  if (!cause) return [];

  const causeId = cause.machine_id;
  const delayRisks = latest.delayRisks ?? [];
  const impactIds = Array.from(
    new Set(delayRisks.map((r) => r.machineId).filter((x): x is string => !!x && x !== causeId))
  );
  let impacts = machines.filter((m) => impactIds.includes(m.machine_id));
  if (impacts.length === 0 && causeLetter) {
    const nextLetter = STEP_LETTERS[STEP_LETTERS.indexOf(causeLetter) + 1];
    const nm = nextLetter ? machines.find((m) => m.step === nextLetter) : undefined;
    if (nm) impacts = [nm];
  }
  return [
    { machine_id: causeId, role: 'cause' },
    ...impacts.map((m) => ({ machine_id: m.machine_id, role: 'impact' as const })),
  ];
}

/** GET /api/monitoring/overview 한 구역 DTO → 전체 대시보드 DistrictOverview */
export function buildDistrictOverview(dto: DistrictOverviewDto, color: string): DistrictOverview {
  const machines: OverviewMachine[] = dto.machines.map((m) => ({
    machine_id: m.machineId,
    machine_status: toStatus(m.machineStatus),
    step: stepOf(m.machineId),
    utilization: round1(m.utilizationRate),
    active_unit: m.activeUnitId,
    fault_since: m.faultSince, // ISO (정지 시작) 또는 null
    fault_elapsed_hr: null, // 표시 시 sim 현재시각으로 계산
    recovery_eta: m.recoveryEta, // 항상 null
  }));

  const total = machines.length;
  const down = machines.filter((m) => m.machine_status === '장애' || m.machine_status === '정지').length;

  const sortedQueues = [...dto.stepQueues].sort((a, b) => b.waitingUnitCount - a.waitingUnitCount);
  const top = sortedQueues[0] ?? null;
  const lr = dto.latestReschedule;

  return {
    district_id: dto.districtId,
    area: dto.districtName ?? dto.districtId,
    label: dto.districtName ?? dto.districtId,
    color,
    summary: {
      total_machine_count: total,
      available_machine_count: total - down,
      down_machine_count: down,
      avg_utilization_rate: round1(dto.summary.avgUtilizationRate),
      total_waiting_unit_count: dto.summary.totalWaitingUnitCount,
      avg_wait_time_min: round1(dto.summary.avgWaitTimeMin),
      daily_output_qty: dto.summary.dailyOutputQty ?? 0,
    },
    machines,
    reschedule_group_count: dto.rescheduleGroupCount,
    latest_reschedule: lr
      ? {
          group_id: lr.groupId,
          process_step: lr.processStep,
          max_risk_score: lr.maxRiskScore ?? 0,
          occurred_at: hhmm(lr.occurredAt),
          cause: lr.rootCauseCategory ?? '',
          affected_units: lr.affectedUnits ?? [],
          affected_steps: [lr.processStep],
          delay_risks: (lr.delayRisks ?? []).map((r) => ({
            risk_id: r.riskId,
            risk_level: r.riskLevel,
            detection_time: hhmm(r.detectionTime),
            estimated_delay_hr: r.estimatedDelayHr,
            delay_probability: r.delayProbability,
            risk_factor: r.riskFactor,
          })),
          propagation: derivePropagation(machines, lr),
        }
      : null,
    top_queue: top ? { step: top.processStep, waiting_unit_count: top.waitingUnitCount } : null,
    queue_by_step: sortedQueues.map((s) => ({ step: s.processStep, waiting: s.waitingUnitCount })),
  };
}
