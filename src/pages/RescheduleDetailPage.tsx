import { useState } from 'react';
import { ChevronLeft, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Chip } from '@components/common';
import { rescheduleGroups, rescheduleStrategies, riskReasonsByFactor } from '@/mocks';
import { useDistrictStore } from '@/stores';
import { formatDelayHours, riskChipColor, statusChipColor, statusLabel } from '@/utils';
import type { RescheduleStrategy, StrategyKey, StrategyMetric } from '@/types';

/** 핵심 효과 카드 — before→after + 변화량 델타 칩 */
function MetricCard({ metric }: { metric: StrategyMetric }) {
  const color = metric.sentiment === 'good' ? 'emerald' : metric.sentiment === 'bad' ? 'red' : 'gray';
  const Icon = metric.direction === 'up' ? TrendingUp : metric.direction === 'down' ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5">
      <p className="text-label-3 text-gray-400">{metric.label}</p>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-label-3 text-gray-400">{metric.before}</span>
        <span className="text-label-3 text-gray-300">→</span>
        <span className="text-[1.375rem] font-bold leading-none text-secondary-navy">
          {metric.after}
        </span>
      </div>
      <div className="mt-2">
        <Chip variant="soft" color={color} size="sm" className="font-bold">
          <Icon className="-ml-0.5 h-3.5 w-3.5" aria-hidden />
          {metric.deltaLabel}
        </Chip>
      </div>
    </div>
  );
}

/** 전략 카드 — 이름 + (추천 시 Recommend 칩), 주요 효과(before→after) + 효과 델타 */
function StrategyCard({
  strategy,
  active,
  onSelect,
}: {
  strategy: RescheduleStrategy;
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
  const activeStrategy =
    rescheduleStrategies.find((strategy) => strategy.key === selectedStrategy) ??
    rescheduleStrategies[0];

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
            {/* 상단: 요약 카드 2개 (컴팩트) */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Chip variant="outline" size="sm">{`구역${group.district_id}`}</Chip>
                    <Chip variant="outline" size="sm">
                      {group.process_step}
                    </Chip>
                  </div>
                  <Chip variant="soft" color={statusChipColor(group.group_status)} size="md">
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

                {/* 원인 설명 list */}
                {reasons.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {reasons.map((reason) => (
                      <li key={reason} className="flex gap-2 text-label-2 leading-relaxed text-gray-600">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:w-[300px] lg:shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-label-1 font-bold text-secondary-navy">영향 UNIT</h3>
                  <span className="text-label-3 text-gray-400">{group.affected_units.length}개</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {group.affected_units.map((unit) => (
                    <li
                      key={unit.unit_id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-surface-100/70 px-2.5 py-1.5 text-label-3"
                    >
                      <span className="font-semibold text-secondary-navy">{unit.unit_id}</span>
                      <span className="text-gray-500">
                        지연{' '}
                        <span className="font-semibold text-primary-600">
                          +{formatDelayHours(unit.estimated_delay_hr)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 전략 상세: 좌측 전략 목록(좁게) / 우측 상세(추후, 넓게) */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex flex-col gap-2.5 lg:w-[300px] lg:shrink-0">
                <h2 className="text-subtitle-2 font-bold text-secondary-navy">재조정 전략</h2>
                {rescheduleStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.key}
                    strategy={strategy}
                    active={strategy.key === selectedStrategy}
                    onSelect={() => setSelectedStrategy(strategy.key)}
                  />
                ))}
              </div>

              <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {/* 핵심 내용 한 줄 */}
                <p className="rounded-xl bg-surface-100 px-4 py-3 text-body-2 leading-relaxed text-secondary-navy">
                  {activeStrategy.detail.summary}
                </p>

                {/* 핵심 효과 */}
                <div>
                  <h3 className="mb-2 text-label-1 font-bold text-gray-500">핵심 효과</h3>
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {activeStrategy.detail.metrics.map((metric) => (
                      <MetricCard key={metric.label} metric={metric} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
