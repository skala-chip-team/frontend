import { type ReactNode, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Gauge,
  Minus,
  RotateCcw,
  ShieldAlert,
  Star,
  Timer,
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
import { rescheduleGroups, rescheduleStrategies, riskReasonsByFactor } from '@/mocks';
import { districtLabels, useDistrictStore } from '@/stores';
import { formatDelayHours, riskChipColor, statusChipColor, statusLabel } from '@/utils';
import type { DueReliefUnit, StrategyBest, StrategyKey, UnitRiskChange } from '@/types';

// 전략별 강조색 — 레이더 폴리곤·진행 바·선택 칩에 공통 사용
const STRATEGY_ACCENTS: Record<StrategyKey, { hex: string; bar: string }> = {
  due_date_first: { hex: '#EA002C', bar: 'bg-primary-500' },
  utilization_bal: { hex: '#4F46E5', bar: 'bg-indigo-600' },
  line_recovery: { hex: '#0F766E', bar: 'bg-teal-700' },
};

const RADAR_AXES = ['위험 구제', '신규 차단', '완료 속도', '대기 개선', '부하 균등', '순서 안정'];

/** 납기 위험 완화 UNIT 테이블 — UNIT / 이전 완료 / 이후 완료(+앞당김) */
function DueReliefTable({ items }: { items: DueReliefUnit[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-label-3">
        <thead className="bg-surface-100 text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">UNIT</th>
            <th className="px-3 py-2 text-right font-semibold">이전 완료</th>
            <th className="px-3 py-2 text-right font-semibold">이후 완료</th>
          </tr>
        </thead>
        <tbody>
          {items.map((unit) => (
            <tr key={unit.unit_id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-semibold text-secondary-navy">{unit.unit_id}</td>
              <td className="px-3 py-2 text-right text-gray-500">{unit.before}</td>
              <td className="px-3 py-2 text-right">
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-secondary-navy">{unit.after}</span>
                  <span className="flex items-center gap-0.5 font-semibold text-emerald-600">
                    <ArrowDown className="h-3 w-3" aria-hidden />
                    {formatDelayHours(unit.delta_hr)}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

/** 위험 unit 타일 — 버튼형 사각 디자인. 전: 빨강 경고 / 후: 구제 시 초록 체크, 신규 위험은 후에만 등장 */
function UnitRiskTile({
  unit,
  phase,
  instant,
}: {
  unit: UnitRiskChange;
  phase: ComparePhase;
  instant: boolean;
}) {
  if (phase === 'before' && unit.is_new) return null; // 조정 전에는 위험이 아니던 unit
  const safe = phase === 'after' && unit.relieved;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-label-2 font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.05)] ${
        instant ? 'transition-none' : 'transition-colors duration-500'
      } ${
        safe
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      } ${unit.is_new && phase === 'after' ? 'animate-pulse' : ''}`}
    >
      {safe ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
      )}
      {unit.unit_id}
      {unit.is_new && phase === 'after' ? <span className="text-[10px] font-bold">신규</span> : null}
    </span>
  );
}

/** 전/후 변화량 칩 — 낮을수록 좋은 지표(분)용 */
function DeltaChip({
  before,
  after,
  phase,
  unit,
}: {
  before: number;
  after: number;
  phase: ComparePhase;
  unit: string;
}) {
  if (phase === 'before') {
    return (
      <Chip variant="subtle" color="gray" size="xs">
        기준
      </Chip>
    );
  }
  const diff = after - before;
  if (diff === 0) {
    return (
      <Chip variant="subtle" color="gray" size="xs">
        ±0{unit}
      </Chip>
    );
  }
  return (
    <Chip variant="subtle" color={diff < 0 ? 'emerald' : 'red'} size="xs" className="font-bold">
      {diff < 0 ? (
        <ArrowDown className="h-3 w-3" aria-hidden />
      ) : (
        <ArrowUp className="h-3 w-3" aria-hidden />
      )}
      {Math.abs(diff)}
      {unit}
    </Chip>
  );
}

/** 비교 파트 행 — 좌측 라벨(아이콘+짧은 단어, 1등이면 별 표시) / 우측 시각화 */
function CompareRow({
  icon: Icon,
  label,
  best = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  best?: boolean; // 전략 중 이 파트 1등
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-gray-100 py-4 first:pt-1 last:border-b-0 last:pb-1 sm:flex-row sm:gap-5">
      <span className="flex shrink-0 items-center gap-1.5 self-start text-label-2 font-bold text-secondary-navy sm:w-[110px]">
        <Icon className="h-4 w-4 text-gray-400" aria-hidden />
        {label}
        {best ? (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label="전략 중 최고" />
        ) : null}
      </span>
      <div className="min-w-0 w-full flex-1 self-center">{children}</div>
    </div>
  );
}

export default function RescheduleDetailPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const group = rescheduleGroups.find((item) => item.group_id === groupId) ?? null;

  const recommendedKey =
    rescheduleStrategies.find((strategy) => strategy.recommended)?.key ??
    rescheduleStrategies[0].key;
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>(recommendedKey);
  const [phase, setPhase] = useState<ComparePhase>('before');
  const [snap, setSnap] = useState(false); // true면 전환 애니메이션 없이 즉시 반영
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [dueReliefModalOpen, setDueReliefModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changeTab, setChangeTab] = useState<'queue' | 'schedule'>('queue');

  // 첫 진입 시 전→후 변화를 자동 재생
  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('after'), 700);
    return () => window.clearTimeout(timer);
  }, []);

  // 조정 전 상태는 애니메이션 없이 즉시 보여주고, 조정 후로 갈 때만 애니메이션
  const replay = () => {
    setSnap(true);
    setPhase('before');
    window.setTimeout(() => {
      setSnap(false);
      setPhase('after');
    }, 500);
  };

  // 전략 전환 시에도 전→후 변화를 자동 재생
  const selectStrategy = (key: StrategyKey) => {
    setSelectedStrategy(key);
    replay();
  };

  const activeIndex = Math.max(
    0,
    rescheduleStrategies.findIndex((strategy) => strategy.key === selectedStrategy)
  );
  const activeStrategy = rescheduleStrategies[activeIndex];
  const { compare } = activeStrategy;
  const accent = STRATEGY_ACCENTS[activeStrategy.key];
  const strategyLabel = (index: number) => String.fromCharCode(65 + index); // 0→A, 1→B, 2→C

  const isBest = (key: StrategyBest) => compare.bests.includes(key);

  const radarSeries = rescheduleStrategies.map((strategy) => ({
    key: strategy.key,
    name: strategy.name,
    color: STRATEGY_ACCENTS[strategy.key].hex,
    values: strategy.compare.radar,
  }));

  const reasons = group ? (riskReasonsByFactor[group.risk_factor] ?? []) : [];

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
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
            {selectedDistrict !== 'all' ? (
              <>
                <span className="text-gray-300">›</span>
                <span className="text-gray-400">{districtLabels[selectedDistrict]}</span>
              </>
            ) : null}
            <span className="text-gray-300">›</span>
            <span className="text-secondary-navy">{groupId}</span>
          </div>
        </div>

        {group === null ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
            해당 재조정안을 찾을 수 없습니다.
          </div>
        ) : (
          <>
            {/* 상단: 위험 내용 / 원인 설명 / 영향 UNIT */}
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* 위험 내용 */}
              <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Chip variant="outline" size="sm">{`구역${group.district_id}`}</Chip>
                    <Chip variant="outline" size="sm">
                      {group.process_step}
                    </Chip>
                  </div>
                  <Chip variant="subtle" color={statusChipColor(group.group_status)} size="md">
                    {statusLabel(group.group_status)}
                  </Chip>
                </div>

                <div className="flex items-center gap-2.5">
                  <Chip
                    variant="solid"
                    color={riskChipColor(group.risk_level)}
                    size="md"
                    className="font-bold"
                  >
                    {group.risk_level.toUpperCase()}
                  </Chip>
                  <div className="text-subtitle-2 font-bold text-secondary-navy">
                    {group.group_id} {group.risk_factor}
                  </div>
                </div>
              </div>

              {/* 원인 설명 (별도 카드, 제목 없음) */}
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {reasons.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {reasons.map((reason) => (
                      <li
                        key={reason}
                        className="flex gap-1.5 text-label-3 leading-snug text-gray-600"
                      >
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-label-3 text-gray-400">원인 정보가 없습니다.</p>
                )}
              </div>

              {/* 영향 UNIT — 개수 + 자세히 보기 */}
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:w-[200px] lg:shrink-0">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-label-1 font-bold text-secondary-navy">영향 UNIT</h3>
                  <span>
                    <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                      {group.affected_units.length}
                    </span>
                    <span className="ml-0.5 text-label-3 text-gray-400">개</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(true)}
                  className="mt-auto rounded-lg border border-gray-200 px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
                >
                  자세히 보기
                </button>
              </div>
            </div>

            {/* 전략 비교 — 전략 칩 + 전/후 토글, 좌 레이더 / 우 선택 전략 전후 비교 */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* 전략 선택 칩 */}
                <div className="flex flex-wrap items-center gap-2">
                  {rescheduleStrategies.map((strategy) => {
                    const active = strategy.key === selectedStrategy;
                    const hex = STRATEGY_ACCENTS[strategy.key].hex;
                    return (
                      <button
                        key={strategy.key}
                        type="button"
                        onClick={() => selectStrategy(strategy.key)}
                        aria-pressed={active}
                        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-label-2 font-bold transition ${
                          active
                            ? ''
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
                        }`}
                        style={
                          active
                            ? { borderColor: hex, color: hex, backgroundColor: `${hex}14` }
                            : undefined
                        }
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: hex }}
                          aria-hidden
                        />
                        {strategy.name}
                        {strategy.recommended ? (
                          <Chip variant="subtle" color="primary" size="xs" className="font-bold">
                            추천
                          </Chip>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* 다시 보기 + 전/후 토글 */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={replay}
                    aria-label="전후 변화 다시 보기"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-surface-100 hover:text-secondary-navy"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
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
                    axes={RADAR_AXES}
                    series={radarSeries}
                    selectedKey={selectedStrategy}
                    onSelect={(key) => selectStrategy(key as StrategyKey)}
                    className="w-full"
                  />
                </div>

                {/* 선택 전략 전/후 비교 */}
                <div className="w-full flex-1 lg:border-l lg:border-gray-100 lg:pl-6">
                  <CompareRow icon={ShieldAlert} label="위험 유닛" best={isBest('rescue')}>
                    <div className="flex flex-wrap items-center gap-2">
                      {compare.units.map((unit) => (
                        <UnitRiskTile
                          key={unit.unit_id}
                          unit={unit}
                          phase={phase}
                          instant={snap}
                        />
                      ))}
                    </div>
                  </CompareRow>

                  <CompareRow icon={Timer} label="평균 대기" best={isBest('wait')}>
                    <div className="flex items-center gap-2.5">
                      <BeforeAfterBar
                        before={compare.wait_before_min}
                        after={compare.wait_after_min}
                        phase={phase}
                        max={80}
                        unit="분"
                        barClassName={accent.bar}
                        instant={snap}
                        className="flex-1"
                      />
                      <DeltaChip
                        before={compare.wait_before_min}
                        after={compare.wait_after_min}
                        phase={phase}
                        unit="분"
                      />
                    </div>
                  </CompareRow>

                  <CompareRow icon={Gauge} label="장비 가동률" best={isBest('balance')}>
                    <div className="flex items-end gap-7">
                      {compare.utils.map((util) => (
                        <BeforeAfterColumn
                          key={util.machine}
                          label={util.machine}
                          before={util.util_before}
                          after={util.util_after}
                          phase={phase}
                          barClassName={accent.bar}
                          instant={snap}
                        />
                      ))}
                      <span className="pb-6 text-label-3 text-gray-400">
                        {compare.util_summary}
                      </span>
                    </div>
                  </CompareRow>
                </div>
              </div>
            </div>

            {/* 하단: 변경 상세 탭 + 납기 위험 완화 */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
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

              <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:w-[340px] lg:shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-label-1 font-bold text-gray-500">납기 위험 완화 UNIT</h3>
                  <span className="text-label-3 text-gray-400">
                    {activeStrategy.detail.dueRelief.length}건
                  </span>
                </div>
                <DueReliefTable items={activeStrategy.detail.dueRelief.slice(0, 2)} />
                {activeStrategy.detail.dueRelief.length >= 3 ? (
                  <button
                    type="button"
                    onClick={() => setDueReliefModalOpen(true)}
                    className="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
                  >
                    자세히 보기 (외 {activeStrategy.detail.dueRelief.length - 2}건)
                  </button>
                ) : null}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-2">
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
                className="rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600"
              >
                재조정안{strategyLabel(activeIndex)} 승인
              </button>
            </div>

            {/* 영향 UNIT 상세 모달 */}
            <Modal
              open={unitModalOpen}
              onClose={() => setUnitModalOpen(false)}
              title={`영향 UNIT (${group.affected_units.length}개)`}
            >
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
                        <td className="px-3 py-2 text-right text-gray-700">{unit.risk_score}</td>
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
            </Modal>

            {/* 납기 위험 완화 UNIT 전체 모달 */}
            <Modal
              open={dueReliefModalOpen}
              onClose={() => setDueReliefModalOpen(false)}
              title={`납기 위험 완화 UNIT (${activeStrategy.detail.dueRelief.length}건)`}
            >
              <DueReliefTable items={activeStrategy.detail.dueRelief} />
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
                  {group.group_id}의 재조정 효과 분석
                </p>
                <p>{activeStrategy.detail.summary}</p>
                <p className="text-gray-400">상세 AI 분석 리포트는 추후 추가됩니다.</p>
              </div>
            </Modal>

            {/* 재조정안 승인 확인 모달 */}
            <ConfirmModal
              open={approveModalOpen}
              title={`재조정안${strategyLabel(activeIndex)}를 승인하시겠습니까?`}
              description={`승인 시 현재 시점에서 가능한 재조정안인지 검증한 후 곧바로 스케줄 변경이 적용됩니다.`}
              cancelLabel="취소"
              confirmLabel="승인"
              onClose={() => setApproveModalOpen(false)}
              onConfirm={() => {
                setApproveModalOpen(false);
                navigate('/dashboard');
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}
