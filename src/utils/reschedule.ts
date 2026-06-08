import type { GroupStatus, RiskLevel } from '@/types';

/** Risk Level → Chip color (solid) */
export function riskChipColor(level: RiskLevel): 'red' | 'orange' | 'emerald' {
  if (level === 'High') return 'red';
  if (level === 'Medium') return 'orange';
  return 'emerald';
}

/** 그룹 상태 → Chip color (soft, 장비 상태 배지와 동일 톤) */
export function statusChipColor(status: GroupStatus): 'emerald' | 'gray' {
  return status === 'expired' ? 'gray' : 'emerald';
}

export function statusLabel(status: GroupStatus): string {
  return status === 'expired' ? '만료됨' : '진행중';
}

export function formatDelayHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
}
