import { useQuery } from '@tanstack/react-query';

import { getRescheduleGroupDetail } from '@apis/index';
import type { RescheduleGroupDetail } from '@apis/index';

/** 재조정 그룹 상세 (원인분석 + 전략별 재조정안). groupId 없으면 비활성 */
export function useRescheduleDetail(groupId?: string) {
  return useQuery<RescheduleGroupDetail>({
    queryKey: ['rescheduleDetail', groupId ?? null],
    enabled: Boolean(groupId),
    queryFn: () => getRescheduleGroupDetail(groupId as string),
    staleTime: 0,
  });
}
