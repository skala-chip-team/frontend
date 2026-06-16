// API(camelCase) 응답을 화면이 쓰는 도메인 모델(RescheduleGroup / RescheduleStrategy)로 변환한다.
// 레이더 5축·unit별 전후 완료시각·장비별 가동률 등 API가 직접 주지 않는 시각화 값은
// metricsComparison / before·afterSchedule / queueReorder / deadlineImpact 에서 도출한다.
import type {
  AfterSchedule,
  ApiRiskLevel,
  DeadlineImpact,
  DetailedReport,
  KeyConcern,
  KeyImprovement,
  MetricsComparison,
  RescheduleGroupDetail,
  RescheduleGroupSummary,
  RescheduleOption,
} from '@apis/index';
import type { RescheduleCardData } from '@components/common';
import type {
  MachineUtilChange,
  RescheduleDistrict,
  RescheduleGroup,
  RescheduleStrategy,
  RiskLevel,
  StrategyBest,
  StrategyKey,
  UnitRiskChange,
} from '@/types';

// 화면이 쓰는 고정 3슬롯 키(색상·레이더 식별용). API 전략은 순서대로 슬롯에 배정한다.
const SLOT_KEYS: StrategyKey[] = ['due_date_first', 'utilization_bal', 'line_recovery'];

// 간트/가동률 산정 기준 시간 창 (대시보드 간트와 동일)
const WIN_START = 8;
const WIN_END = 20;
const WIN_HOURS = WIN_END - WIN_START;

/** API 전략 코드 → 표시 메타 */
const STRATEGY_META: Record<string, { title: string; whenLead: string; whenTail: string }> = {
  due_date_first: {
    title: '유닛 납기 우선 전략',
    whenLead: '납기가 임박한 유닛을 먼저 끝내는 것',
    whenTail: '이 중요할 때 적용하는 전략입니다',
  },
  bottleneck_minimization: {
    title: '병목 최소화 전략',
    whenLead: '병목 장비의 적체를 먼저 푸는 것',
    whenTail: '이 중요할 때 적용하는 전략입니다',
  },
  // AI 실제 반환값(계약의 bottleneck_minimization 자리). 의미가 다른 별개 전략으로 취급
  line_recovery_first: {
    title: '라인 회복 우선 전략',
    whenLead: '정지·지연된 라인을 빠르게 회복시키는 것',
    whenTail: '이 중요할 때 적용하는 전략입니다',
  },
  utilization_balance: {
    title: '장비 부하 균형 전략',
    whenLead: '장비에 부하가 몰리지 않게 고르게 분산하는 것',
    whenTail: '이 중요할 때 적용하는 전략입니다',
  },
};

// 위험 원인 코드(AI 피처/시그널명) → 한글 라벨. 키는 소문자.
// ※ 코드는 백엔드/AI가 생성하며 종류가 열려있음 → 근본적으론 백엔드가 한글 라벨을 주는 게 정답.
//   여기서는 현재 관측되는 코드 + 규칙적 패턴을 프론트에서 매핑(stopgap).
const RISK_FACTOR_KO: Record<string, string> = {
  order_priority: '주문 우선순위',
  due_date: '납기 위험',
  machine_capacity: '장비 용량 부족',
  bottleneck: '병목 심화',
  material: '자재 부족',
  material_shortage: '자재 부족',
  machine_fault: '장비 고장 위험',
  utilization: '가동률 저하',
  ds_waiting_units: '대기 유닛 과다',
  ds_utilization_rate: '장비 가동률 저하',
  ds_queue_wait: '대기시간 지연',
};

export function riskFactorLabel(factor: string | null | undefined): string {
  if (!factor) return '지연 위험';
  const key = factor.toLowerCase();
  if (RISK_FACTOR_KO[key]) return RISK_FACTOR_KO[key];

  // 원인은 '무엇'만 표기(스텝 접두사 제외) — 그룹의 공정(STEP-X)과 혼동 방지.
  // riskFactor의 step 접두사는 ML 피처(상류 시그널) 이름이라 그룹 공정과 다를 수 있음.
  if (/queue_wait/.test(key)) return '대기시간 지연';
  if (/util/.test(key)) return '가동률 저하';
  if (/capacity/.test(key)) return '장비 용량 부족';
  if (/waiting_units/.test(key)) return '대기 유닛 과다';
  if (/^step[a-z0-9]+_/.test(key)) return '공정 지연 위험';

  // 알 수 없는 코드는 영문 노출 대신 일반 라벨로
  return '지연 위험';
}

