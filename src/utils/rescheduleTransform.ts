import type {
  AfterSchedule,
  DelayRisk,
  QueueReorderItem,
  RescheduleGroupDetail,
  RescheduleOption,
  RiskAnalysis,
} from '@apis/index';
import { districtLabels, type DistrictId } from '@/stores';
import type {
  GroupStatus,
  QueueState,
  RescheduleDetailVM,
  RiskLevel,
  ScheduleMachineRow,
  ScheduleUnitBar,
  StrategyMetric,
  StrategyVM,
} from '@/types';

import { formatDelayHours } from './reschedule';

const STRATEGY_LABELS: Record<string, string> = {
  due_date_first: '납기 우선 전략',
  bottleneck_minimization: '병목 최소화 전략',
  utilization_balance: '가동률 균형 전략',
};

const RISK_RANK: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

/** 구역 ID(예: DST-01) → 라벨(구역 A). 매핑 없으면 ID 그대로 */
export function districtLabelOf(districtId: string): string {
  return districtLabels[districtId as DistrictId] ?? districtId;
}

/** riskLevel이 null일 때 점수(0~1)로 표시용 레벨을 추정 */
export function deriveRiskLevel(score: number | null | undefined): RiskLevel {
  const s = score ?? 0;
  if (s >= 0.8) return 'High';
  if (s >= 0.5) return 'Medium';
  return 'Low';
}

/** API riskLevel(null 가능) → 표시 레벨. null이면 점수로 추정 */
export function toRiskLevel(level: RiskLevel | null | undefined, score?: number | null): RiskLevel {
  return level ?? deriveRiskLevel(score);
}

