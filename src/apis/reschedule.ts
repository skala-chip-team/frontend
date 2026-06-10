import { apiClient } from './axios';
import type {
  ApiResponse,
  RescheduleGroupDetail,
  RescheduleGroupSummary,
  RescheduleSelectionResult,
} from './types';

const GROUPS_BASE = '/api/reschedule/groups';

export interface RescheduleGroupsParams {
  districtId?: string;
  status?: string; // pending / approved / expired / active
}

/** 재조정 그룹 목록 (districtId/status로 필터). 응답은 ApiResponse 래퍼 → data가 배열 */
export async function getRescheduleGroups(
  params?: RescheduleGroupsParams
): Promise<RescheduleGroupSummary[]> {
  const query: Record<string, string> = {};
  if (params?.districtId) query.districtId = params.districtId;
  if (params?.status) query.status = params.status;
  const { data } = await apiClient.get<ApiResponse<RescheduleGroupSummary[]>>(GROUPS_BASE, {
    params: Object.keys(query).length ? query : undefined,
  });
  return data.data;
}

/** pending 상태의 재조정 그룹(= 위험 탐지 결과) */
export function getPendingRescheduleGroups(): Promise<RescheduleGroupSummary[]> {
  return getRescheduleGroups({ status: 'pending' });
}

/** 재조정 그룹 상세 (원인분석 + 전략별 재조정안) */
export async function getRescheduleGroupDetail(groupId: string): Promise<RescheduleGroupDetail> {
  const { data } = await apiClient.get<ApiResponse<RescheduleGroupDetail>>(
    `${GROUPS_BASE}/${groupId}`
  );
  return data.data;
}

// 에이전트(LLM) 호출은 수 초~2분 → 기본 10초 타임아웃으로는 부족하므로 별도 지정
const AGENT_TIMEOUT_MS = 150000;

/** 재조정안 재생성 (에이전트 재호출). 응답 구조는 상세와 동일. LLM 호출이라 수 초~2분 소요 */
export async function generateReschedule(groupId: string): Promise<RescheduleGroupDetail> {
  const { data } = await apiClient.post<ApiResponse<RescheduleGroupDetail>>(
    `${GROUPS_BASE}/${groupId}/generate`,
    undefined,
    { timeout: AGENT_TIMEOUT_MS }
  );
  return data.data;
}

/** 전략 선택·확정(승인). process_queue + schedule_master에 실제 반영, 그룹 상태 approved */
export async function selectRescheduleStrategy(
  groupId: string,
  strategy: string
): Promise<RescheduleSelectionResult> {
  const { data } = await apiClient.post<ApiResponse<RescheduleSelectionResult>>(
    `${GROUPS_BASE}/${groupId}/select`,
    { strategy },
    { timeout: AGENT_TIMEOUT_MS }
  );
  return data.data;
}
