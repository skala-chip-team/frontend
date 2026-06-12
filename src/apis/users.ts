import { apiClient } from './axios';
import type { ApiResponse, UserSummary } from './types';

const USERS_BASE = '/api/users';

/** 사용자 목록 (ADMIN 전용) */
export async function getUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<ApiResponse<UserSummary[]>>(USERS_BASE);
  return data.data;
}

/** 역할 변경. roleName: ADMIN | OPERATOR | WORKER */
export async function changeUserRole(userId: string, roleName: string): Promise<void> {
  await apiClient.patch(`${USERS_BASE}/${userId}/role`, { roleName });
}

/** 권한 구역 배정 (전체 교체). districtIds: ['DST-01', ...] */
export async function assignUserDistricts(userId: string, districtIds: string[]): Promise<void> {
  await apiClient.put(`${USERS_BASE}/${userId}/districts`, { districtIds });
}

/** 사용자 삭제 */
export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`${USERS_BASE}/${userId}`);
}
