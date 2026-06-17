import { useRef, useState, type ReactNode } from 'react';

import { ChevronRight, RefreshCw, TriangleAlert } from 'lucide-react';

import {
  Board3DSkeleton,
  DashboardInfoCard,
  MachineScheduleGanttBoard,
  OverviewDashboard,
  ProductionAchievementBar,
  StepSelector,
} from '@components/common';
import { MachineFleetBoard } from '@components/three';
import { districtLabels, useDistrictStore } from '@/stores';
import {
  useApprovedRescheduleUnitIds,
  useDeferredMount,
  useDistrictDashboard,
  useSimStatus,
} from '@/hooks';
import type { DistrictDashboardData } from '@/types';

const STEP_LOCK_MS = 720;

/** 'YYYY-MM-DDTHH:MM:SS' → 시(소수). 시뮬레이션 시각을 간트 현재선 위치로 변환 */
function isoToHour(iso: string): number {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  return h + m / 60;
}

/** 한 구역의 대시보드 본문: 요약 카드 + step 셀렉터 + 3D 보드(+간트) */
/** 재시도 버튼 — 부분/전체 실패 안내에 공통 사용 */
function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
    >
      <RefreshCw className="h-4 w-4" aria-hidden />
      재시도
    </button>
  );
}

/** 일부 데이터 조회 실패 배너 — 누락 섹션을 '조회 실패'로 표시 + 재시도 */
function PartialFailureBanner({ sections, onRetry }: { sections: string[]; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <TriangleAlert className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-label-1 font-bold text-amber-800">일부 데이터 조회 실패</span>
        <span className="text-label-2 text-amber-700">
          {sections.join(', ')} — 조회 실패. 나머지는 정상 표시됩니다.
        </span>
      </div>
      {onRetry ? <RetryButton onClick={onRetry} /> : null}
    </div>
  );
}

/** 한 섹션이 조회 실패해 자리에 표시하는 플레이스홀더 */
function SectionFailure({ label, onRetry }: { label: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 text-body-2 text-amber-700">
      <span className="font-semibold">{label} 조회 실패</span>
      {onRetry ? <RetryButton onClick={onRetry} /> : null}
    </div>
  );
}

function DistrictDashboard({
  data,
  currentHour,
  highlightUnitIds,
  failedSections,
  onRetry,
}: {
  data: DistrictDashboardData;
  currentHour?: number;
  highlightUnitIds?: Set<string>;
  failedSections?: string[];
  onRetry?: () => void;
}) {
  const steps = data.steps;
  const stepOptions = steps.map((step) => ({ id: step.step_id, label: step.process_step }));
  // 무거운 3D 보드는 라우트 진입 후 페인트가 끝나면 마운트(사이드바 등 즉시 반응 보장)
  const mount3D = useDeferredMount();

  // 간트(steps) 조회 실패 시 steps가 비어 있을 수 있다 → 옵셔널로 방어
  const [selectedStepId, setSelectedStepId] = useState(steps[0]?.step_id ?? '');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const lockedRef = useRef(false);

  const activeStep = steps.find((step) => step.step_id === selectedStepId) ?? steps[0];

  // 대기열은 실제 by-step 큐 기준(완료된 unit은 빠짐). 간트 막대(완료 포함)에서 만들지 않는다.
  const fleetQueue = activeStep
    ? { waiting_units: activeStep.waiting_units, avg_wait_time_min: activeStep.avg_wait_time_min }
    : { waiting_units: [], avg_wait_time_min: 0 };

  const handleSelectStep = (id: string) => {
    if (id === selectedStepId || lockedRef.current) return;

    const currentIndex = steps.findIndex((step) => step.step_id === selectedStepId);
    const nextIndex = steps.findIndex((step) => step.step_id === id);
    setSlideDirection(nextIndex > currentIndex ? 1 : -1);
    setSelectedStepId(id);

    // 전환이 끝날 때까지 연타 방지
    lockedRef.current = true;
    window.setTimeout(() => {
      lockedRef.current = false;
    }, STEP_LOCK_MS);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* 부분 조회 실패 안내 */}
      {failedSections && failedSections.length > 0 ? (
        <PartialFailureBanner sections={failedSections} onRetry={onRetry} />
      ) : null}

      {/* 오늘 생산 달성률 — 카드 묶음 위 가로 슬림 바 (summary 실적/목표 연동) */}
      <ProductionAchievementBar
        current={data.daily_output_qty}
        target={data.daily_target_output_qty}
        rate={data.achievement_rate}
      />

      <div className="flex flex-wrap gap-3">
        {data.summaryCards.map((card) => (
          <DashboardInfoCard
            key={card.label}
            className="min-w-[180px] flex-1"
            label={card.label}
            value={card.value}
            unit={card.unit}
            icon={card.icon}
          />
        ))}
      </div>

      {activeStep ? (
        <>
          <StepSelector
            steps={stepOptions}
            selectedId={selectedStepId}
            onSelect={handleSelectStep}
          />

          <div className="h-[560px] w-full lg:h-[700px]">
            {mount3D ? (
              <MachineFleetBoard
                machines={activeStep.machines}
                queue={fleetQueue}
                slideDirection={slideDirection}
                bottomPanel={
                  // 장비 4대까지 스크롤 없이 보이고, 5대부터 내부 세로 스크롤
                  <div className="h-[16.5rem]">
                    <MachineScheduleGanttBoard
                      startHour={0}
                      endHour={24}
                      schedules={activeStep.machines}
                      currentHour={currentHour}
                      highlightUnitIds={highlightUnitIds}
                    />
                  </div>
                }
              />
            ) : (
              <Board3DSkeleton />
            )}
          </div>
        </>
      ) : (
        // 간트(장비 스케줄) 조회 실패로 보드를 못 그림 → 자리표시 + 재시도
        <div className="h-[560px] w-full lg:h-[700px]">
          <SectionFailure label="장비 스케줄" onRetry={onRetry} />
        </div>
      )}
    </div>
  );
}