/** ISO datetime → 시(소수). 파싱 실패 시 0 */
function toHour(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getHours() + d.getMinutes() / 60;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** delayRisks 중 가장 높은 위험 레벨 */
function maxRiskLevel(risks: DelayRisk[]): RiskLevel {
  let best: RiskLevel = 'Low';
  for (const r of risks) {
    if (RISK_RANK[r.riskLevel] > RISK_RANK[best]) best = r.riskLevel;
  }
  return best;
}

/** 위험 원인 라벨 정리. 'Unknown'/빈값은 표시하지 않음 */
function normalizeFactor(factor: string | null | undefined): string {
  if (!factor || factor === 'Unknown') return '';
  return factor;
}

/** 에이전트 원인분석 → 근거 문장 목록 (없으면 []) */
function buildReasons(ra: RiskAnalysis | null): string[] {
  if (!ra) return [];
  const out: string[] = [];
  for (const e of ra.root_cause?.evidence ?? []) {
    // evidence는 {value, signal, interpretation} 객체 → interpretation 문장을 쓴다
    out.push(e.interpretation || `${e.signal}: ${e.value ?? ''}`);
  }
  if (ra.causal_chain && ra.causal_chain !== '(분석 불가 — fallback)')
    out.push(`인과 흐름: ${ra.causal_chain}`);
  return out;
}

/** after 수치들 → 핵심 효과 카드(값만, before 없음 — "있는 것만") */
function buildMetrics(o: RescheduleOption): StrategyMetric[] {
  const m: StrategyMetric[] = [];
  if (o.avgUtilizationRateAfter != null)
    m.push({ label: '전체 가동률', value: `${Math.round(o.avgUtilizationRateAfter * 100)}%` });
  if (o.avgWaitTimeMinAfter != null)
    m.push({ label: '평균 대기시간', value: `${Math.round(o.avgWaitTimeMinAfter)}분` });
  if (o.estimatedDelayHrAfter != null)
    m.push({ label: '누적 지연시간', value: formatDelayHours(round1(o.estimatedDelayHrAfter)) });
  if (o.deadlineViolationCount != null)
    m.push({ label: '납기 위반', value: `${o.deadlineViolationCount}건` });
  if (o.maxWaitTimeMinAfter != null)
    m.push({ label: '최대 대기시간', value: `${Math.round(o.maxWaitTimeMinAfter)}분` });
  return m;
}

/** 전략 카드 대표 수치(after). 누적 지연 > 가동률 순 우선 */
function buildHeadline(o: RescheduleOption): StrategyVM['headline'] {
  if (o.estimatedDelayHrAfter != null)
    return { label: '예상 누적 지연', value: formatDelayHours(round1(o.estimatedDelayHrAfter)) };
  if (o.avgUtilizationRateAfter != null)
    return { label: '예상 가동률', value: `${Math.round(o.avgUtilizationRateAfter * 100)}%` };
  if (o.avgWaitTimeMinAfter != null)
    return { label: '예상 평균 대기', value: `${Math.round(o.avgWaitTimeMinAfter)}분` };
  return null;
}

/** queueReorder → 이전/이후 대기열(위치 순으로 재구성) */
function buildQueue(reorder: QueueReorderItem[], affectedIds: string[]): QueueState {
  const before = [...reorder]
    .sort((a, b) => a.original_queue_position - b.original_queue_position)
    .map((r) => r.unit_id);
  const after = [...reorder]
    .sort((a, b) => a.new_queue_position - b.new_queue_position)
    .map((r) => r.unit_id);
  return { before, after, affected: affectedIds };
}

/** afterSchedule → 장비별 행 + 간트 시간 범위 */
function buildSchedule(
  after: AfterSchedule | null,
  affectedIds: Set<string>
): { rows: ScheduleMachineRow[]; window: { start: number; end: number } } {
  const fallback = { rows: [] as ScheduleMachineRow[], window: { start: 8, end: 20 } };
  if (!after || after.units.length === 0) return fallback;

  const byMachine = new Map<string, ScheduleUnitBar[]>();
  let minH = 24;
  let maxH = 0;

  for (const u of after.units) {
    for (const s of u.steps) {
      const start = toHour(s.start);
      let end = toHour(s.finish);
      if (end <= start) end = 24; // 자정 넘김
      minH = Math.min(minH, start);
      maxH = Math.max(maxH, end);
      const arr = byMachine.get(s.machine_id) ?? [];
      arr.push({ unit_id: u.unit_id, start, end, affected: affectedIds.has(u.unit_id) });
      byMachine.set(s.machine_id, arr);
    }
  }

  if (byMachine.size === 0) return fallback;

  const rows: ScheduleMachineRow[] = [...byMachine.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([machine, units]) => ({ machine, units: units.sort((a, b) => a.start - b.start) }));

  const start = Math.floor(minH);
  let end = Math.min(24, Math.ceil(maxH));
  if (end - start < 2) end = Math.min(24, start + 2);
  return { rows, window: { start, end } };
}

function buildStrategy(o: RescheduleOption, affectedIds: string[]): StrategyVM {
  const affectedSet = new Set(affectedIds);
  const { rows, window } = buildSchedule(o.afterSchedule, affectedSet);
  const metrics = buildMetrics(o);
  return {
    key: o.strategy,
    name: STRATEGY_LABELS[o.strategy] ?? o.strategy,
    recommended: o.recommended,
    selected: o.selected,
    usable: o.analysisStatus === 'success' && (o.afterSchedule != null || metrics.length > 0),
    fallbackReason: o.fallbackReason,
    summary: o.summary,
    headline: buildHeadline(o),
    metrics,
    queue: buildQueue(o.queueReorder, affectedIds),
    schedule: rows,
    scheduleWindow: window,
  };
}

/** 상세 응답 → 화면 뷰모델 */
export function buildRescheduleDetail(detail: RescheduleGroupDetail): RescheduleDetailVM {
  const affectedIds = detail.delayRisks.map((r) => r.unitId);

  return {
    header: {
      group_id: detail.groupId,
      districtLabel: districtLabelOf(detail.districtId),
      process_step: detail.processStep,
      group_status: detail.groupStatus as GroupStatus,
      risk_level:
        detail.delayRisks.length > 0
          ? maxRiskLevel(detail.delayRisks)
          : deriveRiskLevel(detail.maxDelayProbability),
      risk_factor: normalizeFactor(
        detail.riskAnalysis?.root_cause?.category ?? detail.delayRisks[0]?.riskFactor
      ),
    },
    reasons: buildReasons(detail.riskAnalysis),
    affectedUnits: detail.delayRisks.map((r) => ({
      unit_id: r.unitId,
      risk_score: Math.round(r.riskScore * 100),
      delay_probability: r.delayProbability,
      estimated_delay_hr: r.estimatedDelayHr,
    })),
    strategies: detail.options.map((o) => buildStrategy(o, affectedIds)),
  };
}
