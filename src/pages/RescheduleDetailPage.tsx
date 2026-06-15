import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  CircleCheck,
  Gauge,
  Loader2,
  Minus,
  RefreshCw,
  ShieldAlert,
  Star,
  Timer,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  BeforeAfterBar,
  BeforeAfterColumn,
  Chip,
  type ComparePhase,
  ConfirmModal,
  Modal,
  ScheduleChangeGantt,
  StrategyRadar,
} from '@components/common';
import { RescheduleFaqChat } from '@/components/reschedule';
import { useGenerateReschedule, useRescheduleDetail, useSelectStrategy } from '@/hooks';
import { districtLabels, useToastStore, type DistrictId } from '@/stores';
import {
  buildStrategies,
  formatDelayHours,
  getApiErrorMessage,
  getApiErrorStatus,
  processStepLabel,
  riskChipColor,
  riskLevelLabel,
  statusChipColor,
  statusLabel,
  toRescheduleGroupFromDetail,
} from '@/utils';
import type { RescheduleStrategy, StrategyBest, StrategyKey, UnitRiskChange } from '@/types';

// 전략별 강조색 — 레이더 폴리곤·진행 바·선택 칩에 공통 사용
const STRATEGY_ACCENTS: Record<StrategyKey, { hex: string; bar: string }> = {
  due_date_first: { hex: '#EA002C', bar: 'bg-primary-500' },
  utilization_bal: { hex: '#4F46E5', bar: 'bg-indigo-600' },
  line_recovery: { hex: '#0F766E', bar: 'bg-teal-700' },
};

// 레이더 축 — 라벨 + hover 설명 (mock compare.radar 값 순서와 일치)
const RADAR_AXES = [
  { label: '지연 위험 완화', desc: '지연 위험 유닛을 안전권으로 되돌린 정도' },
  { label: '작업 완료 속도', desc: '전체 작업이 끝나는 시점이 빨라진 정도' },
  { label: '대기 시간 개선', desc: '큐에서 대기하는 평균 시간이 줄어든 정도' },
  { label: '장비 부하 균등', desc: '장비 간 부하가 고르게 분산된 정도' },
  { label: '순서 변동 최소', desc: '기존 작업 순서를 적게 바꾼 정도' },
];

/** 대기열 행 — 대시보드 대기열 카드 스타일(번호 원형 + 흰 칩), 이후 대기열은 순위 변동 표시 */
function QueueRow({
  unitId,
  position,
  affected,
  delta,
}: {
  unitId: string;
  position: number;
  affected: boolean;
  delta?: number; // 이전 대비 상승(+)/하락(-)/유지(0). undefined면 변동 미표시(이전 대기열)
}) {
  const showDelta = delta !== undefined;
  const DeltaIcon = !showDelta || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  const deltaColor =
    !showDelta || delta === 0 ? 'text-gray-400' : delta > 0 ? 'text-emerald-600' : 'text-red-600';

  return (
    <li className="relative flex items-center gap-2.5">
      <span
        className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          affected ? 'bg-primary-500' : 'bg-gray-300'
        }`}
      >
        {position}
      </span>
      <span
        className={`flex flex-1 items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-1.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)] ${
          affected ? 'border-primary-200' : 'border-gray-100'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`text-[12px] text-secondary-navy ${affected ? 'font-bold' : 'font-semibold'}`}
          >
            {unitId}
          </span>
          {affected ? (
            <Chip variant="subtle" color="red" size="xs">
              위험
            </Chip>
          ) : null}
        </span>
        {showDelta ? (
          <span className={`flex items-center gap-0.5 text-label-3 font-semibold ${deltaColor}`}>
            <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
            {delta === 0 ? '유지' : Math.abs(delta)}
          </span>
        ) : null}
      </span>
    </li>
  );
}

