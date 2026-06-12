import { useQuery } from '@tanstack/react-query';

import { getMonitoringOverview } from '@apis/index';
import { buildDistrictOverview } from '@/utils/overviewTransform';
import type { DistrictOverview } from '@/mocks/districtOverview';

const COLORS = ['#34d399', '#fbbf24', '#38bdf8', '#fb7185', '#a78bfa'];

/**
 * 전체 구역 대시보드 데이터.
 * GET /api/monitoring/overview 단일 스냅샷(모든 구역 같은 시점) → DistrictOverview[].
 * live=true(시뮬 진행 중)면 5초 폴링.
 */
export function useDistrictOverviews(live = false) {
  return useQuery<DistrictOverview[]>({
    queryKey: ['districtOverviews'],
    refetchInterval: live ? 5000 : false,
    retry: 1,
    queryFn: async () => {
      const overview = await getMonitoringOverview();
      return overview.map((dto, i) => buildDistrictOverview(dto, COLORS[i % COLORS.length]));
    },
  });
}
