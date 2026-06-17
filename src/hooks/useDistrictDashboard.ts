import { useQuery } from '@tanstack/react-query';

import {
  getDistrictGantt,
  getDistrictMachines,
  getDistrictStepQueues,
  getDistrictSummary,
  getDistrictWorkStatus,
} from '@apis/index';
import type {
  DistrictGantt,
  DistrictMachines,
  DistrictStepQueue,
  DistrictSummary,
  WorkStatusItem,
} from '@apis/index';
import { buildDistrictDashboard } from '@/utils';
import type { DistrictDashboardData } from '@/types';

/** 조회 실패 섹션에 끼워 넣을 빈 기본값 (부분 결과로 화면을 그리기 위함) */
const emptySummary = (districtId: string): DistrictSummary => ({
  districtId,
  districtName: null,
  totalMachineCount: 0,
  availableMachineCount: 0,
  downMachineCount: 0,
  avgUtilizationRate: 0,
  totalWaitingUnitCount: 0,
  avgWaitTimeMin: 0,
  dailyOutputQty: 0,
  dailyTargetOutputQty: 0,
  achievementRate: null,
});

/** fulfilled면 값, rejected면 fallback을 쓰고 실패 라벨을 누적 */
function take<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
  label: string,
  failed: string[]
): T {
  if (result.status === 'fulfilled') return result.value;
  failed.push(label);
  return fallback;
}

/**
 * 한 구역의 대시보드 데이터.
 * summary/machines/gantt/by-step/work-status 5개를 병렬 호출해 DistrictDashboardData로 조립한다.
 * 일부만 실패하면 성공한 부분으로 화면을 그리고, 실패 섹션은 data.failed_sections로 알린다(전체 실패 시에만 isError).
 * simDate('YYYY-MM-DD')가 있으면 그 날짜(시뮬레이션 현재일) 스케줄로 간트를 구성한다.
 * districtId === 'all' 이면 비활성화(전체 대시보드는 아직 미연결).
 * live=true(시뮬레이션 진행 중)일 때만 3초마다 갱신하고, 끝나면 폴링을 멈춘다.
 */
export function useDistrictDashboard(districtId: string, simDate?: string | null, live = false) {
  return useQuery<DistrictDashboardData>({
    queryKey: ['districtDashboard', districtId, simDate ?? null],
    enabled: districtId !== 'all',
    // 시뮬레이션이 돌 때만 3초 폴링, 끝나면 고정(폴링 중단)
    refetchInterval: live ? 3000 : false,
    queryFn: async () => {
      const results = await Promise.allSettled([
        getDistrictSummary(districtId),
        getDistrictMachines(districtId),
        getDistrictGantt(districtId),
        getDistrictStepQueues(districtId),
        getDistrictWorkStatus(districtId),
      ]);

      // 전부 실패면 부분 표시가 불가능 → 전체 에러로 던진다.
      if (results.every((r) => r.status === 'rejected')) {
        throw (results[0] as PromiseRejectedResult).reason;
      }

      const [summaryR, machinesR, ganttR, queuesR, workR] = results as [
        PromiseSettledResult<DistrictSummary>,
        PromiseSettledResult<DistrictMachines>,
        PromiseSettledResult<DistrictGantt>,
        PromiseSettledResult<DistrictStepQueue>,
        PromiseSettledResult<WorkStatusItem[]>,
      ];

      const failed: string[] = [];
      const summary = take(summaryR, emptySummary(districtId), '요약 지표', failed);
      const machines = take(
        machinesR,
        { districtId, districtName: null, machines: [] },
        '장비 현황',
        failed
      );
      const gantt = take(
        ganttR,
        { districtId, districtName: null, steps: [] },
        '장비 스케줄',
        failed
      );
      const stepQueues = take(
        queuesR,
        { districtId, districtName: null, steps: [] },
        '대기열',
        failed
      );
      const workStatus = take(workR, [] as WorkStatusItem[], '실시간 작업 상태', failed);

      const built = buildDistrictDashboard(
        summary,
        machines,
        gantt,
        stepQueues,
        workStatus,
        simDate
      );
      return failed.length ? { ...built, failed_sections: failed } : built;
    },
  });
}
