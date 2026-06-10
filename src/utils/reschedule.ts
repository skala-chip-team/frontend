import type { GroupStatus, RiskLevel } from '@/types';

/** Risk Level → Chip color (solid) */
export function riskChipColor(level: RiskLevel): 'red' | 'orange' | 'emerald' {
  if (level === 'Critical' || level === 'High') return 'red';
  if (level === 'Medium') return 'orange';
  return 'emerald';
}

/** 그룹 상태 → Chip color (subtle, Recommend 칩과 동일 톤) */
export function statusChipColor(status: GroupStatus): 'primary' | 'gray' {
  return status === 'expired' ? 'gray' : 'primary';
}

export function statusLabel(status: GroupStatus): string {
  return status === 'expired' ? '만료됨' : '진행중';
}

export function formatDelayHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
}

/** 공통 래퍼(ApiResponse) 에러에서 message를 꺼낸다. 없으면 fallback */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const msg = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : fallback;
}
