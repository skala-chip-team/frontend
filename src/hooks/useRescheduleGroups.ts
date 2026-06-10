import { useQuery } from '@tanstack/react-query';

import { getRescheduleGroups } from '@apis/index';
import type { RescheduleGroupSummary } from '@apis/index';

/**
 * 재조정 그룹 목록.
 * districtId가 'all'/undefined면 전체 구역, status 미지정이면 전체 상태(만료 포함).
 */
export function useRescheduleGroups(districtId?: string, status?: string) {
  const filterDistrict = districtId && districtId !== 'all' ? districtId : undefined;
  return useQuery<RescheduleGroupSummary[]>({
    queryKey: ['rescheduleGroups', filterDistrict ?? null, status ?? null],
    queryFn: () => getRescheduleGroups({ districtId: filterDistrict, status }),
  });
}
