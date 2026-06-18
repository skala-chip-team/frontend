// ─────────────────────────────────────────────────────────────────────────────
// 데모용 Supervisor 최종 output 더미 데이터 (group_id 버전).
//
// "이상적" 시나리오 (영상 촬영용):
//   1) 위험 유닛(UNIT-08·09)이 큐 뒤쪽(9개 중 8·9번)에 정체
//   2) 큐 9 units / 3 machines (머신의 3배 적체)
//   3) 장비 부하 쏠림 — MACHINE-PA-01 과부하(6 units) vs PA-02 한산(1 unit)
//   4) 다음 step(STEP-PHOTO-A2)이 느려 하류 적체
//   5) 위험 유닛이 그대로 가면 납기(오늘 13:00·13:30) 초과
//
//   세 전략이 서로 다른 트레이드오프로 갈린다:
//   - due_date_first      : 위험 최대 완화(앞당김 큼) ↔ 부하 쏠림 유지 + 비위험 4건 지연
//   - utilization_balance : 위험 구제 + 부하 균형(62%p→0%p) ↔ 평균 대기 증가
//   - line_recovery_first : 위험 구제 + 하류 보호(평균 대기 최대 감소) ↔ 이 step 완료 일부 지연
//
// API 응답 스키마(src/apis/types.ts)에 맞춰 구성. 화면은 rescheduleAdapter 가 변환해 렌더링하며,
// 부하 편차/구제폭/큐 순서 등 시각화 값은 before·afterSchedule 에서 도출된다.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  AfterSchedule,
  AfterScheduleUnit,
  DelayRisk,
  QueueReorderItem,
  RescheduleGroupDetail,
  RescheduleGroupSummary,
  RescheduleOption,
  RiskAnalysis,
} from '@/apis/types';

export const DEMO_GROUP_ID = 'GRP-DEMO-IDEAL-0001';
export const DEMO_DISTRICT_ID = 'DST-01'; // 구역 A
export const DEMO_STEP_ID = 'STEP-PHOTO-A1';
export const DEMO_PROCESS_STEP = 'STEP_PHOTO';

// ── 스케줄 빌더 ──────────────────────────────────────────────────────────────
// 머신별로 순서대로 배치된 unit 들을 90분 슬롯(09:00 시작)에 채워 AfterSchedule 로 만든다.
type Assign = Record<string, string[]>; // machine_id -> 순서대로 처리되는 unit_id[]

const SCHED_DATE = '2025-05-12';
const SLOT_MIN = 90;
const START_MIN = 9 * 60; // 09:00

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (totalMin: number) => `${SCHED_DATE}T${pad(Math.floor(totalMin / 60))}:${pad(totalMin % 60)}:00`;

function slotIso(idx: number): { start: string; finish: string } {
  const start = START_MIN + idx * SLOT_MIN;
  return { start: fmt(start), finish: fmt(start + SLOT_MIN) };
}

function buildSchedule(assign: Assign): AfterSchedule {
  const units: AfterScheduleUnit[] = [];
  for (const [machineId, list] of Object.entries(assign)) {
    list.forEach((unitId, i) => {
      const { start, finish } = slotIso(i);
      units.push({ unit_id: unitId, steps: [{ step_id: DEMO_STEP_ID, start, finish, machine_id: machineId }] });
    });
  }
  units.sort((a, b) => a.unit_id.localeCompare(b.unit_id));
  return { units };
}

/** 스케줄을 착수 시각(동률이면 머신) 순으로 큐 위치(1-base)로 환산 */
function queuePositions(sched: AfterSchedule): Map<string, number> {
  const flat = sched.units.map((u) => ({
    id: u.unit_id,
    start: new Date(`${u.steps[0].start}Z`).getTime(),
    machine: u.steps[0].machine_id,
  }));
  flat.sort((a, b) => a.start - b.start || a.machine.localeCompare(b.machine));
  const map = new Map<string, number>();
  flat.forEach((x, i) => map.set(x.id, i + 1));
  return map;
}

/** before→after 큐 순서 변경 항목만 추출 (위치가 바뀐 unit) */
function buildReorder(before: AfterSchedule, after: AfterSchedule): QueueReorderItem[] {
  const bp = queuePositions(before);
  const ap = queuePositions(after);
  const items: QueueReorderItem[] = [];
  for (const [id, op] of bp) {
    const np = ap.get(id) ?? op;
    if (np !== op) {
      items.push({
        unit_id: id,
        queue_id: `Q-${id.replace('UNIT-', '')}`,
        original_queue_position: op,
        new_queue_position: np,
        priority_score: Math.max(0, 100 - np * 10),
      });
    }
  }
  items.sort((a, b) => a.new_queue_position - b.new_queue_position);
  return items;
}

