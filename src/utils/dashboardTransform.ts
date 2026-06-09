import { CircleSlash2, Clock, Gauge, Layers, Power } from 'lucide-react';

import type {
  DistrictGantt,
  DistrictMachines,
  DistrictStepQueue,
  DistrictSummary,
} from '@apis/index';
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

const TONES: ScheduleTone[] = ['primary', 'navy', 'orange', 'slate'];

/** 백엔드 machineStatus → 프론트 MachineStatus ('가동'은 '가동중'으로) */
function toMachineStatus(raw: string): MachineStatus {
  switch (raw) {
    case '가동':
    case '가동중':
      return '가동중';
    case '점검중':
      return '점검중';
    default:
      return '대기중';
  }
}

/** 백엔드 unitStatus → 프론트 UnitStatus (값은 동일하지만 방어적으로 매핑) */
function toUnitStatus(raw: string): UnitStatus {
  switch (raw) {
    case '진행중':
      return '진행중';
    case '완료':
      return '완료';
    default:
      return '대기';
  }
}

/** ISO datetime → 시(소수). 예: '2025-05-04T11:55:00' → 11.92. 파싱 실패 시 0. */
function toHour(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getHours() + d.getMinutes() / 60;
}

function buildSummaryCards(summary: DistrictSummary): SummaryCard[] {
  return [
    {
      label: '가동 가능 장비 수',
      value: String(summary.availableMachineCount),
      unit: '대',
      icon: Power,
    },
    {
      label: '가동 불가능 장비 수',
      value: String(summary.downMachineCount),
      unit: '대',
      icon: CircleSlash2,
    },
    {
      label: '평균 가동률',
      value: String(Math.round(summary.avgUtilizationRate)),
      unit: '%',
      icon: Gauge,
    },
    {
      label: '총 대기 UNIT 수',
      value: String(summary.totalWaitingUnitCount),
      unit: '대',
      icon: Layers,
    },
    {
      label: '평균 대기 시간',
      value: String(Math.round(summary.avgWaitTimeMin)),
      unit: '분',
      icon: Clock,
    },
  ];
}

/**
 * monitoring 4개 응답을 DashboardPage가 쓰는 DistrictDashboardData로 조립한다.
 * - step 목록/순서: gantt(stepOrder) 기준
 * - 장비 정보(타입/가동률/상태): machines 엔드포인트 기준
 * - unit 막대: gantt schedules 중 active=true 만, (stepId, machineId)로 장비에 매핑
 * - step별 평균 대기시간: by-step queues 기준
 */
export function buildDistrictDashboard(
  summary: DistrictSummary,
  machines: DistrictMachines,
  gantt: DistrictGantt,
  stepQueues: DistrictStepQueue
): DistrictDashboardData {
  const waitByStep = new Map(stepQueues.steps.map((s) => [s.stepId, s.avgWaitTimeMin]));

  const orderedSteps = [...gantt.steps].sort((a, b) => a.stepOrder - b.stepOrder);

  const steps: ProcessStep[] = orderedSteps.map((step) => {
    const stepMachines = machines.machines.filter((m) => m.stepId === step.stepId);
    const activeBars = step.schedules.filter((bar) => bar.active);

    const districtMachines: DistrictMachine[] = stepMachines.map((machine) => {
      const units: ScheduledUnit[] = activeBars
        .filter((bar) => bar.machineId === machine.machineId)
        .map((bar, idx) => ({
          schedule_id: bar.scheduleId,
          unit_id: bar.unitId,
          priority: bar.priority,
          status: toUnitStatus(bar.unitStatus),
          start_time: toHour(bar.estimatedStart),
          end_time: toHour(bar.estimatedEnd),
          tone: TONES[idx % TONES.length],
        }));

      return {
        machine_id: machine.machineId,
        machine_type: machine.machineType,
        machine_status: toMachineStatus(machine.machineStatus),
        avg_utilization_rate: machine.utilizationRate,
        units,
      };
    });

    return {
      step_id: step.stepId,
      process_step: step.processStep,
      avg_wait_time_min: waitByStep.get(step.stepId) ?? 0,
      machines: districtMachines,
    };
  });

  return {
    summaryCards: buildSummaryCards(summary),
    steps,
  };
}
