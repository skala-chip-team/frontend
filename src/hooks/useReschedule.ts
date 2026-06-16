import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  generateReschedule,
  getRescheduleGroupDetail,
  getRescheduleGroups,
  getRescheduleHistory,
  selectRescheduleStrategy,
} from '@apis/index';
import type {
  RescheduleGroupDetail,
  RescheduleGroupQuery,
  RescheduleGroupSummary,
  RescheduleHistoryPage,
  RescheduleHistoryQuery,
} from '@apis/index';

const KEYS = {
  groups: (districtId?: string, status?: string) =>
    ['rescheduleGroups', districtId ?? 'all', status ?? 'all'] as const,
  detail: (groupId?: string) => ['rescheduleDetail', groupId ?? ''] as const,
};

/**
 * 승인된 재조정안이 실제로 바꾼 unit_id 집합 (대시보드 간트 강조용).
 * 승인 그룹 summary의 affectedUnits는 위험 해소로 비어있을 수 있으므로,
 * 각 승인 그룹의 상세에서 선택된 안(selected)의 afterSchedule·queueReorder·delayRisks unit을 모은다.
 */
export function useApprovedRescheduleUnitIds(districtId?: string): Set<string> {
  const { data: groups } = useRescheduleGroups({ districtId, status: 'approved' });
  const details = useQueries({
    queries: (groups ?? []).map((group) => ({
      queryKey: KEYS.detail(group.groupId),
      queryFn: () => getRescheduleGroupDetail(group.groupId),
      staleTime: 60_000,
    })),
  });

  const ids = new Set<string>();
  for (const query of details) {
    const detail = query.data;
    if (!detail) continue;
    const selected =
      detail.options.find((option) => option.selected) ??
      detail.options.find((option) => option.afterSchedule != null);
    selected?.afterSchedule?.units.forEach((unit) => ids.add(unit.unit_id));
    selected?.queueReorder?.forEach((item) => ids.add(item.unit_id));
    detail.delayRisks.forEach((risk) => ids.add(risk.unitId));
  }
  return ids;
}

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

/** 기간별 재조정 이력 (페이지네이션). enabled=false면 호출 보류(기간 검증 실패 등) */
export function useRescheduleHistory(query: RescheduleHistoryQuery, enabled = true) {
  return useQuery<RescheduleHistoryPage>({
    queryKey: ['rescheduleHistory', query.from, query.to, query.page ?? 0, query.size ?? 20],
    queryFn: () => getRescheduleHistory(query),
    enabled,
    placeholderData: (prev) => prev, // 페이지 전환 시 깜빡임 방지
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
