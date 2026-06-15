import { CircleSlash2, Clock, Gauge, Layers, Power } from 'lucide-react';

import type {
  DistrictGantt,
  DistrictMachines,
  DistrictStepQueue,
  DistrictSummary,
  GanttBar,
  WorkStatusItem,
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

/** ISO datetime → 정렬 가능한 로컬 날짜 키 'YYYY-MM-DD'. 파싱 실패 시 null. */
function dateKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 간트 막대 + 실제(actual) 시각을 입힌 표시용 막대 */
interface TimedBar {
  bar: GanttBar;
  start: string; // 실제 시작(없으면 estimatedStart)
  actualEnd: string | null; // 실제 종료. 진행중/미완료면 null (계획 소요시간으로 폭 계산)
}

/**
 * 진행 중(active) 막대가 하나도 없을 때의 폴백:
 * 가장 최근 하루치 스케줄만 추려 하루 간트로 보여준다. (실제 시작 시각 기준)
 */
function latestDayBars(bars: TimedBar[]): TimedBar[] {
  let latest: string | null = null;
  for (const b of bars) {
    const key = dateKey(b.start);
    if (key !== null && (latest === null || key > latest)) latest = key;
  }
  if (latest === null) return [];
  return bars.filter((b) => dateKey(b.start) === latest);
}

/**
 * 같은 장비의 막대 겹침 제거(in-place).
 * 시작 시각 순 정렬 후, 이전 막대 끝이 다음 막대 시작을 넘으면 시작 직전까지로 자른다.
 * (위치=실제 시각은 유지 → 현재선 정합성 보존, 폭만 살짝 줄여 겹침 방지)
 */
function clipOverlaps(units: ScheduledUnit[]): void {
  units.sort((a, b) => a.start_time - b.start_time);
  for (let i = 1; i < units.length; i += 1) {
    const prev = units[i - 1];
    const cur = units[i];
    if (cur.start_time < prev.end_time) {
      prev.end_time = Math.max(prev.start_time + 0.05, cur.start_time);
    }
  }
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
  stepQueues: DistrictStepQueue,
  workStatus: WorkStatusItem[],
  simDate?: string | null
): DistrictDashboardData {
  const waitByStep = new Map(stepQueues.steps.map((s) => [s.stepId, s.avgWaitTimeMin]));

  // 실제 대기 unit 목록(by-step 큐). 완료된 unit은 백엔드 큐에서 빠지지만 방어적으로 제외.
  const waitUnitsByStep = new Map(
    stepQueues.steps.map((s) => [
      s.stepId,
      [...s.waitingUnits]
        .filter((u) => u.unitStatus !== '완료')
        .sort((a, b) => a.queuePosition - b.queuePosition)
        .map((u) => u.unitId),
    ])
  );

  // scheduleId → 실제 작업 시각. duplicate면 종료시각이 있는(완료된) 행을 우선.
  const actualBySchedule = new Map<string, WorkStatusItem>();
  for (const ws of workStatus) {
    const prev = actualBySchedule.get(ws.scheduleId);
    if (!prev || (!prev.endTime && ws.endTime)) actualBySchedule.set(ws.scheduleId, ws);
  }

  // 간트 막대에 실제 시각을 입힌다. 시작은 실제값(없으면 계획), 종료는 실제값만(없으면 null).
  const withActual = (bar: GanttBar): TimedBar => {
    const ws = actualBySchedule.get(bar.scheduleId);
    return {
      bar,
      start: ws?.startTime ?? bar.estimatedStart,
      actualEnd: ws?.endTime ?? null,
    };
  };

  const orderedSteps = [...gantt.steps].sort((a, b) => a.stepOrder - b.stepOrder);

  const steps: ProcessStep[] = orderedSteps.map((step) => {
    const stepMachines = machines.machines.filter((m) => m.stepId === step.stepId);
    const timedBars = step.schedules.map(withActual);
    // 시뮬레이션 날짜가 있으면 그날 스케줄을, 없으면 active→최근일 폴백 (모두 실제 시작 시각 기준)
    let barsToShow: TimedBar[];
    if (simDate) {
      barsToShow = timedBars.filter((b) => dateKey(b.start) === simDate);
    } else {
      const activeBars = timedBars.filter((b) => b.bar.active);
      barsToShow = activeBars.length > 0 ? activeBars : latestDayBars(timedBars);
    }

    const districtMachines: DistrictMachine[] = stepMachines.map((machine) => {
      const units: ScheduledUnit[] = barsToShow
        .filter((b) => b.bar.machineId === machine.machineId)
        .map((b, idx) => {
          const startTime = toHour(b.start);
          let endTime: number;
          if (b.actualEnd) {
            // 완료: 실제 종료시각 사용
            endTime = toHour(b.actualEnd);
          } else {
            // 진행중/미완료: 실제 종료가 없으니 계획 소요시간(분)을 실제 시작에 더한다.
            // (계획 종료시각을 그대로 쓰면 시작과 시간대가 달라 막대가 거대해짐)
            const estDurHr =
              (new Date(b.bar.estimatedEnd).getTime() - new Date(b.bar.estimatedStart).getTime()) /
              3_600_000;
            endTime = startTime + (Number.isFinite(estDurHr) && estDurHr > 0 ? estDurHr : 1);
          }
          // 자정을 넘는 막대(end<=start)는 그날 끝(24시)까지로 표시, 24시 초과도 클램프
          if (endTime <= startTime || endTime > 24) endTime = 24;
          return {
            schedule_id: b.bar.scheduleId,
            unit_id: b.bar.unitId,
            priority: b.bar.priority,
            status: toUnitStatus(b.bar.unitStatus),
            start_time: startTime,
            end_time: endTime,
            tone: TONES[idx % TONES.length],
          };
        });

      // 실제 작업시간은 같은 장비에서도 인접 unit이 살짝 겹친다(기록상 다음 작업 시작 < 이전 작업 종료).
      // 시작 시각 순으로 정렬한 뒤, 이전 막대 끝을 다음 막대 시작까지로 잘라 겹침을 없앤다.
      clipOverlaps(units);

      return {
        machine_id: machine.machineId,
        machine_type: machine.machineType,
        machine_status: toMachineStatus(machine.machineStatus),
        avg_utilization_rate: machine.utilizationRate,
        load_rate: machine.loadRate,
        active_unit_id: machine.activeSchedule?.unitId ?? null,
        units,
      };
    });

    return {
      step_id: step.stepId,
      process_step: step.processStep,
      avg_wait_time_min: waitByStep.get(step.stepId) ?? 0,
      waiting_units: waitUnitsByStep.get(step.stepId) ?? [],
      machines: districtMachines,
    };
  });

  return {
    summaryCards: buildSummaryCards(summary),
    steps,
    daily_output_qty: summary.dailyOutputQty,
    daily_target_output_qty: summary.dailyTargetOutputQty,
  };
}
