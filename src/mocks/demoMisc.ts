// ─────────────────────────────────────────────────────────────────────────────
// 데모용 보조 더미 데이터: 예측 상태 / 생산 현황 / 구역 모니터링(대시보드) / 주문 / 챗봇.
// 재조정 흐름이 주 시연 대상이며, 여기 데이터는 화면이 비지 않게 채우는 용도.
// 전체 구역 overview 는 빈 배열을 반환해 OverviewDashboard 의 기존 mock 폴백을 그대로 쓴다.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  DistrictGantt,
  DistrictMachines,
  DistrictStepQueue,
  DistrictSummary,
  GanttBar,
  MachineDetail,
  OrderListDto,
  OrderListItemDto,
  PredictionStatus,
  ProductionStatus,
  StepGantt,
  StepQueue,
  WaitingUnit,
  WorkStatusItem,
} from '@/apis/types';

const SIM_DATE = '2025-05-12';
const iso = (h: number, m = 0) =>
  `${SIM_DATE}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

// 구역 라벨(데모): DST-01=A, DST-02=B
const districtName = (id: string) => (id === 'DST-02' ? '구역 B' : '구역 A');

// ── 예측 시스템 상태 (대시보드 위젯) ─────────────────────────────────────────
export function buildPredictionStatus(latestDetectionIso: string | null): PredictionStatus {
  return {
    status: 'SUCCESS',
    message: null,
    insertedCount: latestDetectionIso ? 2 : 0,
    lastAttemptAt: latestDetectionIso,
    latestRiskDetectionTime: latestDetectionIso,
  };
}

// ── 생산 완료 현황 (생산 완료 알림) ──────────────────────────────────────────
export function buildProductionStatus(completedTodayQty: number): ProductionStatus {
  return {
    completedTodayQty,
    latestCompletionAt: iso(13, 30),
    planDate: SIM_DATE,
    simulatedAt: iso(13, 30),
  };
}

// ── 구역 모니터링 5종 (대시보드) ─────────────────────────────────────────────
const STEPS: { stepId: string; processStep: string; order: number }[] = [
  { stepId: 'STEP-PHOTO-A1', processStep: 'STEP_PHOTO', order: 1 },
  { stepId: 'STEP-ETCH-B1', processStep: 'STEP_ETCH', order: 2 },
  { stepId: 'STEP-PKG-C1', processStep: 'STEP_PKG', order: 3 },
];

const MACHINE_PREFIX: Record<string, string> = { STEP_PHOTO: 'PA', STEP_ETCH: 'EB', STEP_PKG: 'PC' };

// 하루 작업 시간대 08:00 ~ 20:00 — 90분 슬롯 8개로 채운다(머신당 8 unit).
const DAY_START_H = 8;
const SLOT_H = 1.5;
const SLOT_COUNT = 8;
const hToIso = (x: number) => iso(Math.floor(x), Math.round((x % 1) * 60));

export function buildDistrictSummary(districtId: string): DistrictSummary {
  return {
    districtId,
    districtName: districtName(districtId),
    totalMachineCount: 9,
    availableMachineCount: 8,
    downMachineCount: 1,
    avgUtilizationRate: 62,
    totalWaitingUnitCount: 14,
    avgWaitTimeMin: 88,
    dailyOutputQty: 132,
    dailyTargetOutputQty: 180,
    achievementRate: 73,
    simulatedAt: iso(13, 30),
  };
}

/**
 * 구역 장비 현황.
 * downSlot(0~2)으로 STEP-PHOTO 머신 중 한 대를 '정지(고장)'로 표시한다.
 * 어댑터가 시간에 따라 downSlot 을 회전시켜, 대시보드에서 고장 장비가 바뀌는 것처럼 보인다.
 */
export function buildDistrictMachines(districtId: string, downSlot = 0): DistrictMachines {
  const machines: MachineDetail[] = [];
  STEPS.forEach((s) => {
    const prefix = MACHINE_PREFIX[s.processStep];
    for (let i = 1; i <= 3; i++) {
      const down = s.processStep === 'STEP_PHOTO' && i - 1 === downSlot;
      const util = s.processStep === 'STEP_PHOTO' ? [90, 55, 30][i - 1] : 50 + i * 7;
      machines.push({
        machineId: `MACHINE-${prefix}-0${i}`,
        machineType: `TYPE_${prefix}`,
        machineStatus: down ? '정지' : '가동',
        stepId: s.stepId,
        processStep: s.processStep,
        utilizationRate: down ? 0 : util,
        loadRate: down ? 0 : Math.min(99, util + 6),
        activeSchedule: down
          ? null
          : {
              scheduleId: `SCH-${prefix}-0${i}`,
              unitId: `UNIT-0${i}`,
              startTime: iso(12, 0),
              estimatedEnd: iso(13, 30),
              priority: i,
            },
      });
    }
  });
  return { districtId, districtName: districtName(districtId), machines };
}

export function buildDistrictGantt(districtId: string): DistrictGantt {
  // 하루(08:00~20:00) 전 구간을 채운다. 머신 3대 × 슬롯 8개 = 24 unit/step.
  const steps: StepGantt[] = STEPS.map((s) => {
    const prefix = MACHINE_PREFIX[s.processStep];
    const schedules: GanttBar[] = [];
    for (let mi = 1; mi <= 3; mi++) {
      for (let w = 0; w < SLOT_COUNT; w++) {
        const sh = DAY_START_H + w * SLOT_H;
        const eh = sh + SLOT_H;
        const unitN = w * 3 + mi; // UNIT-01 ~ UNIT-24
        schedules.push({
          scheduleId: `SCH-${prefix}-${mi}-${w}`,
          machineId: `MACHINE-${prefix}-0${mi}`,
          machineStatus: '가동',
          unitId: `UNIT-${String(unitN).padStart(2, '0')}`,
          unitStatus: '대기',
          priority: ((unitN - 1) % 5) + 1,
          status: 'WAITING',
          active: false,
          estimatedStart: hToIso(sh),
          estimatedEnd: hToIso(eh),
        });
      }
    }
    return { stepId: s.stepId, processStep: s.processStep, stepOrder: s.order, stepAvgTime: 90, schedules };
  });
  return { districtId, districtName: districtName(districtId), steps };
}

export function buildDistrictStepQueues(districtId: string): DistrictStepQueue {
  const steps: StepQueue[] = STEPS.map((s, idx) => {
    const count = [9, 3, 2][idx];
    const waitingUnits: WaitingUnit[] = Array.from({ length: count }, (_, i) => ({
      queueId: `Q-${s.processStep}-${i + 1}`,
      unitId: `UNIT-${String(i + 1).padStart(2, '0')}`,
      orderId: `ORD-${1000 + idx}`,
      unitStatus: '대기',
      queuePosition: i + 1,
      enqueueTime: iso(9, 0),
      actualWaitTime: 30 + i * 12,
      status: 'WAITING',
    }));
    return {
      stepId: s.stepId,
      processStep: s.processStep,
      stepOrder: s.order,
      waitingUnitCount: count,
      avgWaitTimeMin: [138, 52, 40][idx],
      waitingUnits,
    };
  });
  return { districtId, districtName: districtName(districtId), steps };
}

export function buildDistrictWorkStatus(districtId: string, simHour = 9): WorkStatusItem[] {
  const items: WorkStatusItem[] = [];
  // 간트 막대(SCH-prefix-mi-w)와 scheduleId·unitId 를 맞추고, 시뮬 현재시각 기준으로
  // 끝난 슬롯=완료, 진행중 슬롯=진행중, 미래 슬롯=미착수(현재 상태 미표시)로 둔다.
  STEPS.forEach((s) => {
    const prefix = MACHINE_PREFIX[s.processStep];
    for (let mi = 1; mi <= 3; mi++) {
      for (let w = 0; w < SLOT_COUNT; w++) {
        const sh = DAY_START_H + w * SLOT_H;
        const eh = sh + SLOT_H;
        if (sh > simHour) continue; // 아직 시작 안 함
        const done = eh <= simHour;
        const unitN = w * 3 + mi;
        items.push({
          statusId: `WS-${prefix}-${mi}-${w}`,
          scheduleId: `SCH-${prefix}-${mi}-${w}`,
          machineId: `MACHINE-${prefix}-0${mi}`,
          machineStatus: '가동',
          districtId,
          unitId: `UNIT-${String(unitN).padStart(2, '0')}`,
          startTime: hToIso(sh),
          endTime: done ? hToIso(eh) : null, // 진행중이면 종료 미정
          defectCount: 0,
          outputQty: done ? 10 : null,
        });
      }
    }
  });
  return items;
}

// ── 주문 (주문 페이지) ───────────────────────────────────────────────────────
function order(
  orderId: string,
  districtId: string,
  dueH: number,
  priority: number,
  total: number,
  done: number,
  imminent: boolean
): OrderListItemDto {
  return {
    orderId,
    districtId,
    districtName: districtName(districtId),
    planDate: SIM_DATE,
    dueDate: iso(dueH, 0),
    plannedOutputQty: total * 10,
    priority,
    priorityLabel: priority >= 3 ? '높음' : priority === 2 ? '보통' : '낮음',
    status: done >= total ? '완료' : done > 0 ? '진행' : '대기',
    totalUnits: total,
    completedUnits: done,
    progressRatio: Math.round((done / total) * 100) / 100,
    dueImminent: imminent,
    urgent: imminent && priority >= 3,
  };
}

export function buildOrders(): OrderListDto {
  const orders = [
    order('ORD-2041', 'DST-01', 13, 3, 9, 6, true),
    order('ORD-2042', 'DST-01', 18, 2, 6, 2, false),
    order('ORD-2043', 'DST-01', 21, 1, 4, 4, false),
    order('ORD-3120', 'DST-02', 13, 3, 8, 3, true),
    order('ORD-3121', 'DST-02', 20, 2, 5, 1, false),
  ];
  return {
    totalCount: orders.length,
    imminentCount: orders.filter((o) => o.dueImminent).length,
    orders,
  };
}

// ── 챗봇 (재조정 FAQ) ────────────────────────────────────────────────────────
export function buildChatAnswer(message: string): { sessionId: string; answer: string; toolCalls: string[] } {
  const q = message.toLowerCase();
  let answer: string;
  if (q.includes('추천') || q.includes('어떤') || q.includes('전략')) {
    answer =
      '현재 상황(납기 임박·큐 적체)에서는 "유닛 납기 우선 전략"을 권장합니다. 위험 유닛 2건(UNIT-08·09)을 모두 완화하고 납기 초과를 0건으로 줄이기 때문입니다. 다만 한 장비에 부하가 몰리는 점은 감안이 필요합니다.';
  } else if (q.includes('부하') || q.includes('균형') || q.includes('쏠림')) {
    answer =
      '부하 쏠림이 우려되면 "장비 부하 균형 전략"이 적합합니다. 부하율 편차를 약 38%p에서 0%p 수준으로 줄이지만, 평균 대기가 138→156분으로 증가하는 트레이드오프가 있습니다.';
  } else if (q.includes('대기') || q.includes('하류') || q.includes('라인')) {
    answer =
      '"라인 회복 우선 전략"은 하류 공정(STEP-PHOTO-A2) 적체를 막아 평균 대기를 138→95분으로 가장 크게 줄입니다. 대신 이 step의 일부 완료 시점이 늦어집니다.';
  } else {
    answer =
      '이번 위험은 STEP-PHOTO-A1의 큐 적체(깊이 9 / 머신 3대)와 납기 임박이 겹친 상황입니다. 세 가지 재조정안(납기 우선 / 부하 균형 / 라인 회복)을 비교해 상황에 맞는 전략을 선택하시면 됩니다.';
  }
  return { sessionId: 'demo-session', answer, toolCalls: ['get_step_queue', 'analyze_step_cascade'] };
}
