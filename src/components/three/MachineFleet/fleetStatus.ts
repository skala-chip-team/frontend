import type { MachineDatum } from './Machine';

/**
 * 장비 상태 배지(가동중/점검중/대기중) 공통 색상 스타일.
 * Tremor BadgeDelta solidOutline 팔레트 기준:
 * - 가동중 = increase(emerald), 점검중 = decrease(red), 대기중 = neutral(gray)
 */
export function machineStatusBadgeClass(status: MachineDatum['machine_status']) {
  if (status === '가동중') {
    return 'border-emerald-600/10 bg-emerald-100 text-emerald-800';
  }

  if (status === '점검중') {
    return 'border-red-600/10 bg-red-100 text-red-800';
  }

  return 'border-gray-300/70 bg-gray-100 text-gray-700';
}