/** Critical/High/Medium/Low → 화면 RiskLevel. null이면 Low */
export function toRiskLevel(level: ApiRiskLevel | null | undefined): RiskLevel {
  if (level === 'Critical') return 'Critical';
  if (level === 'High') return 'High';
  if (level === 'Medium') return 'Medium';
  return 'Low';
}

function toGroupStatus(status: string): RescheduleGroup['group_status'] {
  if (status === 'approved') return 'approved';
  if (status === 'expired') return 'expired';
  return 'pending';
}

// ── 스케줄 유틸 ────────────────────────────────────────────────────────────

interface FlatStep {
  unitId: string;
  stepId: string;
  start: number; // 시(소수)
  finish: number;
  machineId: string;
}

function hourOf(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function labelOf(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function flatten(sched: AfterSchedule | null | undefined): FlatStep[] {
  if (!sched) return [];
  const out: FlatStep[] = [];
  for (const unit of sched.units) {
    for (const step of unit.steps) {
      out.push({
        unitId: unit.unit_id,
        stepId: step.step_id,
        start: hourOf(step.start),
        finish: hourOf(step.finish),
        machineId: step.machine_id,
      });
    }
  }
  return out;
}

/** unit별 마지막 step 완료 시각(시 소수). 없으면 null */
function unitFinishHour(sched: AfterSchedule | null | undefined, unitId: string): number | null {
  if (!sched) return null;
  const unit = sched.units.find((u) => u.unit_id === unitId);
  if (!unit || unit.steps.length === 0) return null;
  return Math.max(...unit.steps.map((s) => hourOf(s.finish)));
}

function unitFinishLabel(sched: AfterSchedule | null | undefined, unitId: string): string | null {
  if (!sched) return null;
  const unit = sched.units.find((u) => u.unit_id === unitId);
  if (!unit || unit.steps.length === 0) return null;
  let latest = unit.steps[0];
  for (const s of unit.steps) if (hourOf(s.finish) > hourOf(latest.finish)) latest = s;
  return labelOf(latest.finish);
}

/** 장비별 가동률(%) — 작업 점유 시간 / 시간 창 */
function machineLoads(sched: AfterSchedule | null | undefined): Map<string, number> {
  const busy = new Map<string, number>();
  for (const step of flatten(sched)) {
    const dur = Math.max(0, step.finish - step.start);
    busy.set(step.machineId, (busy.get(step.machineId) ?? 0) + dur);
  }
  const loads = new Map<string, number>();
  for (const [machine, hours] of busy) {
    loads.set(machine, Math.min(100, Math.round((hours / WIN_HOURS) * 100)));
  }
  return loads;
}

/** 장비 부하율 편차(%p) = 최대-최소 */
function loadDeviation(loads: Map<string, number>): number {
  const vals = [...loads.values()];
  return vals.length ? Math.max(...vals) - Math.min(...vals) : 0;
}

/** 시간 포맷 (정수면 'N시간', 아니면 'N.N시간') */
function fmtHr(hours: number): string {
  return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
}

function utilDevLabel(devPp: number): string {
  if (devPp <= 5) return '매우 균등';
  if (devPp <= 15) return '균등';
  if (devPp <= 25) return '편차 있음';
  return '편차 큼';
}

// ── 옵션 1개 → 중간 산출물 ──────────────────────────────────────────────────

interface OptionMetrics {
  rescued: number;
  delayImprove: number; // 누적지연 개선(시간, before-after)
  waitImprove: number; // 대기 개선(분, before-after)
  utilDevPp: number; // 장비 부하 편차(%p)
  moves: number; // 큐 순서 변경 수
}

function rawMetrics(opt: RescheduleOption, afterLoads: Map<string, number>): OptionMetrics {
  const mc = opt.metricsComparison;
  const loadVals = [...afterLoads.values()];
  const utilDevPp = loadVals.length ? Math.max(...loadVals) - Math.min(...loadVals) : 0;
  return {
    rescued: opt.deadlineImpact?.rescuedCount ?? 0,
    delayImprove: mc ? mc.cumulativeDelayHr.before - mc.cumulativeDelayHr.after : 0,
    waitImprove: mc ? mc.avgQueueWaitMin.before - mc.avgQueueWaitMin.after : 0,
    utilDevPp,
    moves: opt.queueReorder.length,
  };
}

/** 배열을 0~100으로 min-max 정규화. 전부 같으면 100 */
function normalize(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 100);
  return values.map((v) => Math.round(((v - min) / (max - min)) * 100));
}

// ── 화면 모델로 합성된 전략 (RescheduleStrategy + API 부가정보) ───────────────
export interface AdaptedStrategy extends RescheduleStrategy {
  apiStrategy: string; // select 호출용 원본 전략 코드
  analysisStatus: string; // success | fallback
  selectable: boolean; // fallback/스케줄 없음이면 false → 선택 비활성
  fallbackReason: string | null;
  recommendationReasoning: string | null;
  keyImprovements: KeyImprovement[];
  keyConcerns: KeyConcern[];
  detailedReport: DetailedReport | null;
  deadlineImpact: DeadlineImpact | null;
  metricsComparison: MetricsComparison | null;
}

function buildUnits(
  detail: RescheduleGroupDetail,
  opt: RescheduleOption,
  riskUnitIds: Set<string>
): UnitRiskChange[] {
  const before = detail.beforeSchedule;
  const after = opt.afterSchedule;
  const units: UnitRiskChange[] = [];

  // 위험 unit: 전→후 완료시각 비교로 구제/잔존 판정
  for (const unitId of riskUnitIds) {
    const bh = unitFinishHour(before, unitId);
    const ah = unitFinishHour(after, unitId);
    const deltaHr = bh != null && ah != null ? Math.round((bh - ah) * 10) / 10 : 0;
    units.push({
      unit_id: unitId,
      relieved: deltaHr > 0,
      done_before: unitFinishLabel(before, unitId) ?? '—',
      done_after: unitFinishLabel(after, unitId) ?? '—',
      delta_hr: deltaHr,
    });
  }

  // 신규 위험: 조정 후 완료가 늦어진(악화) 비위험 unit
  if (after) {
    for (const unit of after.units) {
      if (riskUnitIds.has(unit.unit_id)) continue;
      const bh = unitFinishHour(before, unit.unit_id);
      const ah = unitFinishHour(after, unit.unit_id);
      if (bh == null || ah == null) continue;
      const deltaHr = Math.round((bh - ah) * 10) / 10;
      if (deltaHr < 0) {
        units.push({
          unit_id: unit.unit_id,
          relieved: false,
          is_new: true,
          done_before: unitFinishLabel(before, unit.unit_id) ?? '—',
          done_after: unitFinishLabel(after, unit.unit_id) ?? '—',
          delta_hr: deltaHr,
        });
      }
    }
  }
  return units;
}

function buildSchedule(opt: RescheduleOption, beforeLoads: Map<string, number>, riskUnitIds: Set<string>) {
  const afterLoads = machineLoads(opt.afterSchedule);
  const byMachine = new Map<string, FlatStep[]>();
  for (const step of flatten(opt.afterSchedule)) {
    const arr = byMachine.get(step.machineId) ?? [];
    arr.push(step);
    byMachine.set(step.machineId, arr);
  }
  return [...byMachine.entries()].map(([machine, steps]) => ({
    machine,
    load_before: beforeLoads.get(machine) ?? 0,
    load_after: afterLoads.get(machine) ?? 0,
    units: steps.map((s) => ({
      unit_id: s.unitId,
      start: Math.round(s.start * 10) / 10,
      end: Math.round(s.finish * 10) / 10,
      affected: riskUnitIds.has(s.unitId),
    })),
  }));
}

function buildQueue(opt: RescheduleOption, riskUnitIds: Set<string>) {
  const qr = opt.queueReorder;
  if (qr.length > 0) {
    const before = [...qr]
      .sort((a, b) => a.original_queue_position - b.original_queue_position)
      .map((x) => x.unit_id);
    const after = [...qr]
      .sort((a, b) => a.new_queue_position - b.new_queue_position)
      .map((x) => x.unit_id);
    return {
      before,
      after,
      affected: after.filter((u) => riskUnitIds.has(u)),
    };
  }
  // queueReorder가 없으면 스케줄 착수 순서로 대체
  const order = (sched: AfterSchedule | null) =>
    sched
      ? [...sched.units]
          .map((u) => ({
            id: u.unit_id,
            start: Math.min(...u.steps.map((s) => hourOf(s.start))),
          }))
          .sort((a, b) => a.start - b.start)
          .map((x) => x.id)
      : [];
  const after = order(opt.afterSchedule);
  return { before: after, after, affected: after.filter((u) => riskUnitIds.has(u)) };
}

/** 상세 응답 → 화면 전략 카드 배열 (레이더는 옵션 간 정규화) */
export function buildStrategies(detail: RescheduleGroupDetail): AdaptedStrategy[] {
  const riskUnitIds = new Set(detail.delayRisks.map((r) => r.unitId));
  const beforeLoads = machineLoads(detail.beforeSchedule);
  const options = detail.options;

  // 1차 패스: 옵션별 원시 지표 + 장비 부하
  const metricsList = options.map((opt) => rawMetrics(opt, machineLoads(opt.afterSchedule)));

  // 레이더 5축 원시값 (높을수록 좋게 정렬)
  const axRescue = metricsList.map((m) => m.rescued);
  const axMakespan = metricsList.map((m) => m.delayImprove);
  const axWait = metricsList.map((m) => m.waitImprove);
  const axBalance = metricsList.map((m) => -m.utilDevPp);
  const axOrder = metricsList.map((m) => -m.moves);
  const nRescue = normalize(axRescue);
  const nMakespan = normalize(axMakespan);
  const nWait = normalize(axWait);
  const nBalance = normalize(axBalance);
  const nOrder = normalize(axOrder);

  // best 판정(파트별 1등 index)
  const argmax = (arr: number[]) => arr.indexOf(Math.max(...arr));
  const bestRescue = argmax(axRescue);
  const bestMakespan = argmax(axMakespan);
  const bestWait = argmax(axWait);
  const bestBalance = argmax(axBalance);

  return options.map((opt, i) => {
    const meta = opt.strategy ? STRATEGY_META[opt.strategy] : undefined;
    const name = meta?.title ?? opt.strategy ?? '재조정안';
    const m = metricsList[i];
    const mc = opt.metricsComparison;
    const afterLoads = machineLoads(opt.afterSchedule);

    // 장비별 부하 전/후 (부하 높은 순 최대 4개)
    const utils: MachineUtilChange[] = [...new Set([...beforeLoads.keys(), ...afterLoads.keys()])]
      .map((machine) => ({
        machine,
        util_before: beforeLoads.get(machine) ?? 0,
        util_after: afterLoads.get(machine) ?? 0,
      }))
      .sort((a, b) => b.util_after - a.util_after)
      .slice(0, 4);

    const bests: StrategyBest[] = [];
    if (i === bestRescue) bests.push('rescue');
    if (i === bestMakespan) bests.push('makespan');
    if (i === bestWait) bests.push('wait');
    if (i === bestBalance) bests.push('balance');

    // 헤드라인 효과 — 전략별 대표 지표 (납기 우선=누적지연 / 부하 균형=부하율 편차 / 대기 최소화=평균 대기)
    const effect = (() => {
      // 장비 부하율 균형 → 부하율 편차(전/후)
      if (opt.strategy === 'utilization_balance') {
        const b = Math.round(loadDeviation(beforeLoads));
        const a = Math.round(loadDeviation(afterLoads));
        const d = b - a;
        return {
          metric: '장비 부하율 편차',
          before: `${b}%p`,
          after: `${a}%p`,
          delta: d > 0 ? `${d}%p 감소` : d < 0 ? `${-d}%p 증가` : '변화 없음',
        };
      }
      // 대기시간 최소화(라인 회복) → 평균 대기 시간(전/후)
      if (opt.strategy === 'line_recovery_first' && mc) {
        const b = Math.round(mc.avgQueueWaitMin.before);
        const a = Math.round(mc.avgQueueWaitMin.after);
        const d = b - a;
        return {
          metric: '평균 대기 시간',
          before: `${b}분`,
          after: `${a}분`,
          delta: d > 0 ? `${d}분 감소` : d < 0 ? `${-d}분 증가` : '변화 없음',
        };
      }
      // 유닛 납기 우선 → 누적 지연 시간(전/후)
      if (opt.strategy === 'due_date_first' && mc) {
        const c = mc.cumulativeDelayHr;
        const d = Math.round((c.before - c.after) * 10) / 10;
        return {
          metric: '누적 지연 시간',
          before: fmtHr(c.before),
          after: fmtHr(c.after),
          delta: d > 0 ? `${fmtHr(d)} 단축` : d < 0 ? `${fmtHr(-d)} 증가` : '변화 없음',
        };
      }
      // 그 외/fallback → 생산량, 없으면 예상 지연
      if (mc) {
        return {
          metric: '생산량(완료 유닛)',
          before: `${mc.completedUnits.before}개`,
          after: `${mc.completedUnits.after}개`,
          delta: `${mc.completedUnits.delta >= 0 ? '+' : ''}${mc.completedUnits.delta}개`,
        };
      }
      return {
        metric: '예상 지연',
        before: '—',
        after: opt.estimatedDelayHrAfter != null ? `${opt.estimatedDelayHrAfter}시간` : '—',
        delta: '',
      };
    })();

    const selectable = opt.analysisStatus === 'success' && opt.afterSchedule != null;

    return {
      key: SLOT_KEYS[i] ?? SLOT_KEYS[i % SLOT_KEYS.length],
      name,
      recommended: opt.recommended,
      candidate: {
        badge: `후보${String.fromCharCode(65 + i)}안`,
        title: name,
        whenLead: meta?.whenLead ?? '이 전략',
        whenTail: meta?.whenTail ?? '을 적용하는 전략입니다',
        recommendReason: undefined, // 추천 근거는 recommendationReasoning으로 별도 표시
        effect,
      },
      compare: {
        units: buildUnits(detail, opt, riskUnitIds),
        makespan_before_min: mc ? Math.round(mc.cumulativeDelayHr.before * 60) : 0,
        makespan_after_min: mc ? Math.round(mc.cumulativeDelayHr.after * 60) : 0,
        wait_before_min: mc ? Math.round(mc.avgQueueWaitMin.before) : 0,
        wait_after_min: mc ? Math.round(mc.avgQueueWaitMin.after) : 0,
        utils,
        util_dev_pp: m.utilDevPp,
        util_dev_label: utilDevLabel(m.utilDevPp),
        moved_units: m.moves,
        radar: [nRescue[i], nMakespan[i], nWait[i], nBalance[i], nOrder[i]],
        bests,
      },
      detail: {
        summary: opt.summary,
        queue: buildQueue(opt, riskUnitIds),
        schedule: buildSchedule(opt, beforeLoads, riskUnitIds),
        dueRelief: [],
      },
      // ── API 부가정보 ──
      apiStrategy: opt.strategy ?? '',
      analysisStatus: opt.analysisStatus,
      selectable,
      fallbackReason: opt.fallbackReason,
      recommendationReasoning: opt.recommendationReasoning,
      keyImprovements: opt.keyImprovements ?? [],
      keyConcerns: opt.keyConcerns ?? [],
      detailedReport: opt.detailedReport,
      deadlineImpact: opt.deadlineImpact,
      metricsComparison: mc,
    };
  });
}

/** 상세 응답 → 화면 그룹 모델(헤더·위험 모달용) */
export function toRescheduleGroupFromDetail(detail: RescheduleGroupDetail): RescheduleGroup {
  const topRisk = [...detail.delayRisks].sort((a, b) => b.riskScore - a.riskScore)[0];
  const levelRank: Record<RiskLevel, number> = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  const maxLevel = detail.delayRisks.reduce<RiskLevel>((acc, r) => {
    const lv = toRiskLevel(r.riskLevel);
    return levelRank[lv] > levelRank[acc] ? lv : acc;
  }, 'Low');

  return {
    group_id: detail.groupId,
    district_id: detail.districtId as RescheduleDistrict,
    process_step: detail.processStep,
    max_risk_score: Math.round(detail.maxDelayProbability * 100),
    risk_level: maxLevel,
    risk_factor: riskFactorLabel(topRisk?.riskFactor),
    group_status: toGroupStatus(detail.groupStatus),
    affected_units: detail.delayRisks.map((r) => ({
      unit_id: r.unitId,
      risk_score: Math.round(r.riskScore * 100),
      delay_probability: r.delayProbability,
      estimated_delay_hr: r.estimatedDelayHr,
    })),
  };
}

/** 목록 항목 → 카드 데이터. districtLabel은 호출부에서 매핑해 전달 */
export function toCardData(
  summary: RescheduleGroupSummary,
  districtLabel: string
): RescheduleCardData {
  return {
    group_id: summary.groupId,
    districtLabel,
    process_step: summary.processStep,
    max_risk_score: Math.round(summary.maxRiskScore * 100),
    risk_level: toRiskLevel(summary.riskLevel),
    // riskFactor 있으면 한글 라벨, 없으면 빈 문자열 → 카드에서 '지연 위험'으로 폴백
    risk_factor: summary.riskFactor ? riskFactorLabel(summary.riskFactor) : '',
    group_status: toGroupStatus(summary.groupStatus),
    created_at: summary.createdAt,
    affected_units: summary.affectedUnits.map((u) => ({
      unit_id: u.unitId,
      risk_score: 0,
      delay_probability: 0,
      estimated_delay_hr: u.estimatedDelayHr,
    })),
  };
}
