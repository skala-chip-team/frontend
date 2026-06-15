import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  generateReschedule,
  getRescheduleGroupDetail,
  getRescheduleGroups,
  selectRescheduleStrategy,
} from '@apis/index';
import type {
  RescheduleGroupDetail,
  RescheduleGroupQuery,
  RescheduleGroupSummary,
} from '@apis/index';

const KEYS = {
  groups: (districtId?: string, status?: string) =>
    ['rescheduleGroups', districtId ?? 'all', status ?? 'all'] as const,
  detail: (groupId?: string) => ['rescheduleDetail', groupId ?? ''] as const,
};

/**
 * 재조정 그룹 목록.
 * districtId/status로 필터. status='active'는 pending+approved.
 * pending 폴링(위험탐지 알림)이 필요하면 pollMs를 넘긴다(3~5초).
 */
export function useRescheduleGroups(query: RescheduleGroupQuery = {}, pollMs?: number) {
  return useQuery<RescheduleGroupSummary[]>({
    queryKey: KEYS.groups(query.districtId, query.status),
    queryFn: () => getRescheduleGroups(query),
    refetchInterval: pollMs ?? false,
  });
}

/** 재조정 그룹 상세 (delayRisks·riskAnalysis·beforeSchedule·options) */
export function useRescheduleDetail(groupId?: string) {
  return useQuery<RescheduleGroupDetail>({
    queryKey: KEYS.detail(groupId),
    queryFn: () => getRescheduleGroupDetail(groupId as string),
    enabled: Boolean(groupId),
  });
}

/**
 * 재조정안 재생성 (에이전트 재호출, 수 초~2분).
 * 성공 시 상세 캐시를 응답으로 교체한다.
 */
export function useGenerateReschedule(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateReschedule(groupId as string),
    onSuccess: (detail) => {
      queryClient.setQueryData(KEYS.detail(groupId), detail);
    },
  });
}

/**
 * 전략 확정(승인). 성공 시 상세·목록·위험알림 캐시를 무효화한다.
 */
export function useSelectStrategy(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategy: string) => selectRescheduleStrategy(groupId as string, strategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: ['rescheduleGroups'] });
      queryClient.invalidateQueries({ queryKey: ['riskAlerts'] });
    },
  });
}
