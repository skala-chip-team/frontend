import type { UserSummary } from '@apis/index';
import { districtLabels, type DistrictId } from '@/stores';
import type { Worker, WorkerRole } from '@/types';

/** 배정 가능한 구역 id (전체 제외) */
export const WORKER_DISTRICT_IDS: string[] = ['DST-01', 'DST-02'];

/** 패널에서 부여 가능한 역할 (관리자 제외 — 작업자/운영자만) */
export const ASSIGNABLE_ROLES: WorkerRole[] = ['운영자', '작업자'];

/** 백엔드 role(영문) → 표시용 한글 */
export function roleToKorean(role: string): WorkerRole {
  if (role === 'ADMIN') return '관리자';
  if (role === 'OPERATOR') return '운영자';
  return '작업자'; // WORKER 등
}

/** 한글 역할 → 백엔드 roleName */
export function koreanRoleToName(role: WorkerRole): string {
  if (role === '관리자') return 'ADMIN';
  if (role === '운영자') return 'OPERATOR';
  return 'WORKER';
}

/** DST-01 → 'A' (districtLabels '구역 A'에서 접두 제거). 매핑 없으면 원본 id */
export function districtShort(id: string): string {
  const label = districtLabels[id as DistrictId];
  return label ? label.replace(/^구역\s*/, '') : id;
}

/** GET /api/users 항목 → 화면 Worker */
export function userToWorker(u: UserSummary): Worker {
  return {
    user_id: u.userId,
    username: u.username,
    email: u.email,
    role: roleToKorean(u.role),
    districts: u.districtIds ?? [],
    active: u.active,
  };
}
