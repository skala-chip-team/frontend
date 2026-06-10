import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, Minus, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Chip, ConfirmModal, Modal, ScheduleChangeGantt } from '@components/common';
import { districtLabels, useDistrictStore } from '@/stores';
import {
  useGenerateReschedule,
  useRescheduleDetail,
  useSelectRescheduleStrategy,
} from '@/hooks';
import {
  buildRescheduleDetail,
  formatDelayHours,
  getApiErrorMessage,
  riskChipColor,
  statusChipColor,
  statusLabel,
} from '@/utils';
import type { RescheduleAffectedUnitVM, StrategyMetric, StrategyVM } from '@/types';

/** 핵심 효과 카드 — API는 after 값만 주므로 값만 표시(비교 없음) */
function MetricCard({ metric }: { metric: StrategyMetric }) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5">
      <p className="text-label-3 text-gray-400">{metric.label}</p>
      <p className="mt-1.5 text-[1.375rem] font-bold leading-none text-secondary-navy">
        {metric.value}
      </p>
    </div>
  );
}

/** 대기열 행 — 번호 원형 + 칩, 이후 대기열은 순위 변동 표시 */
function QueueRow({
  unitId,
  position,
  affected,
  delta,
}: {
  unitId: string;
  position: number;
  affected: boolean;
  delta?: number;
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
          <span className={`text-[12px] text-secondary-navy ${affected ? 'font-bold' : 'font-semibold'}`}>
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

function QueueList({
  order,
  affected,
  beforeOrder,
}: {
  order: string[];
  affected: string[];
  beforeOrder?: string[];
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

/** 전략 카드 — 라벨(A/B/C) + 이름 + 추천/확정 배지 + 대표 수치(after) */
function StrategyCard({
  strategy,
  label,
  active,
  onSelect,
}: {
  strategy: StrategyVM;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
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
      <div className="flex flex-wrap items-center gap-2">
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
        {strategy.selected ? (
          <Chip variant="subtle" color="emerald" size="xs" className="font-bold">
            확정됨
          </Chip>
        ) : null}
        {!strategy.usable ? (
          <Chip variant="subtle" color="gray" size="xs">
            재생성 필요
          </Chip>
        ) : null}
      </div>

      {strategy.headline ? (
        <div>
          <p className="text-label-3 text-gray-400">{strategy.headline.label}</p>
          <p className="mt-1 text-subtitle-1 font-bold text-secondary-navy">
            {strategy.headline.value}
          </p>
        </div>
      ) : (
        <p className="text-label-3 text-gray-400">수치 미생성</p>
      )}
    </button>
  );
}

/** 영향 UNIT 테이블(모달) */
function AffectedUnitsTable({ units }: { units: RescheduleAffectedUnitVM[] }) {
  return (
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
          {units.map((unit) => (
            <tr key={unit.unit_id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-semibold text-secondary-navy">{unit.unit_id}</td>
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
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
      {children}
    </div>
  );
}

export default function RescheduleDetailPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);

  const { data, isLoading, isError } = useRescheduleDetail(groupId);
  const generate = useGenerateReschedule(groupId ?? '');
  const select = useSelectRescheduleStrategy(groupId ?? '');

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changeTab, setChangeTab] = useState<'queue' | 'schedule'>('queue');

  const detail = data ? buildRescheduleDetail(data) : null;
  const strategies = detail?.strategies ?? [];
  const activeStrategy =
    strategies.find((s) => s.key === selectedKey) ??
    strategies.find((s) => s.recommended) ??
    strategies[0];
  const activeIndex = activeStrategy ? strategies.indexOf(activeStrategy) : 0;
  const strategyLabel = (index: number) => String.fromCharCode(65 + index); // 0→A

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 뒤로 + 브레드크럼 */}
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

        {isLoading ? (
          <Message>재조정안을 불러오는 중…</Message>
        ) : isError || !detail ? (
          <Message>해당 재조정안을 불러오지 못했습니다.</Message>
        ) : (
          <>
            {/* 상단: 위험 내용 / 원인 / 영향 UNIT */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Chip variant="outline" size="sm">
                      {detail.header.districtLabel}
                    </Chip>
                    <Chip variant="outline" size="sm">
                      {detail.header.process_step}
                    </Chip>
                  </div>
                  <Chip variant="subtle" color={statusChipColor(detail.header.group_status)} size="md">
                    {statusLabel(detail.header.group_status)}
                  </Chip>
                </div>

                <div className="flex items-center gap-2.5">
                  <Chip
                    variant="solid"
                    color={riskChipColor(detail.header.risk_level)}
                    size="md"
                    className="font-bold"
                  >
                    {detail.header.risk_level.toUpperCase()}
                  </Chip>
                  <div className="text-subtitle-2 font-bold text-secondary-navy">
                    {detail.header.group_id} {detail.header.risk_factor}
                  </div>
                </div>
              </div>

              {/* 원인 설명 — riskAnalysis 근거 */}
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {detail.reasons.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {detail.reasons.map((reason) => (
                      <li key={reason} className="flex gap-1.5 text-label-3 leading-snug text-gray-600">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-label-3 text-gray-400">원인 분석 정보가 아직 없습니다.</p>
                )}
              </div>

              {/* 영향 UNIT */}
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:w-[200px] lg:shrink-0">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-label-1 font-bold text-secondary-navy">영향 UNIT</h3>
                  <span>
                    <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                      {detail.affectedUnits.length}
                    </span>
                    <span className="ml-0.5 text-label-3 text-gray-400">개</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(true)}
                  disabled={detail.affectedUnits.length === 0}
                  className="mt-auto rounded-lg border border-gray-200 px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100 disabled:opacity-40"
                >
                  자세히 보기
                </button>
              </div>
            </div>

            {strategies.length === 0 || !activeStrategy ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                <p className="text-body-2 text-gray-500">아직 생성된 재조정안이 없습니다.</p>
                <GenerateButton generate={generate} />
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* 좌측 전략 목록 */}
                <div className="flex flex-col gap-2.5 lg:w-[300px] lg:shrink-0">
                  <h2 className="text-subtitle-2 font-bold text-secondary-navy">재조정 전략</h2>
                  {strategies.map((strategy, index) => (
                    <StrategyCard
                      key={strategy.key}
                      strategy={strategy}
                      label={strategyLabel(index)}
                      active={strategy.key === activeStrategy.key}
                      onSelect={() => setSelectedKey(strategy.key)}
                    />
                  ))}
                </div>

                {/* 우측 상세 */}
                <div className="flex flex-1 flex-col gap-4">
                  {/* fallback 안내 */}
                  {!activeStrategy.usable ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-label-2 text-amber-700">
                        이 전략은 재조정안이 완전히 생성되지 않았습니다.
                        {activeStrategy.fallbackReason ? ` (${activeStrategy.fallbackReason})` : ''} 재생성 후
                        승인할 수 있습니다.
                      </p>
                      <GenerateButton generate={generate} />
                    </div>
                  ) : null}

                  {/* 핵심 효과 */}
                  {activeStrategy.metrics.length > 0 ? (
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                      <h3 className="mb-2 text-label-1 font-bold text-gray-500">핵심 효과 (적용 후)</h3>
                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {activeStrategy.metrics.map((metric) => (
                          <MetricCard key={metric.label} metric={metric} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 변경사항 요약 */}
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                    <h3 className="mb-2 text-label-1 font-bold text-gray-500">변경사항</h3>
                    <p className="rounded-xl bg-surface-100 px-4 py-3 text-body-2 leading-relaxed text-secondary-navy">
                      {activeStrategy.summary || '요약 정보가 없습니다.'}
                    </p>
                  </div>

                  {/* 변경 상세 탭 */}
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
                        activeStrategy.queue.after.length > 0 ? (
                          <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                              <p className="mb-2 text-label-3 font-semibold text-gray-400">이전 대기열</p>
                              <QueueList
                                order={activeStrategy.queue.before}
                                affected={activeStrategy.queue.affected}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="mb-2 text-label-3 font-semibold text-primary-600">이후 대기열</p>
                              <QueueList
                                order={activeStrategy.queue.after}
                                affected={activeStrategy.queue.affected}
                                beforeOrder={activeStrategy.queue.before}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="py-6 text-center text-label-2 text-gray-400">
                            대기열 변경 내용이 없습니다.
                          </p>
                        )
                      ) : activeStrategy.schedule.length > 0 ? (
                        <ScheduleChangeGantt
                          rows={activeStrategy.schedule}
                          startHour={activeStrategy.scheduleWindow.start}
                          endHour={activeStrategy.scheduleWindow.end}
                        />
                      ) : (
                        <p className="py-6 text-center text-label-2 text-gray-400">
                          스케줄 변경 내용이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 선택 실패 안내 — 백엔드 message 노출 */}
                  {select.isError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-label-2 text-red-600">
                      {getApiErrorMessage(
                        select.error,
                        '승인에 실패했습니다. 만료되었거나 일시적인 오류일 수 있습니다.'
                      )}
                    </p>
                  ) : null}

                  {/* 액션 */}
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
                      disabled={!activeStrategy.usable || select.isPending}
                      className="rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {select.isPending
                        ? '승인 처리 중…'
                        : `재조정안${strategyLabel(activeIndex)} 승인`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 영향 UNIT 모달 */}
            <Modal
              open={unitModalOpen}
              onClose={() => setUnitModalOpen(false)}
              title={`영향 UNIT (${detail.affectedUnits.length}개)`}
            >
              <AffectedUnitsTable units={detail.affectedUnits} />
            </Modal>

            {/* AI 리포트 모달 — 원인분석 + 요약 */}
            <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)} title="AI 리포트">
              <div className="flex flex-col gap-3 text-body-2 leading-relaxed text-gray-600">
                {activeStrategy ? (
                  <p className="rounded-xl bg-surface-100 px-4 py-3 font-semibold text-secondary-navy">
                    재조정안{strategyLabel(activeIndex)} ({activeStrategy.name}) 적용 시{' '}
                    {detail.header.group_id}의 재조정 효과 분석
                  </p>
                ) : null}
                {activeStrategy?.summary ? <p>{activeStrategy.summary}</p> : null}
                {detail.reasons.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {detail.reasons.map((reason) => (
                      <li key={reason} className="flex gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">원인 분석 정보가 없습니다.</p>
                )}
              </div>
            </Modal>

            {/* 승인 확인 모달 */}
            <ConfirmModal
              open={approveModalOpen}
              title={`재조정안${strategyLabel(activeIndex)}를 승인하시겠습니까?`}
              description="승인 시 선택한 전략이 대기열·스케줄에 실제로 반영됩니다."
              cancelLabel="취소"
              confirmLabel="승인"
              onClose={() => setApproveModalOpen(false)}
              onConfirm={() => {
                if (!activeStrategy) return;
                select.mutate(activeStrategy.key, {
                  onSuccess: () => {
                    setApproveModalOpen(false);
                    navigate('/dashboard');
                  },
                  onError: () => setApproveModalOpen(false),
                });
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}

/** 재생성 버튼 (에이전트 재호출, 최대 2분) */
function GenerateButton({ generate }: { generate: ReturnType<typeof useGenerateReschedule> }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => generate.mutate()}
        disabled={generate.isPending}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${generate.isPending ? 'animate-spin' : ''}`} aria-hidden />
        {generate.isPending ? '재생성 중… (최대 2분)' : '재생성'}
      </button>
      {generate.isError ? (
        <span className="max-w-[260px] text-right text-caption-1 text-red-600">
          {getApiErrorMessage(generate.error, '재생성에 실패했습니다. 잠시 후 다시 시도해주세요.')}
        </span>
      ) : null}
    </div>
  );
}
