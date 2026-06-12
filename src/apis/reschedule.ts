import { apiClient } from './axios';
import type { ApiResponse, RescheduleGroupSummary } from './types';

/** 재조정 그룹 목록 (status로 필터). 응답은 ApiResponse 래퍼 → data가 배열 */
export async function getRescheduleGroups(status?: string): Promise<RescheduleGroupSummary[]> {
  const { data } = await apiClient.get<ApiResponse<RescheduleGroupSummary[]>>(
    '/api/reschedule/groups',
    { params: status ? { status } : undefined }
  );
  return data.data;
}

/** pending 상태의 재조정 그룹(= 위험 탐지 결과) */
export function getPendingRescheduleGroups(): Promise<RescheduleGroupSummary[]> {
  return getRescheduleGroups('pending');
}