// ── 스케줄 정의 ──────────────────────────────────────────────────────────────
// before: PA-01 과부하(6 units) — 위험 유닛(08·09)이 그 큐 뒤쪽(slot4·5, 15:00~18:00)에 정체.
//         PA-02 는 1 unit 만(한산), PA-03 는 2 units. → 부하 쏠림(75% / 13% / 25%) + 큐 뒤쪽 위험.
const BEFORE: AfterSchedule = buildSchedule({
  'MACHINE-PA-01': ['UNIT-01', 'UNIT-03', 'UNIT-05', 'UNIT-07', 'UNIT-08', 'UNIT-09'],
  'MACHINE-PA-02': ['UNIT-02'],
  'MACHINE-PA-03': ['UNIT-04', 'UNIT-06'],
});

// due_date_first: 위험 유닛을 PA-01 맨 앞으로(앞당김 큼) ↔ 부하 쏠림 그대로 + 비위험 4건 지연
const AFTER_DUE = buildSchedule({
  'MACHINE-PA-01': ['UNIT-08', 'UNIT-09', 'UNIT-01', 'UNIT-03', 'UNIT-05', 'UNIT-07'],
  'MACHINE-PA-02': ['UNIT-02'],
  'MACHINE-PA-03': ['UNIT-04', 'UNIT-06'],
});

// utilization_balance: 위험 구제 + 3/3/3 균등 분산(편차 62%p→0%p) ↔ 평균 대기 증가
const AFTER_UTIL = buildSchedule({
  'MACHINE-PA-01': ['UNIT-08', 'UNIT-05', 'UNIT-07'],
  'MACHINE-PA-02': ['UNIT-09', 'UNIT-02', 'UNIT-03'],
  'MACHINE-PA-03': ['UNIT-04', 'UNIT-06', 'UNIT-01'],
});

// line_recovery_first: 위험 구제 + 하류 보호(페이싱) ↔ 이 step 완료 일부 지연. 부하는 중간(50/25/38)
const AFTER_LINE = buildSchedule({
  'MACHINE-PA-01': ['UNIT-08', 'UNIT-09', 'UNIT-01', 'UNIT-06'],
  'MACHINE-PA-02': ['UNIT-02', 'UNIT-03'],
  'MACHINE-PA-03': ['UNIT-04', 'UNIT-05', 'UNIT-07'],
});

// ── 위험 / 원인분석 ──────────────────────────────────────────────────────────
const DELAY_RISKS: DelayRisk[] = [
  {
    riskId: 'RISK-DEMO-09',
    unitId: 'UNIT-09',
    riskLevel: 'Critical',
    riskFactor: 'due_date',
    riskScore: 0.91,
    delayProbability: 0.88,
    estimatedDelayHr: 4.5,
    detectionTime: `${SCHED_DATE}T11:30:00`,
  },
  {
    riskId: 'RISK-DEMO-08',
    unitId: 'UNIT-08',
    riskLevel: 'High',
    riskFactor: 'bottleneck',
    riskScore: 0.82,
    delayProbability: 0.78,
    estimatedDelayHr: 3.5,
    detectionTime: `${SCHED_DATE}T11:30:00`,
  },
];

