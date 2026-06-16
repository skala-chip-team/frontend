import { apiClient } from './axios';
import type {
  ApiResponse,
  PredictionStatus,
  RescheduleGroupDetail,
  RescheduleGroupSummary,
  RescheduleHistoryPage,
  RescheduleSelectionResult,
} from './types';

/** 기간별 재조정 이력 (페이지네이션). 기간 92일 초과 시 400 */
export interface RescheduleHistoryQuery {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  page?: number; // 0-based
  size?: number;
}

/** 지연 예측 시스템 상태 (대시보드 위젯용) */
export async function getPredictionStatus(): Promise<PredictionStatus> {
  const { data } = await apiClient.get<ApiResponse<PredictionStatus>>(
    '/api/reschedule/prediction-status'
  );
  return data.data;
}

/** 목록 필터. status 미지정 시 전체. active = pending + approved */
export interface RescheduleGroupQuery {
  districtId?: string; // 'all'이면 미지정으로 처리
  status?: 'pending' | 'approved' | 'expired' | 'active';
}

/** 재조정 그룹 목록 (districtId·status로 필터). 응답은 ApiResponse 래퍼 → data가 배열 */
export async function getRescheduleGroups(
  query: RescheduleGroupQuery = {}
): Promise<RescheduleGroupSummary[]> {
  const params: Record<string, string> = {};
  if (query.districtId && query.districtId !== 'all') params.districtId = query.districtId;
  if (query.status) params.status = query.status;

  const { data } = await apiClient.get<ApiResponse<RescheduleGroupSummary[]>>(
    '/api/reschedule/groups',
    { params: Object.keys(params).length ? params : undefined }
  );
  return data.data;
}

/** 기간별 재조정 이력 조회 (만료 포함, 페이지네이션) */
export async function getRescheduleHistory(
  query: RescheduleHistoryQuery
): Promise<RescheduleHistoryPage> {
  const { data } = await apiClient.get<ApiResponse<RescheduleHistoryPage>>(
    '/api/reschedule/groups/history',
    {
      params: {
        from: query.from,
        to: query.to,
        page: query.page ?? 0,
        size: query.size ?? 20,
      },
    }
  );
  return data.data;
}

/** pending 상태의 재조정 그룹(= 위험 탐지 결과). 위험탐지 알림 폴링용 */
export function getPendingRescheduleGroups(): Promise<RescheduleGroupSummary[]> {
  return getRescheduleGroups({ status: 'pending' });
}

/** 재조정 그룹 상세 (delayRisks·riskAnalysis·beforeSchedule·options 포함) */
export async function getRescheduleGroupDetail(groupId: string): Promise<RescheduleGroupDetail> {
  const { data } = await apiClient.get<ApiResponse<RescheduleGroupDetail>>(
    `/api/reschedule/groups/${groupId}`
  );
  return data.data;
}

/**
 * 재조정안 재생성 (에이전트 재호출, 수 초~2분). 바디 없음.
 * 응답은 상세(getRescheduleGroupDetail)와 동일 형태.
 */
export async function generateReschedule(groupId: string): Promise<RescheduleGroupDetail> {
  const { data } = await apiClient.post<ApiResponse<RescheduleGroupDetail>>(
    `/api/reschedule/groups/${groupId}/generate`
  );
  return data.data;
}

/**
 * 전략 확정(승인). process_queue 순서 + schedule_master 실제 반영, 그룹 approved.
 * 요청: { strategy }, 응답: RescheduleSelectionResult
 */
export async function selectRescheduleStrategy(
  groupId: string,
  strategy: string
): Promise<RescheduleSelectionResult> {
  const { data } = await apiClient.post<ApiResponse<RescheduleSelectionResult>>(
    `/api/reschedule/groups/${groupId}/select`,
    { strategy }
  );
  return data.data;
}
