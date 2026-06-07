import { useRef, useState } from 'react';

import { ChevronRight } from 'lucide-react';

import { DashboardInfoCard, MachineScheduleGanttBoard, StepSelector } from '@components/common';
import { MachineFleetBoard } from '@components/three';
import { useDistrictStore } from '@/stores';

import { districtDashboards, districtLabels, type DistrictDashboardData } from './dashboardMock';

const STEP_LOCK_MS = 720;

/** 한 구역의 대시보드 본문: 요약 카드 + step 셀렉터 + 3D 보드(+간트) */
function DistrictDashboard({ data }: { data: DistrictDashboardData }) {
  const steps = data.steps;
  const stepOptions = steps.map((step) => ({ id: step.step_id, label: step.process_step }));

  const [selectedStepId, setSelectedStepId] = useState(steps[0].step_id);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const lockedRef = useRef(false);

  const activeStep = steps.find((step) => step.step_id === selectedStepId) ?? steps[0];

  const fleetQueue = {
    waiting_units: activeStep.machines.flatMap((machine) =>
      machine.units.map((unit) => unit.unit_id)
    ),
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
            <MachineScheduleGanttBoard startHour={8} endHour={18} schedules={activeStep.machines} />
          }
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full max-w-7xl flex-col gap-4">
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

        {isAll ? null : (
          <DistrictDashboard key={selectedDistrict} data={districtDashboards[selectedDistrict]} />
        )}
      </div>
    </section>
  );
}