/** 대기열 목록 — 좌측 연결선 + 번호 행(대시보드 대기열 카드 참고) */
function QueueList({
  order,
  affected,
  beforeOrder,
}: {
  order: string[];
  affected: string[];
  beforeOrder?: string[]; // 주어지면 이후 대기열로 보고 변동량 계산
}) {
  return (
    <div className="relative pl-[10px]">
      <span
        className="pointer-events-none absolute bottom-3 left-[10px] top-3 w-px bg-gray-200"
        aria-hidden
      />
      <ul className="flex flex-col gap-2">
        {order.map((unitId, index) => (
          <QueueRow
            key={unitId}
            unitId={unitId}
            position={index + 1}
            affected={affected.includes(unitId)}
            delta={beforeOrder ? beforeOrder.indexOf(unitId) - index : undefined}
          />
        ))}
      </ul>
    </div>
  );
}

/** unit별 완료 시각 변화량 칩 — 양수=앞당김(초록), 음수=지연(빨강) */
function UnitDeltaChip({ deltaHr }: { deltaHr: number }) {
  if (deltaHr === 0) {
    return (
      <Chip variant="subtle" color="gray" size="xs" className="font-bold tabular-nums">
        ±0
      </Chip>
    );
  }
  const improved = deltaHr > 0;
  return (
    <Chip
      variant="subtle"
      color={improved ? 'emerald' : 'red'}
      size="xs"
      className="font-bold tabular-nums"
    >
      {improved ? (
        <ArrowDown className="h-3 w-3" aria-hidden />
      ) : (
        <ArrowUp className="h-3 w-3" aria-hidden />
      )}
      {formatDelayHours(Math.abs(deltaHr))}
    </Chip>
  );
}

/** unit 행 — 상태 아이콘 + ID / 완료 시각 전→후 + 단축폭 */
function UnitRiskRow({ unit, phase }: { unit: UnitRiskChange; phase: ComparePhase }) {
  const safe = phase === 'after' && unit.relieved;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-[0_2px_6px_rgba(15,23,42,0.04)]">
      <span className="flex items-center gap-1.5 text-label-2 font-bold text-secondary-navy">
        {safe ? (
          <CircleCheck
            className="h-4 w-4 text-emerald-500 transition-colors duration-500"
            aria-label="위험 해소"
          />
        ) : (
          <TriangleAlert
            className="h-4 w-4 text-red-500 transition-colors duration-500"
            aria-label="위험"
          />
        )}
        {unit.unit_id}
        {unit.is_new ? (
          <Chip variant="subtle" color="red" size="xs" className="font-bold">
            신규 위험
          </Chip>
        ) : null}
      </span>
      <span className="flex items-center gap-2 tabular-nums">
        {phase === 'after' ? (
          <>
            <span className="text-label-3 text-gray-400">{unit.done_before}</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300" aria-hidden />
            <span className="text-label-1 font-bold text-secondary-navy">{unit.done_after}</span>
            <span className="flex w-[74px] justify-end">
              <UnitDeltaChip deltaHr={unit.delta_hr} />
            </span>
          </>
        ) : (
          <span className="text-label-1 font-bold text-secondary-navy">{unit.done_before}</span>
        )}
      </span>
    </div>
  );
}

