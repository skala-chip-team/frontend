import type { Order, OrderStatus, OrderUnit, StepCode } from '@/types';

// Chip color 서브셋 (components import 회피 — 기존 reschedule util 컨벤션)
type OrderChipColor = 'gray' | 'red' | 'orange' | 'amber' | 'emerald' | 'primary';

const DISTRICT_SHORT: Record<string, string> = { 'DST-01': 'A', 'DST-02': 'B' };

/** 'DST-01' → 'A' (구역 셀렉터/테이블 표시용) */
export function districtShort(id: string): string {
  return DISTRICT_SHORT[id] ?? id;
}

// 공정 순서 (TM_PROCESS_STEP_ORDER) + 평균 소요(분)
export const STEP_SEQUENCE: { code: StepCode; label: string; avgMin: number }[] = [
  { code: 'STEP_A', label: 'A', avgMin: 90 },
  { code: 'STEP_B', label: 'B', avgMin: 120 },
  { code: 'STEP_C', label: 'C', avgMin: 90 },
  { code: 'STEP_D', label: 'D', avgMin: 90 },
];

/** 유닛 상태들로 주문 전체 상태 도출: 전부 완료→완료 / 하나라도 진행·완료→진행중 / 그 외→대기 */
export function orderStatus(units: OrderUnit[]): OrderStatus {
  if (units.length > 0 && units.every((unit) => unit.unit_status === '완료')) return '완료';
  if (units.some((unit) => unit.unit_status === '진행중' || unit.unit_status === '완료'))
    return '진행중';
  return '대기';
}

/** 상태 칩 색상 — 완료 emerald / 진행중 primary / 대기 gray */
export function orderStatusColor(status: OrderStatus): OrderChipColor {
  if (status === '완료') return 'emerald';
  if (status === '진행중') return 'primary';
  return 'gray';
}

/** 완료 유닛 수 / 전체 유닛 수 */
export function orderProgress(units: OrderUnit[]): { done: number; total: number; percent: number } {
  const total = units.length;
  const done = units.filter((unit) => unit.unit_status === '완료').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

export interface PriorityMeta {
  label: string; // 매우 높음 ~ 매우 낮음
  color: OrderChipColor;
}

/** order_priority 1(높음)~5(낮음) → 라벨/색상 */
export function priorityMeta(priority: number): PriorityMeta {
  switch (priority) {
    case 1:
      return { label: '매우 높음', color: 'red' };
    case 2:
      return { label: '높음', color: 'orange' };
    case 3:
      return { label: '보통', color: 'amber' };
    case 4:
      return { label: '낮음', color: 'gray' };
    default:
      return { label: '매우 낮음', color: 'gray' };
  }
}

export type StepState = 'done' | 'active' | 'pending';

/** 유닛의 4개 공정 진행 상태 — 완료 step / 현재 진행 step / 대기 step */
export function unitStepStates(
  unit: OrderUnit
): { code: StepCode; label: string; state: StepState }[] {
  const currentIndex = unit.current_step
    ? STEP_SEQUENCE.findIndex((step) => step.code === unit.current_step)
    : -1;

  return STEP_SEQUENCE.map((step, index) => {
    let state: StepState = 'pending';
    if (unit.unit_status === '완료') {
      state = 'done';
    } else if (unit.unit_status === '진행중' && currentIndex >= 0) {
      if (index < currentIndex) state = 'done';
      else if (index === currentIndex) state = 'active';
      else state = 'pending';
    }
    return { code: step.code, label: step.label, state };
  });
}

/** 주문 정렬 — 우선순위 높은 순(1→5), 같으면 납기 빠른 순 */
export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    if (a.order_priority !== b.order_priority) return a.order_priority - b.order_priority;
    return a.due_date.localeCompare(b.due_date);
  });
}

/** '2026-06-12 18:00' → '06.12 18:00' 표시용 */
export function formatDueDate(due: string): string {
  const match = due.match(/^\d{4}-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (!match) return due;
  return `${match[1]}.${match[2]} ${match[3]}`;
}

/** '2026-06-12' → '06.12' 표시용 */
export function formatPlanDate(date: string): string {
  const match = date.match(/^\d{4}-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}` : date;
}

/** 납기일(due_date)이 기준일(today, 'YYYY-MM-DD')과 같은 날 = 오늘 납기(임박) */
export function isDueToday(dueDate: string, today: string): boolean {
  return dueDate.slice(0, 10) === today;
}
