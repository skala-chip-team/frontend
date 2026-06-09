import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Chip,
  CircularProgress,
  ConfirmModal,
  Modal,
  ScheduleChangeGantt,
} from '@components/common';
import { rescheduleGroups, rescheduleStrategies, riskReasonsByFactor } from '@/mocks';
import { useDistrictStore } from '@/stores';
import { formatDelayHours, riskChipColor, statusChipColor, statusLabel } from '@/utils';
import type { DueReliefUnit, RescheduleStrategy, StrategyKey, StrategyMetric } from '@/types';

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

/** 핵심 효과 카드 — before→value + 변화량(있을 때) / 없으면 값만(ex. 납기 위험 완화) */
function MetricCard({ metric }: { metric: StrategyMetric }) {
  if (metric.before === undefined) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white p-3.5">
        <p className="text-label-3 text-gray-400">{metric.label}</p>
        <p className="mt-1.5 text-[1.375rem] font-bold leading-none text-secondary-navy">
          {metric.value}
        </p>
      </div>
    );
  }

  const deltaColor =
    metric.sentiment === 'bad'
      ? 'text-red-600'
      : metric.sentiment === 'neutral'
        ? 'text-gray-500'
        : 'text-emerald-600';
  const Icon =
    metric.direction === 'up' ? TrendingUp : metric.direction === 'down' ? TrendingDown : Minus;
  // '증가/감소/단축' 등 방향 단어는 아이콘으로 대체하고 수치만 표시
  const deltaValue = (metric.deltaLabel ?? '').replace(/\s*(증가|감소|단축)$/, '');

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5">
      <p className="text-label-3 text-gray-400">{metric.label}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-label-3 text-gray-400">{metric.before}</span>
        <span className="text-label-3 text-gray-300">→</span>
        <span className="text-[1.375rem] font-bold leading-none text-secondary-navy">
          {metric.value}
        </span>
        <span className={`flex items-center gap-0.5 text-label-3 font-semibold ${deltaColor}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {deltaValue}
        </span>
      </div>
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

/** 전략 카드 — 재조정안 라벨(A/B/C) + 이름 + (추천 시 Recommend 칩), 주요 효과 */
function StrategyCard({
  strategy,
  label,
  active,
  onSelect,
}: {
  strategy: RescheduleStrategy;
  label: string; // 재조정안 라벨 (A/B/C)
  active: boolean;
  onSelect: () => void;
}) {
  const { effect } = strategy;
  const TrendIcon = effect.deltaDirection === 'up' ? TrendingUp : TrendingDown;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition ${
        active
          ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-label-3 font-bold ${
            active ? 'bg-primary-500 text-white' : 'bg-secondary-navy/10 text-secondary-navy'
          }`}
        >
          {label}
        </span>
        <span className="text-subtitle-2 font-bold text-secondary-navy">{strategy.name}</span>
        {strategy.recommended ? (
          <Chip variant="subtle" color="primary" size="xs" className="font-bold">
            Recommend
          </Chip>
        ) : null}
      </div>

      <div>
        <p className="text-label-3 text-gray-400">{effect.metricLabel}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <span className="text-subtitle-1 font-bold text-secondary-navy">
            {effect.before} <span className="text-gray-300">→</span> {effect.after}
          </span>
          <span className="flex items-center gap-1 text-label-2 font-semibold text-emerald-600">
            <TrendIcon className="h-4 w-4" aria-hidden />
            {effect.deltaLabel}
          </span>
        </div>
      </div>
    </button>
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
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [dueReliefModalOpen, setDueReliefModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changeTab, setChangeTab] = useState<'queue' | 'schedule'>('queue');
  const activeIndex = Math.max(
    0,
    rescheduleStrategies.findIndex((strategy) => strategy.key === selectedStrategy)
  );
  const activeStrategy = rescheduleStrategies[activeIndex];
  const strategyLabel = (index: number) => String.fromCharCode(65 + index); // 0→A, 1→B, 2→C

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
                <span className="text-gray-400">{`구역${selectedDistrict}`}</span>
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

            {/* 전략 상세: 좌측 전략 목록(좁게) / 우측 상세(추후, 넓게) */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex flex-col gap-2.5 lg:w-[300px] lg:shrink-0">
                <h2 className="text-subtitle-2 font-bold text-secondary-navy">재조정 전략</h2>
                {rescheduleStrategies.map((strategy, index) => (
                  <StrategyCard
                    key={strategy.key}
                    strategy={strategy}
                    label={strategyLabel(index)}
                    active={strategy.key === selectedStrategy}
                    onSelect={() => setSelectedStrategy(strategy.key)}
                  />
                ))}
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {/* 핵심 효과 */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <h3 className="mb-2 text-label-1 font-bold text-gray-500">핵심 효과</h3>
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {activeStrategy.detail.metrics.map((metric) => (
                      <MetricCard key={metric.label} metric={metric} />
                    ))}
                  </div>
                </div>

                {/* 장비별 부하율 */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <h3 className="mb-3 text-label-1 font-bold text-gray-500">장비별 부하율</h3>
                  <div className="flex flex-wrap items-start justify-around gap-6">
                    {activeStrategy.detail.schedule.map((row) => (
                      <div key={row.machine} className="flex flex-col items-center gap-2">
                        <CircularProgress value={row.load_after}>
                          <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                            {row.load_after}%
                          </span>
                          <span className="mt-1 text-caption-2 font-medium text-gray-400">
                            이전 {row.load_before}%
                          </span>
                        </CircularProgress>
                        <span className="text-label-3 font-semibold text-secondary-navy">
                          {row.machine}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 변경사항(요약) + 납기 위험 완화 UNIT — 같은 줄 */}
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex flex-1 flex-col rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                    <h3 className="mb-2 text-label-1 font-bold text-gray-500">변경사항</h3>
                    <p className="flex-1 rounded-xl bg-surface-100 px-4 py-3 text-body-2 leading-relaxed text-secondary-navy">
                      {activeStrategy.detail.summary}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
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

                {/* 변경 상세 탭 (풀폭) */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
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
                          <p className="mb-2 text-label-3 font-semibold text-gray-400">
                            이전 대기열
                          </p>
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
              </div>
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
