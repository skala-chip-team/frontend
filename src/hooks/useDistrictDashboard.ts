import { useQuery } from '@tanstack/react-query';

import {
  getDistrictGantt,
  getDistrictMachines,
  getDistrictStepQueues,
  getDistrictSummary,
  getDistrictWorkStatus,
} from '@apis/index';
import { buildDistrictDashboard } from '@/utils';
import type { DistrictDashboardData } from '@/types';

/**
 * 한 구역의 대시보드 데이터.
 * summary/machines/gantt/by-step 4개를 병렬 호출해 DistrictDashboardData로 조립한다.
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
      const [summary, machines, gantt, stepQueues, workStatus] = await Promise.all([
        getDistrictSummary(districtId),
        getDistrictMachines(districtId),
        getDistrictGantt(districtId),
        getDistrictStepQueues(districtId),
        getDistrictWorkStatus(districtId),
      ]);
      return buildDistrictDashboard(summary, machines, gantt, stepQueues, workStatus, simDate);
    },
  });
}