/** 로딩/에러/빈 상태 안내 박스 */
function DashboardMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[320px] w-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-body-1 text-gray-400">
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  // 시뮬레이션 현재 시각: 간트 날짜 필터 + 현재선 위치에 사용
  const { data: sim } = useSimStatus();
  const simIso = sim?.sim_now_iso ?? null;
  const simDate = simIso ? simIso.slice(0, 10) : null;
  const simHour = simIso ? isoToHour(simIso) : undefined;

  const { data, isLoading, isError, refetch } = useDistrictDashboard(
    selectedDistrict,
    simDate,
    sim?.is_running ?? false
  );

  // 승인된 재조정안이 실제 바꾼 unit → 간트 '계획' 탭에서 강조(재조정 반영 표시)
  // summary affectedUnits는 승인 후 비어있을 수 있어 상세(selected 옵션)에서 수집한다.
  const highlightUnitIds = useApprovedRescheduleUnitIds(selectedDistrict);

  const renderBody = () => {
    if (isAll) return <OverviewDashboard />;
    if (isLoading) return <DashboardMessage>대시보드를 불러오는 중…</DashboardMessage>;
    if (isError) {
      return (
        <DashboardMessage>
          <div className="flex flex-col items-center gap-3">
            <span>대시보드를 불러오지 못했습니다.</span>
            <RetryButton onClick={() => refetch()} />
          </div>
        </DashboardMessage>
      );
    }
    // 부분 실패면 steps가 비어도 요약 등 성공한 부분은 보여준다.
    if (!data || (data.steps.length === 0 && !data.failed_sections?.length)) {
      return <DashboardMessage>표시할 데이터가 없습니다.</DashboardMessage>;
    }
    return (
      <DistrictDashboard
        key={selectedDistrict}
        data={data}
        currentHour={simHour}
        highlightUnitIds={highlightUnitIds}
        failedSections={data.failed_sections}
        onRetry={() => refetch()}
      />
    );
  };

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 — 큰 글씨 */}
        <div className="flex items-center gap-2 text-heading-2">
          <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>
            {districtLabels.all}
          </span>
          {!isAll ? (
            <>
              <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
              <span className="text-secondary-navy">{districtLabels[selectedDistrict]}</span>
            </>
          ) : null}
        </div>

        {renderBody()}
      </div>
    </section>
  );
}
