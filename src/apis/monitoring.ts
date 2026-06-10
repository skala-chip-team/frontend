import { apiClient } from './axios';
import type {
  ApiResponse,
  DistrictGantt,
  DistrictMachines,
  DistrictStepQueue,
  DistrictSummary,
  WorkStatusItem,
} from './types';

const DISTRICTS_BASE = '/api/monitoring/districts';

/** 구역 상태 요약 (요약 카드용) */
export async function getDistrictSummary(districtId: string): Promise<DistrictSummary> {
  const { data } = await apiClient.get<ApiResponse<DistrictSummary>>(
    `${DISTRICTS_BASE}/${districtId}/summary`
  );
  return data.data;
}

/** 구역 장비 현황 (step별 장비 목록 + 가동률/상태) */
export async function getDistrictMachines(districtId: string): Promise<DistrictMachines> {
  const { data } = await apiClient.get<ApiResponse<DistrictMachines>>(
    `${DISTRICTS_BASE}/${districtId}/machines`
  );
  return data.data;
}

/** 구역 스케줄 간트 (step별 unit 스케줄 막대) */
export async function getDistrictGantt(districtId: string): Promise<DistrictGantt> {
  const { data } = await apiClient.get<ApiResponse<DistrictGantt>>(
    `${DISTRICTS_BASE}/${districtId}/schedules/gantt`
  );
  return data.data;
}

/** 구역 step별 큐 (step별 평균 대기시간 + 대기 unit 목록) */
export async function getDistrictStepQueues(districtId: string): Promise<DistrictStepQueue> {
  const { data } = await apiClient.get<ApiResponse<DistrictStepQueue>>(
    `${DISTRICTS_BASE}/${districtId}/queues/by-step`
  );
  return data.data;
}

/** 구역 실제 작업 현황 (scheduleId별 실제 시작/종료 시각 — 간트 막대 폭에 사용) */
export async function getDistrictWorkStatus(districtId: string): Promise<WorkStatusItem[]> {
  const { data } = await apiClient.get<ApiResponse<WorkStatusItem[]>>(
    `${DISTRICTS_BASE}/${districtId}/work-status`
  );
  return data.data;
}
