import { useRef, useState, type ReactNode } from 'react';

import { ChevronRight } from 'lucide-react';

import {
  DashboardInfoCard,
  MachineScheduleGanttBoard,
  OverviewDashboard,
  StepSelector,
} from '@components/common';
import { MachineFleetBoard } from '@components/three';
import { districtLabels, useDistrictStore } from '@/stores';
import { useDistrictDashboard, useSimStatus } from '@/hooks';
import type { DistrictDashboardData } from '@/types';

const STEP_LOCK_MS = 720;

/** 'YYYY-MM-DDTHH:MM:SS' → 시(소수). 시뮬레이션 시각을 간트 현재선 위치로 변환 */
function isoToHour(iso: string): number {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  return h + m / 60;
}

/** 한 구역의 대시보드 본문: 요약 카드 + step 셀렉터 + 3D 보드(+간트) */
function DistrictDashboard({
  data,
  currentHour,
}: {
  data: DistrictDashboardData;
  currentHour?: number;
}) {
  const steps = data.steps;
  const stepOptions = steps.map((step) => ({ id: step.step_id, label: step.process_step }));

  const [selectedStepId, setSelectedStepId] = useState(steps[0].step_id);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const lockedRef = useRef(false);

  const activeStep = steps.find((step) => step.step_id === selectedStepId) ?? steps[0];

  // 대기열은 실제 by-step 큐 기준(완료된 unit은 빠짐). 간트 막대(완료 포함)에서 만들지 않는다.
  const fleetQueue = {
    waiting_units: activeStep.waiting_units,
    avg_wait_time_min: activeStep.avg_wait_time_min,
  };

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

      <StepSelector steps={stepOptions} selectedId={selectedStepId} onSelect={handleSelectStep} />

      <div className="h-[560px] w-full lg:h-[700px]">
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
              />
            </div>
          }
        />
      </div>
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

  const { data, isLoading, isError } = useDistrictDashboard(
    selectedDistrict,
    simDate,
    sim?.is_running ?? false
  );

  const renderBody = () => {
    if (isAll) return <OverviewDashboard />;
    if (isLoading) return <DashboardMessage>대시보드를 불러오는 중…</DashboardMessage>;
    if (isError) return <DashboardMessage>대시보드를 불러오지 못했습니다.</DashboardMessage>;
    if (!data || data.steps.length === 0) {
      return <DashboardMessage>표시할 데이터가 없습니다.</DashboardMessage>;
    }
    return <DistrictDashboard key={selectedDistrict} data={data} currentHour={simHour} />;
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