const RISK_ANALYSIS: RiskAnalysis = {
  root_cause: {
    category: 'Queue_Bottleneck',
    evidence: [
      {
        signal: 'queue_depth_now',
        value: 9,
        interpretation:
          '현재 STEP-PHOTO-A1 큐 깊이가 9로, 가용 머신(3대)의 3배 수준. 강한 적체 신호로 추정됩니다.',
      },
      {
        signal: 'queue_trend',
        value: 'rising',
        interpretation: '큐 깊이가 3시간 전 대비 증가 추세로, 적체가 심화될 가능성이 있습니다.',
      },
      {
        signal: 'avg_wait_min_recent_3h',
        value: 138,
        interpretation: '최근 3시간 평균 대기 138분으로, 같은 step 24h 평균(40분) 대비 3.5배 수준입니다.',
      },
      {
        signal: 'machine_load_imbalance',
        value: 0.6,
        interpretation:
          '머신 부하율 편차가 큼. MACHINE-PA-01이 0.90, PA-02가 0.30으로 한쪽에 쏠려 있습니다.',
      },
      {
        signal: 'tight_due_units_in_queue',
        value: 2,
        interpretation:
          '큐 뒤쪽 2개 유닛(UNIT-08·09)의 납기가 오늘로 임박. 현재 큐 순서로는 납기 초과가 예상됩니다.',
      },
    ],
  },
  causal_chain:
    'Queue_Bottleneck → 과부하된 MACHINE-PA-01 큐 뒤쪽에서 위험 유닛(UNIT-08·09)이 장시간 대기 → ' +
    '납기 임박 유닛의 납기 초과 가능성 ↑. 하류 STEP-PHOTO-A2가 느려 적체가 더 누적될 신호. ' +
    '(보조 원인: 장비 부하 쏠림, 납기 임박)',
  signal_agreement: 'strong',
  analysis_status: 'success',
};

// ── 전략 옵션 빌더 ───────────────────────────────────────────────────────────
const md = (before: number, after: number) => ({ before, after, delta: Math.round((after - before) * 100) / 100 });

function dueOption(): RescheduleOption {
  return {
    strategy: 'due_date_first',
    analysisStatus: 'success',
    fallbackReason: null,
    recommended: true,
    recommendation: 'recommend',
    manualReviewRequired: false,
    summary:
      '납기 임박 위험 유닛(UNIT-08·09)을 큐 맨 앞으로 끌어올려 위험 2건을 모두 완화하고 납기 초과를 0건으로 줄입니다. 대신 MACHINE-PA-01 쏠림이 유지되고 비위험 유닛 4건의 완료가 늦어집니다.',
    selected: false,
    estimatedDelayHrAfter: 1.5,
    avgWaitTimeMinAfter: 74,
    avgUtilizationRateAfter: 0.74,
    maxWaitTimeMinAfter: 150,
    deadlineViolationCount: 0,
    afterSchedule: AFTER_DUE,
    queueReorder: buildReorder(BEFORE, AFTER_DUE),
    metricsComparison: {
      completedUnits: md(7, 7),
      cumulativeDelayHr: md(6.0, 1.5),
      avgQueueWaitMin: md(66, 74),
      deadlineViolationCount: md(2, 0),
      overallLoad: md(0.62, 0.74),
    },
    recommendationReasoning:
      '위험 유닛을 가장 강하게 완화(납기 위험 2건 구제, 누적 지연 4.5시간 단축)하고 납기 초과를 0건으로 만들기 때문에, 납기가 최우선인 현재 상황에서 권장합니다.',
    keyImprovements: [
      { description: '납기 임박 위험 유닛 2건(UNIT-08·09) 모두 완화', magnitude: '위험 2건 → 0건' },
      { description: '누적 지연 시간 단축', magnitude: '6시간 → 1.5시간 (4.5시간↓)' },
      { description: '납기 초과 제거', magnitude: '2건 → 0건' },
    ],
    keyConcerns: [
      {
        description: 'MACHINE-PA-01 쏠림이 그대로 유지됨',
        magnitude: '부하율 편차 약 62%p (균형 미개선)',
        mitigation: '쏠림이 부담되면 부하 균형 전략과 비교 검토',
      },
      {
        description: '비위험 유닛 4건(UNIT-01·03·05·07)의 완료가 뒤로 밀림',
        magnitude: '각 약 3시간 지연',
        mitigation: '밀리는 비위험 유닛의 납기 여유를 함께 확인',
      },
    ],
    detailedReport: {
      executiveSummary:
        '납기 임박 위험 유닛을 큐 최우선으로 배치해 위험 2건을 모두 구제하고 납기 초과를 0건으로 만드는 안입니다.',
      riskBackground:
        '과부하된 MACHINE-PA-01 큐 뒤쪽에 위험 유닛이 정체돼(큐 깊이 9 / 머신 3대) 현재 순서로는 납기 초과가 예상됩니다.',
      metricAnalysis:
        '누적 지연 6→1.5시간, 납기 초과 2→0건으로 크게 개선됩니다. 다만 평균 대기는 66→74분으로 소폭 증가합니다.',
      tradeoffs:
        '위험 완화 효과는 가장 크지만, MACHINE-PA-01 쏠림이 유지되고 비위험 유닛 4건이 지연되는 비용이 따릅니다.',
      decisionBasis: '오늘 마감(13:00·13:30) 납기 보호가 최우선이므로 이 안을 권장합니다.',
    },
    deadlineImpact: { rescuedCount: 2, stillAtRiskCount: 0, newlyAtRiskCount: 4, newlyViolatedCount: 0 },
  };
}