/** 의사결정 질문 1개 = 카드 1개 — 제목·의미 힌트·1등 별, 본문은 결론(히어로 수치)부터 */
function StatCard({
  icon: Icon,
  title,
  hint,
  best = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint: string; // 이 지표가 답하는 의사결정 질문
  best?: boolean; // 전략 중 이 파트 1등
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface-100 p-4">
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-gray-400" aria-hidden />
        <span className="text-label-1 font-bold text-secondary-navy">{title}</span>
        {best ? (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label="전략 중 최고" />
        ) : null}
        <span className="ml-auto text-label-3 text-gray-400">{hint}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** 후보안 카드 — 후보 라벨 + 전략명 + 선택 기준 + 핵심 효과. 클릭 시 상세를 펼친다 */
function CandidateCard({
  strategy,
  active,
  accentHex,
  onSelect,
}: {
  strategy: RescheduleStrategy;
  active: boolean;
  accentHex: string;
  onSelect: () => void;
}) {
  const { candidate } = strategy;
  const { effect } = candidate;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`relative flex flex-col rounded-2xl border-2 bg-white p-4 text-left transition ${
        active
          ? 'shadow-[0_12px_28px_rgba(15,23,42,0.10)]'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]'
      }`}
      style={active ? { borderColor: accentHex } : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex items-center gap-1.5 text-label-2 font-bold"
          style={{ color: accentHex }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentHex }}
            aria-hidden
          />
          {candidate.badge}
        </span>
        {strategy.recommended ? (
          <Chip variant="subtle" color="primary" size="xs" className="font-bold">
            <Star className="h-3 w-3 fill-primary-500 text-primary-500" aria-hidden />
            추천
          </Chip>
        ) : null}
      </div>

      <h3 className="mt-2 text-subtitle-1 font-bold text-secondary-navy">{candidate.title}</h3>
      <p className="mt-1.5 text-body-1 leading-relaxed text-gray-500">
        <span className="font-bold text-secondary-navy">{candidate.whenLead}</span>
        {candidate.whenTail}
      </p>

      {/* 핵심 효과 */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-label-3 text-gray-400">{effect.metric}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-label-1 tabular-nums text-gray-400">{effect.before}</span>
          <ArrowRight className="h-4 w-4 text-gray-300" aria-hidden />
          <span className="text-subtitle-1 font-bold tabular-nums text-secondary-navy">
            {effect.after}
          </span>
          {/* 변화량 배지 — 카드 고유 색상의 라이트 톤 */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-3 font-bold"
            style={{ color: accentHex, backgroundColor: `${accentHex}1A` }}
          >
            <TrendingUp className="h-3 w-3" aria-hidden />
            {effect.delta}
          </span>
        </div>
      </div>

      {/* 선택 시 아래 상세를 가리키는 캐럿 (가로 배치일 때만) */}
      {active ? (
        <span
          className="absolute -bottom-[13px] left-1/2 hidden h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent md:block"
          style={{ borderTopColor: accentHex }}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

/** 로딩/에러/없음 등 상태 화면 — 뒤로가기 + 중앙 메시지 */
function StateShell({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="목록으로"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-secondary-navy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-heading-2 text-gray-400">재조정안 관리</span>
        </div>
        <div className="flex h-40 items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-500">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function RescheduleDetailPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const addToast = useToastStore((state) => state.addToast);

  const { data: detail, isLoading, isError, error } = useRescheduleDetail(groupId);
  const generate = useGenerateReschedule(groupId);
  const select = useSelectStrategy(groupId);

  const [selectedKey, setSelectedKey] = useState<StrategyKey | null>(null);
  const [phase, setPhase] = useState<ComparePhase>('after'); // 처음에는 조정 후만 표시
  const [riskModalOpen, setRiskModalOpen] = useState(false); // 원인 분석 + 영향 UNIT 모달
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changeTab, setChangeTab] = useState<'queue' | 'schedule'>('queue');

  // 조정 전/후 토글 안내 툴팁 — 진입·전략 전환 시 3초간 노출
  const [showPhaseHint, setShowPhaseHint] = useState(true);
  const phaseHintTimer = useRef<number | null>(null);
  const flashPhaseHint = () => {
    setShowPhaseHint(true);
    if (phaseHintTimer.current !== null) window.clearTimeout(phaseHintTimer.current);
    phaseHintTimer.current = window.setTimeout(() => setShowPhaseHint(false), 3000);
  };
  // 진입 시 안내 툴팁은 기본 노출 상태 — 3초 뒤 숨김
  useEffect(() => {
    phaseHintTimer.current = window.setTimeout(() => setShowPhaseHint(false), 3000);
    return () => {
      if (phaseHintTimer.current !== null) window.clearTimeout(phaseHintTimer.current);
    };
  }, []);

  // API 응답 → 화면 모델
  const strategies = useMemo(() => (detail ? buildStrategies(detail) : []), [detail]);
  const group = useMemo(() => (detail ? toRescheduleGroupFromDetail(detail) : null), [detail]);

  // 전략 전환 — 안내 툴팁 재노출
  const selectStrategy = (key: StrategyKey) => {
    setSelectedKey(key);
    flashPhaseHint();
  };
  const strategyLabel = (index: number) => String.fromCharCode(65 + index); // 0→A, 1→B, 2→C

  const runGenerate = () =>
    generate.mutate(undefined, {
      onSuccess: () => addToast({ tone: 'info', title: '재조정안이 생성되었습니다' }),
      onError: (e) => {
        // 409 = 대기열에 재조정 가능한 위험 없음(대상 unit이 이미 처리됨) → 재시도 무의미
        // 502 = 에이전트 일시 오류 → 재시도 권장
        if (getApiErrorStatus(e) === 409) {
          addToast({
            tone: 'info',
            title: '재조정 가능한 위험이 없습니다',
            description: getApiErrorMessage(e, '대상 unit이 이미 처리되어 지금은 재조정할 수 없습니다.'),
          });
        } else {
          addToast({
            tone: 'critical',
            title: '재생성 실패',
            description: getApiErrorMessage(e, '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.'),
          });
        }
      },
    });

  // ── 상태 화면 ──
  if (isLoading) {
    return (
      <StateShell onBack={() => navigate('/reschedule')}>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        재조정안을 불러오는 중…
      </StateShell>
    );
  }
  if (isError) {
    return (
      <StateShell onBack={() => navigate('/reschedule')}>
        {getApiErrorMessage(error, '재조정안을 불러오지 못했습니다.')}
      </StateShell>
    );
  }
  if (!detail || !group) {
    return (
      <StateShell onBack={() => navigate('/reschedule')}>
        해당 재조정안을 찾을 수 없습니다.
      </StateShell>
    );
  }

  const recommendedIndex = Math.max(
    0,
    strategies.findIndex((strategy) => strategy.recommended)
  );
  const activeIndex = (() => {
    const i = strategies.findIndex((strategy) => strategy.key === selectedKey);
    return i >= 0 ? i : recommendedIndex;
  })();
  const activeStrategy = strategies[activeIndex];

  // 재조정안이 아직 없음(빈 options) → 재생성 유도
  if (strategies.length === 0 || !activeStrategy) {
    return (
      <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reschedule')}
              aria-label="목록으로"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-secondary-navy"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-heading-2">
              <span className="text-gray-400">재조정안 관리</span>
              <span className="text-gray-300">›</span>
              <span className="text-secondary-navy">{group.risk_factor || '지연 위험'}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <div className="flex items-center gap-3">
              <Chip variant="solid" color={riskChipColor(group.risk_level)} size="lg" className="font-bold">
                {riskLevelLabel(group.risk_level)}
              </Chip>
              <span className="text-subtitle-1 font-bold text-secondary-navy">
                {group.risk_factor || '지연 위험'}
              </span>
            </div>
            <p className="text-body-2 text-gray-500">
              아직 생성된 재조정안이 없습니다. 재생성을 실행하면 AI가 전략별 재조정안을 만듭니다.
            </p>
            <button
              type="button"
              onClick={runGenerate}
              disabled={generate.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 disabled:opacity-60"
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              {generate.isPending ? '재생성 중… (최대 2분)' : '재조정안 생성'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const { compare } = activeStrategy;
  const accent = STRATEGY_ACCENTS[activeStrategy.key] ?? STRATEGY_ACCENTS.due_date_first;

  const isBest = (key: StrategyBest) => compare.bests.includes(key);

  // 위험 unit 변화량 — deadlineImpact(있으면) 우선, 없으면 unit 비교에서 도출
  const di = activeStrategy.deadlineImpact;
  const rescuedCount = di
    ? di.rescuedCount
    : compare.units.filter((unit) => !unit.is_new && unit.relieved).length;
  const remainCount = di
    ? di.stillAtRiskCount
    : compare.units.filter((unit) => !unit.is_new && !unit.relieved).length;
  const newRiskCount = di
    ? di.newlyAtRiskCount + di.newlyViolatedCount
    : compare.units.filter((unit) => unit.is_new).length;
  const waitDiff = compare.wait_before_min - compare.wait_after_min; // 양수=단축

  const radarSeries = strategies.map((strategy) => ({
    key: strategy.key,
    name: strategy.name,
    color: (STRATEGY_ACCENTS[strategy.key] ?? STRATEGY_ACCENTS.due_date_first).hex,
    values: strategy.compare.radar,
  }));
  // 축별로 선택 전략이 전 전략 중 1등(공동 1등 포함)인지
  const bestAxes = RADAR_AXES.map((_, axisIndex) => {
    const max = Math.max(...strategies.map((s) => s.compare.radar[axisIndex]));
    return compare.radar[axisIndex] >= max;
  });

  // 원인 분석 — riskAnalysis(evidence 해석 + 인과사슬). 미호출이면 빈 배열
  const ra = detail.riskAnalysis;
  const reasons: string[] = [];
  if (ra?.root_cause?.evidence) {
    reasons.push(...ra.root_cause.evidence.map((e) => e.interpretation).filter(Boolean));
  }
  if (ra?.causal_chain) reasons.push(ra.causal_chain);

  const canSelect = activeStrategy.selectable && !select.isPending;
  const approveStrategy = () =>
    select.mutate(activeStrategy.apiStrategy, {
      onSuccess: () => {
        setApproveModalOpen(false);
        addToast({ tone: 'info', title: '재조정안 승인이 완료되었습니다' });
        navigate('/dashboard');
      },
      onError: (e) => {
        setApproveModalOpen(false);
        addToast({
          tone: 'critical',
          title: '승인 실패',
          description: getApiErrorMessage(e, '잠시 후 다시 시도해 주세요.'),
        });
      },
    });

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        {/* 뒤로 + 브레드크럼 (구역 필터 시 구역 포함) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/reschedule')}
            aria-label="목록으로"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-secondary-navy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-heading-2">
            <button
              type="button"
              onClick={() => navigate('/reschedule')}
              className="text-gray-400 transition hover:text-gray-600"
            >
              재조정안 관리
            </button>
            <span className="text-gray-300">›</span>
            <span className="text-secondary-navy">
              {districtLabels[detail.districtId as DistrictId] ?? `구역 ${detail.districtId}`} ·{' '}
              {processStepLabel(group.process_step)}
            </span>
          </div>
        </div>

        {(
          <>
            {/* 현재 위험 상황 */}
            <section className="mt-2 flex flex-col gap-4">
              <h2 className="text-[1.5rem] font-bold leading-tight text-secondary-navy">
                현재 위험 상황
              </h2>
              {/* 위험 내용 — 가로 꽉 채움, 우측 하단 자세히 보기 */}
              <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {/* 메타 행 — 구역/스텝 + 영향 UNIT/상태 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Chip variant="outline" size="sm">
                      {districtLabels[detail.districtId as DistrictId] ?? `구역 ${detail.districtId}`}
                    </Chip>
                    <Chip variant="outline" size="sm">
                      {processStepLabel(group.process_step)}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-label-2 text-gray-400">
                      영향 UNIT{' '}
                      <b className="text-secondary-navy">{group.affected_units.length}개</b>
                    </span>
                    <Chip variant="subtle" color={statusChipColor(group.group_status)} size="md">
                      {statusLabel(group.group_status)}
                    </Chip>
                  </div>
                </div>

                {/* 위험 제목 — 한 칸 아래, 크게 / 같은 선상 우측에 자세히 보기 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Chip
                      variant="solid"
                      color={riskChipColor(group.risk_level)}
                      size="lg"
                      className="font-bold"
                    >
                      {riskLevelLabel(group.risk_level)}
                    </Chip>
                    <div className="text-[1.25rem] font-bold leading-tight text-secondary-navy">
                      {group.risk_factor || '지연 위험'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRiskModalOpen(true)}
                    className="rounded-lg border border-gray-200 px-3.5 py-2 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
                  >
                    자세히 보기
                  </button>
                </div>
              </div>
            </section>

            {/* 스케줄 재조정 후보안 */}
            <section className="mt-5 flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-2.5">
                  <h2 className="text-[1.5rem] font-bold leading-tight text-secondary-navy">
                    스케줄 재조정 후보안
                  </h2>
                  <p className="text-body-1 text-gray-500">
                    위험 상황을 해결하기 위한 <b>여러 관점에서의 스케줄 재조정안</b>을 AI가
                    제공합니다.
                  </p>
                </div>

                {/* 액션 버튼 — 후보안 헤더 우측 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runGenerate}
                    disabled={generate.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-label-1 font-semibold text-secondary-navy transition hover:bg-surface-100 disabled:opacity-60"
                  >
                    {generate.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-4 w-4" aria-hidden />
                    )}
                    {generate.isPending ? '재생성 중…' : '재생성'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-label-1 font-semibold text-secondary-navy transition hover:bg-surface-100"
                  >
                    AI 리포트 확인하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(true)}
                    disabled={!canSelect}
                    title={activeStrategy.selectable ? undefined : 'fallback로 생성된 안은 선택할 수 없습니다. 재생성하세요.'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {select.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    재조정안{strategyLabel(activeIndex)} 승인
                  </button>
                </div>
              </div>

              {/* 후보안 카드 — 클릭 시 아래 상세가 해당 전략으로 전환 */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {strategies.map((strategy) => (
                  <CandidateCard
                    key={strategy.key}
                    strategy={strategy}
                    active={strategy.key === activeStrategy.key}
                    accentHex={(STRATEGY_ACCENTS[strategy.key] ?? STRATEGY_ACCENTS.due_date_first).hex}
                    onSelect={() => selectStrategy(strategy.key)}
                  />
                ))}
              </div>

              {/* 선택 후보안 상세 — 좌 레이더 / 우 효과 카드 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-subtitle-2 font-bold text-white"
                      style={{ backgroundColor: accent.hex }}
                    >
                      {strategyLabel(activeIndex)}
                    </span>
                    <span className="text-[1.25rem] font-bold leading-tight text-secondary-navy">
                      {activeStrategy.candidate.title}
                    </span>
                    {activeStrategy.recommended ? (
                      <Chip variant="subtle" color="primary" size="sm" className="font-bold">
                        <Star
                          className="h-3.5 w-3.5 fill-primary-500 text-primary-500"
                          aria-hidden
                        />
                        추천
                      </Chip>
                    ) : null}
                  </div>

                  {/* 전/후 토글 + 안내 툴팁 (페이드+슬라이드 인터랙션) */}
                  <div className="relative">
                    <div
                      className={`pointer-events-none absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-md shadow-black/10 transition-all duration-300 ease-out ${
                        showPhaseHint
                          ? 'translate-y-0 scale-100 opacity-100'
                          : 'pointer-events-none translate-y-1.5 scale-95 opacity-0'
                      }`}
                    >
                      재조정안을 적용하기 전과 후의 효과를 비교할 수 있습니다
                      <span className="absolute right-6 top-full h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-zinc-900" />
                    </div>
                    <div className="flex rounded-lg bg-surface-100 p-0.5">
                      {(['before', 'after'] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPhase(value)}
                          aria-pressed={phase === value}
                          className={`rounded-md px-3 py-1.5 text-label-3 font-semibold transition ${
                            phase === value
                              ? 'bg-secondary-navy text-white shadow'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {value === 'before' ? '조정 전' : '조정 후'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-7">
                  {/* 레이더(메인) — 전략 전환 시 폴리곤 모핑, 폴리곤 클릭으로도 전환 */}
                  <div className="mx-auto w-full max-w-[420px] self-center lg:mx-0 lg:w-[400px] lg:shrink-0">
                    <StrategyRadar
                      axes={RADAR_AXES.map((axis) => axis.label)}
                      descriptions={RADAR_AXES.map((axis) => axis.desc)}
                      bestAxes={bestAxes}
                      series={radarSeries}
                      selectedKey={activeStrategy.key}
                      onSelect={(key) => selectStrategy(key as StrategyKey)}
                      className="w-full"
                    />
                  </div>

                  {/* 선택 전략 효과 — 의사결정 질문 1개 = 카드 1개, 결론부터 크게 */}
                  <div className="flex w-full flex-1 flex-col gap-3">
                    {/* ① 위험이 해소되는가 */}
                    <StatCard
                      icon={ShieldAlert}
                      title="위험 유닛"
                      hint="지연 위험이 해소되는가"
                      best={isBest('rescue')}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                          지연 위험 완화 {rescuedCount}건
                        </span>
                        {remainCount > 0 ? (
                          <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                            위험 유지 {remainCount}건
                          </span>
                        ) : null}
                        {newRiskCount > 0 ? (
                          <Chip variant="subtle" color="red" size="sm" className="font-bold">
                            신규 위험 +{newRiskCount}
                          </Chip>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5">
                        {compare.units
                          .filter((unit) => phase === 'after' || !unit.is_new)
                          .map((unit) => (
                            <UnitRiskRow key={unit.unit_id} unit={unit} phase={phase} />
                          ))}
                      </div>
                    </StatCard>

                    {/* ② 라인 흐름이 빨라지는가 */}
                    <StatCard
                      icon={Timer}
                      title="평균 대기"
                      hint="라인 흐름이 빨라지는가"
                      best={isBest('wait')}
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex shrink-0 flex-col">
                          {waitDiff === 0 ? (
                            <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                              변화 없음
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[1.5rem] font-bold leading-none text-secondary-navy">
                              {waitDiff > 0 ? (
                                <ArrowDown className="h-6 w-6" aria-hidden />
                              ) : (
                                <ArrowUp className="h-6 w-6" aria-hidden />
                              )}
                              {Math.abs(waitDiff)}분
                            </span>
                          )}
                          <span className="mt-1.5 text-label-3 tabular-nums text-gray-400">
                            {compare.wait_before_min}분 → {compare.wait_after_min}분
                          </span>
                        </div>
                        <BeforeAfterBar
                          before={compare.wait_before_min}
                          after={compare.wait_after_min}
                          phase={phase}
                          max={80}
                          unit="분"
                          barClassName={accent.bar}
                          className="flex-1"
                        />
                      </div>
                    </StatCard>

                    {/* ③ 부하가 고르게 분배되는가 */}
                    <StatCard
                      icon={Gauge}
                      title="장비 부하율"
                      hint="부하가 고르게 분배되는가"
                      best={isBest('balance')}
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex shrink-0 flex-col">
                          <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                            {compare.util_dev_label}
                          </span>
                          <span className="mt-1.5 text-label-3 tabular-nums text-gray-400">
                            편차 ±{compare.util_dev_pp}%p
                          </span>
                        </div>
                        <div className="ml-auto flex items-end gap-6">
                          {compare.utils.map((util) => (
                            <BeforeAfterColumn
                              key={util.machine}
                              label={util.machine}
                              before={util.util_before}
                              after={util.util_after}
                              phase={phase}
                              barClassName={accent.bar}
                            />
                          ))}
                        </div>
                      </div>
                    </StatCard>
                  </div>
                </div>

                {/* fallback 안내 — 선택 불가 시 재생성 유도 */}
                {!activeStrategy.selectable ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
                    <p className="text-label-1 leading-relaxed text-amber-700">
                      <b>fallback로 생성된 안</b>이라 일부 지표·스케줄이 없어 선택할 수 없습니다.
                      {activeStrategy.fallbackReason ? ` (${activeStrategy.fallbackReason})` : ''} 재생성을
                      권장합니다.
                    </p>
                    <button
                      type="button"
                      onClick={runGenerate}
                      disabled={generate.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-label-2 font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      {generate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw className="h-4 w-4" aria-hidden />
                      )}
                      재생성
                    </button>
                  </div>
                ) : null}

                {/* 추천 근거 — recommendationReasoning */}
                {activeStrategy.recommendationReasoning ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-50 px-4 py-3">
                    <p className="text-label-1 leading-relaxed text-secondary-navy">
                      <b className="text-primary-600">추천 근거 : </b>
                      {activeStrategy.recommendationReasoning}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            {/* 하단: 변경 상세 탭 (가로 꽉 채움) */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div>
                <div className="flex gap-1 border-b border-gray-200">
                  {[
                    { key: 'queue' as const, label: '큐 우선순위 변경 내용' },
                    { key: 'schedule' as const, label: '스케줄 변경 내용' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setChangeTab(tab.key)}
                      className={`-mb-px border-b-2 px-3 py-2 text-label-2 font-semibold transition ${
                        changeTab === tab.key
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  {changeTab === 'queue' ? (
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {/* 이전 대기열 */}
                      <div className="flex-1">
                        <p className="mb-2 text-label-3 font-semibold text-gray-400">이전 대기열</p>
                        <QueueList
                          order={activeStrategy.detail.queue.before}
                          affected={activeStrategy.detail.queue.affected}
                        />
                      </div>

                      {/* 이후 대기열 (순위 변동 표시) */}
                      <div className="flex-1">
                        <p className="mb-2 text-label-3 font-semibold text-primary-600">
                          이후 대기열
                        </p>
                        <QueueList
                          order={activeStrategy.detail.queue.after}
                          affected={activeStrategy.detail.queue.affected}
                          beforeOrder={activeStrategy.detail.queue.before}
                        />
                      </div>
                    </div>
                  ) : (
                    <ScheduleChangeGantt
                      rows={activeStrategy.detail.schedule}
                      startHour={8}
                      endHour={20}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 위험 상황 상세 모달 — 원인 설명 + 영향 UNIT */}
            <Modal
              open={riskModalOpen}
              onClose={() => setRiskModalOpen(false)}
              title={group.risk_factor || '지연 위험'}
            >
              <div className="flex flex-col gap-5">
                {/* 원인 설명 */}
                <div>
                  <h4 className="mb-2 text-label-1 font-bold text-secondary-navy">원인 설명</h4>
                  {reasons.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {reasons.map((reason) => (
                        <li
                          key={reason}
                          className="flex gap-1.5 text-label-2 leading-snug text-gray-600"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-label-2 text-gray-400">원인 정보가 없습니다.</p>
                  )}
                </div>

                {/* 영향 UNIT */}
                <div>
                  <h4 className="mb-2 text-label-1 font-bold text-secondary-navy">
                    영향 UNIT ({group.affected_units.length}개)
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full text-label-2">
                      <thead className="bg-surface-100 text-label-3 text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">UNIT</th>
                          <th className="px-3 py-2 text-right font-semibold">위험점수</th>
                          <th className="px-3 py-2 text-right font-semibold">지연확률</th>
                          <th className="px-3 py-2 text-right font-semibold">지연 예측</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.affected_units.map((unit) => (
                          <tr key={unit.unit_id} className="border-t border-gray-100">
                            <td className="px-3 py-2 font-semibold text-secondary-navy">
                              {unit.unit_id}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {unit.risk_score}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {Math.round(unit.delay_probability * 100)}%
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-primary-600">
                              +{formatDelayHours(unit.estimated_delay_hr)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Modal>

            {/* AI 리포트 모달 */}
            <Modal
              open={reportModalOpen}
              onClose={() => setReportModalOpen(false)}
              title="AI 리포트"
            >
              <div className="flex flex-col gap-3 text-body-2 leading-relaxed text-gray-600">
                <p className="rounded-xl bg-surface-100 px-4 py-3 font-semibold text-secondary-navy">
                  재조정안{strategyLabel(activeIndex)} ({activeStrategy.name}) 적용 시{' '}
                  {group.risk_factor || '지연 위험'} 재조정 효과 분석
                </p>
                {activeStrategy.detailedReport ? (
                  (
                    [
                      ['핵심 요약', activeStrategy.detailedReport.executiveSummary],
                      ['위험 배경', activeStrategy.detailedReport.riskBackground],
                      ['지표 분석', activeStrategy.detailedReport.metricAnalysis],
                      ['트레이드오프', activeStrategy.detailedReport.tradeoffs],
                      ['결정 근거', activeStrategy.detailedReport.decisionBasis],
                    ] as const
                  )
                    .filter(([, body]) => Boolean(body))
                    .map(([heading, body]) => (
                      <div key={heading}>
                        <h4 className="mb-1 text-label-1 font-bold text-secondary-navy">{heading}</h4>
                        <p>{body}</p>
                      </div>
                    ))
                ) : (
                  <>
                    <p>{activeStrategy.detail.summary}</p>
                    <p className="text-gray-400">상세 리포트가 아직 생성되지 않았습니다.</p>
                  </>
                )}
              </div>
            </Modal>

            {/* 재조정안 승인 확인 모달 */}
            <ConfirmModal
              open={approveModalOpen}
              title={`재조정안${strategyLabel(activeIndex)}를 승인하시겠습니까?`}
              description={`승인 시 현재 시점에서 가능한 재조정안인지 검증한 후 곧바로 스케줄 변경이 적용됩니다.`}
              cancelLabel="취소"
              confirmLabel={select.isPending ? '승인 중…' : '승인'}
              onClose={() => setApproveModalOpen(false)}
              onConfirm={approveStrategy}
            />
          </>
        )}
      </div>

      {group ? <RescheduleFaqChat group={group} /> : null}
    </section>
  );
}
