import { useMutation, useQueryClient } from '@tanstack/react-query';

import { generateReschedule, selectRescheduleStrategy } from '@apis/index';
import type { RescheduleGroupDetail } from '@apis/index';

/** 재조정안 재생성 (에이전트 재호출). 성공 시 상세 캐시 교체 */
export function useGenerateReschedule(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateReschedule(groupId),
    onSuccess: (data) => {
      queryClient.setQueryData<RescheduleGroupDetail>(['rescheduleDetail', groupId], data);
    },
  });
}

/** 전략 선택·확정(승인). 성공 시 상세/목록/알림 캐시 무효화 */
export function useSelectRescheduleStrategy(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategy: string) => selectRescheduleStrategy(groupId, strategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescheduleDetail', groupId] });
      queryClient.invalidateQueries({ queryKey: ['rescheduleGroups'] });
      queryClient.invalidateQueries({ queryKey: ['riskAlerts'] });
    },
  });
}