function utilOption(): RescheduleOption {
  return {
    strategy: 'utilization_balance',
    analysisStatus: 'success',
    fallbackReason: null,
    recommended: false,
    recommendation: 'not_recommend',
    manualReviewRequired: false,
    summary:
      '위험 유닛 2건을 구제하면서 작업을 3대 장비에 고르게 분산해 부하 편차를 62%p에서 0%p로 없앱니다. 대신 큐 균형을 맞추는 과정에서 평균 대기 시간이 늘어납니다.',
    selected: false,
    estimatedDelayHrAfter: 3.0,
    avgWaitTimeMinAfter: 78,
    avgUtilizationRateAfter: 0.55,
    maxWaitTimeMinAfter: 132,
    deadlineViolationCount: 0,
    afterSchedule: AFTER_UTIL,
    queueReorder: buildReorder(BEFORE, AFTER_UTIL),
    metricsComparison: {
      completedUnits: md(7, 7),
      cumulativeDelayHr: md(6.0, 3.0),
      avgQueueWaitMin: md(66, 78),
      deadlineViolationCount: md(2, 0),
      overallLoad: md(0.62, 0.55),
    },
    recommendationReasoning:
      '장비 부하를 가장 고르게 만들지만(편차 62%p→0%p) 평균 대기가 증가해, 납기가 급한 현재 상황에서는 차선책입니다.',
    keyImprovements: [
      { description: '위험 유닛 2건 완화', magnitude: '위험 2건 → 0건' },
      { description: '장비 부하 균형 — PA-01 쏠림 해소', magnitude: '편차 62%p → 0%p' },
    ],
    keyConcerns: [
      {
        description: '큐 재배치로 평균 대기 시간이 증가',
        magnitude: '66분 → 78분 (12분↑)',
        mitigation: '대기 증가가 부담되면 라인 회복 전략과 비교',
      },
      {
        description: '비위험 유닛 3건의 완료가 다소 늦어짐',
        magnitude: '각 1.5~3시간 지연',
        mitigation: '밀리는 유닛의 납기 여유 확인',
      },
    ],
    detailedReport: {
      executiveSummary:
        '위험을 구제하면서 장비 부하를 균등 분산해 MACHINE-PA-01 쏠림을 없애는 안입니다.',
      riskBackground:
        'MACHINE-PA-01에 부하가 쏠려(약 0.90 vs PA-02 0.30) 장비 간 불균형이 큰 상태입니다.',
      metricAnalysis: '부하율 편차가 62%p에서 0%p로 줄지만, 평균 대기는 66→78분으로 증가합니다.',
      tradeoffs: '부하 균형은 최고지만 평균 대기 증가가 비용입니다.',
      decisionBasis: '장비 보호·균형이 우선일 때 적합합니다.',
    },
    deadlineImpact: { rescuedCount: 2, stillAtRiskCount: 0, newlyAtRiskCount: 3, newlyViolatedCount: 0 },
  };
}

