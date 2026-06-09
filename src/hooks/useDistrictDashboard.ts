import { useQuery } from '@tanstack/react-query';

import {
  getDistrictGantt,
  getDistrictMachines,
  getDistrictStepQueues,
  getDistrictSummary,
} from '@apis/index';
import { buildDistrictDashboard } from '@/utils';
import type { DistrictDashboardData } from '@/types';

/**
 * 한 구역의 대시보드 데이터.
 * summary/machines/gantt/by-step 4개를 병렬 호출해 DistrictDashboardData로 조립한다.
 * districtId === 'all' 이면 비활성화(전체 대시보드는 아직 미연결).
 */
export function useDistrictDashboard(districtId: string) {
  return useQuery<DistrictDashboardData>({
    queryKey: ['districtDashboard', districtId],
    enabled: districtId !== 'all',
    queryFn: async () => {
      const [summary, machines, gantt, stepQueues] = await Promise.all([
        getDistrictSummary(districtId),
        getDistrictMachines(districtId),
        getDistrictGantt(districtId),
        getDistrictStepQueues(districtId),
      ]);
      return buildDistrictDashboard(summary, machines, gantt, stepQueues);
    },
  });
}
