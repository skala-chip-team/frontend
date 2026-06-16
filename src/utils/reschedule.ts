import type { GroupStatus, RiskLevel } from '@/types';

/** Risk Level → Chip color (solid) */
export function riskChipColor(level: RiskLevel): 'red' | 'orange' | 'emerald' {
  if (level === 'Critical' || level === 'High') return 'red';
  if (level === 'Medium') return 'orange';
  return 'emerald';
}

/** 그룹 상태 → Chip color (subtle, Recommend 칩과 동일 톤) */
export function statusChipColor(status: GroupStatus): 'primary' | 'gray' {
  return status === 'pending' ? 'primary' : 'gray';
}

export function statusLabel(status: GroupStatus): string {
  if (status === 'approved') return '승인됨';
  if (status === 'expired') return '해결됨';
  return '진행중';
}

/** 위험 레벨 → 배지 표기(영문 대문자: LOW / MEDIUM / HIGH / CRITICAL) */
export function riskLevelLabel(level: RiskLevel): string {
  return level.toUpperCase();
}

/** 'STEP_D' → 'STEP-D'. 형식이 다르면 원문 그대로 */
export function processStepLabel(step: string): string {
  const m = /^STEP[_-]([A-Z0-9]+)$/i.exec(step);
  return m ? `STEP-${m[1].toUpperCase()}` : step;
}

export function formatDelayHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
}

/** ISO 시각 → '방금 전 / N분 전 / N시간 전 / N일 전'. 잘못된 값이면 빈 문자열 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  // 서버 시각은 UTC wall-clock 인데 'Z'(오프셋)가 없어 브라우저가 로컬시간으로 오해한다
  // (KST면 9시간 어긋남). 오프셋 표기가 없으면 UTC('Z')로 보정해 파싱한다.
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(iso);
  const t = new Date(hasZone ? iso : `${iso}Z`).getTime();
  if (Number.isNaN(t)) return '';
  const diffMin = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  return `${Math.floor(diffHr / 24)}일 전`;
}