function lineOption(): RescheduleOption {
  return {
    strategy: 'line_recovery_first',
    analysisStatus: 'success',
    fallbackReason: null,
    recommended: false,
    recommendation: 'not_recommend',
    manualReviewRequired: false,
    summary:
      '하류 공정(STEP-PHOTO-A2) 적체를 막도록 페이싱하며 위험 2건을 구제합니다. 평균 대기를 가장 크게 줄이지만(66→38분), 이 step의 일부 완료 시점이 늦어집니다.',
    selected: false,
    estimatedDelayHrAfter: 3.5,
    avgWaitTimeMinAfter: 38,
    avgUtilizationRateAfter: 0.6,
    maxWaitTimeMinAfter: 96,
    deadlineViolationCount: 0,
    afterSchedule: AFTER_LINE,
    queueReorder: buildReorder(BEFORE, AFTER_LINE),
    metricsComparison: {
      completedUnits: md(7, 8),
      cumulativeDelayHr: md(6.0, 3.5),
      avgQueueWaitMin: md(66, 38),
      deadlineViolationCount: md(2, 0),
      overallLoad: md(0.62, 0.6),
    },
    recommendationReasoning:
      '하류 적체를 막아 평균 대기를 가장 크게 줄이지만(66→38분) 이 step 완료가 일부 늦어져, 납기 최우선 상황에서는 차선책입니다.',
    keyImprovements: [
      { description: '위험 유닛 2건 완화', magnitude: '위험 2건 → 0건' },
      { description: '평균 대기 시간 대폭 감소', magnitude: '66분 → 38분 (28분↓)' },
      { description: '하류 보호로 전체 완료 유닛 증가', magnitude: '7개 → 8개' },
    ],
    keyConcerns: [
      {
        description: '페이싱으로 이 step의 일부 완료 시점이 늦어짐',
        magnitude: '누적 지연 6→3.5시간 (납기 우선 대비 완만)',
        mitigation: '이 step 마감이 급하면 납기 우선 전략과 비교',
      },
    ],
    detailedReport: {
      executiveSummary:
        '하류 공정 적체를 막도록 페이싱하며 위험을 구제해, 평균 대기를 가장 크게 줄이는 안입니다.',
      riskBackground:
        '다음 step(STEP-PHOTO-A2)이 느려 하류 적체가 누적될 신호가 관찰됩니다.',
      metricAnalysis: '평균 대기 66→38분으로 가장 큰 개선. 다만 이 step 누적 지연 감소폭은 가장 작습니다.',
      tradeoffs: '하류 흐름 보호는 최고지만 이 step 완료가 일부 늦어집니다.',
      decisionBasis: '라인 전체 흐름 회복이 우선일 때 적합합니다.',
    },
    deadlineImpact: { rescuedCount: 2, stillAtRiskCount: 0, newlyAtRiskCount: 2, newlyViolatedCount: 0 },
  };
}

/** 전략 3종 (생성 완료 시 노출). selectedStrategy 가 있으면 해당 옵션에 selected=true */
function buildOptions(selectedStrategy: string | null): RescheduleOption[] {
  const opts = [dueOption(), utilOption(), lineOption()];
  if (selectedStrategy) {
    for (const o of opts) o.selected = o.strategy === selectedStrategy;
  }
  return opts;
}

// ── 외부 노출 빌더 ───────────────────────────────────────────────────────────

/** 위험 탐지 결과(목록/폴링용) summary. createdAtIso 는 어댑터가 현재 시각으로 채운다. */
export function buildGroupSummary(createdAtIso: string): RescheduleGroupSummary {
  return {
    groupId: DEMO_GROUP_ID,
    districtId: DEMO_DISTRICT_ID,
    stepId: DEMO_STEP_ID,
    processStep: DEMO_PROCESS_STEP,
    maxRiskScore: 0.91,
    riskLevel: 'Critical',
    groupStatus: 'pending',
    createdAt: createdAtIso,
    affectedUnits: [
      { unitId: 'UNIT-09', estimatedDelayHr: 4.5 },
      { unitId: 'UNIT-08', estimatedDelayHr: 3.5 },
    ],
    riskFactor: 'bottleneck',
  };
}

/**
 * 재조정 그룹 상세.
 * - generated=false: 옵션이 비어 있음(= 백엔드 자동 생성 중). 상세 폴링이 생성 완료를 감지하게 함.
 * - generated=true: 전략 3종 노출.
 * - selectedStrategy: 승인된 전략(없으면 pending).
 */
export function buildGroupDetail(opts: {
  generated: boolean;
  selectedStrategy: string | null;
  actedAtIso: string;
}): RescheduleGroupDetail {
  const { generated, selectedStrategy, actedAtIso } = opts;
  return {
    groupId: DEMO_GROUP_ID,
    districtId: DEMO_DISTRICT_ID,
    stepId: DEMO_STEP_ID,
    processStep: DEMO_PROCESS_STEP,
    stepOrder: 1,
    maxDelayProbability: 0.88,
    groupStatus: selectedStrategy ? 'approved' : 'pending',
    actedAt: actedAtIso,
    simulatedAt: `${SCHED_DATE}T11:30:00`,
    delayRisks: DELAY_RISKS,
    riskAnalysis: RISK_ANALYSIS,
    beforeSchedule: BEFORE,
    options: generated ? buildOptions(selectedStrategy) : [],
  };
}
