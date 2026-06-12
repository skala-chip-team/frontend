import type { Order, OrderDistrict, OrderUnit, StepCode } from '@/types';

// 유닛 생성 헬퍼 (unit_size_qty 25 고정)
const u = (
  unit_id: string,
  unit_status: OrderUnit['unit_status'],
  current_step: StepCode | null,
  current_machine: string | null,
  actual_start_time: string | null,
  estimated_complete_time: string | null,
  actual_complete_time: string | null
): OrderUnit => ({
  unit_id,
  unit_status,
  unit_size_qty: 25,
  current_step,
  current_machine,
  actual_start_time,
  estimated_complete_time,
  actual_complete_time,
});

const o = (
  order_id: string,
  district_id: OrderDistrict,
  plan_date: string,
  due_date: string,
  order_priority: number,
  is_burst: boolean,
  units: OrderUnit[]
): Order => ({
  order_id,
  district_id,
  plan_date,
  due_date,
  planned_output_qty: 100,
  order_priority,
  is_burst,
  units,
});

export const orders: Order[] = [
  // ── 구역 A (DST-01) ──
  o('ORD-2401', 'DST-01', '2026-06-12', '2026-06-12 18:00', 1, true, [
    u('UNIT-2401-1', '완료', null, null, '08:10', null, '14:30'),
    u('UNIT-2401-2', '진행중', 'STEP_C', 'MACHINE-12', '09:00', '17:10', null),
    u('UNIT-2401-3', '진행중', 'STEP_B', 'MACHINE-07', '10:30', '18:40', null),
    u('UNIT-2401-4', '대기', null, null, null, '20:00', null),
  ]),
  o('ORD-2402', 'DST-01', '2026-06-12', '2026-06-12 21:00', 2, false, [
    u('UNIT-2402-1', '진행중', 'STEP_D', 'MACHINE-03', '08:00', '15:30', null),
    u('UNIT-2402-2', '진행중', 'STEP_C', 'MACHINE-15', '09:20', '16:50', null),
    u('UNIT-2402-3', '대기', null, null, null, '18:30', null),
    u('UNIT-2402-4', '대기', null, null, null, '19:10', null),
  ]),
  o('ORD-2403', 'DST-01', '2026-06-12', '2026-06-13 09:00', 3, false, [
    u('UNIT-2403-1', '완료', null, null, '07:30', null, '13:40'),
    u('UNIT-2403-2', '완료', null, null, '08:00', null, '14:10'),
    u('UNIT-2403-3', '진행중', 'STEP_D', 'MACHINE-21', '10:00', '16:20', null),
    u('UNIT-2403-4', '진행중', 'STEP_B', 'MACHINE-09', '11:15', '19:00', null),
  ]),
  o('ORD-2404', 'DST-01', '2026-06-12', '2026-06-13 14:00', 5, false, [
    u('UNIT-2404-1', '대기', null, null, null, '21:30', null),
    u('UNIT-2404-2', '대기', null, null, null, '22:10', null),
    u('UNIT-2404-3', '대기', null, null, null, '22:50', null),
    u('UNIT-2404-4', '대기', null, null, null, '23:30', null),
  ]),
  o('ORD-2405', 'DST-01', '2026-06-12', '2026-06-12 16:00', 4, false, [
    u('UNIT-2405-1', '완료', null, null, '06:30', null, '12:40'),
    u('UNIT-2405-2', '완료', null, null, '06:50', null, '13:00'),
    u('UNIT-2405-3', '완료', null, null, '07:10', null, '13:20'),
    u('UNIT-2405-4', '완료', null, null, '07:30', null, '13:50'),
  ]),
  o('ORD-2406', 'DST-01', '2026-06-12', '2026-06-13 11:00', 3, false, [
    u('UNIT-2406-1', '진행중', 'STEP_A', 'MACHINE-02', '11:40', '18:10', null),
    u('UNIT-2406-2', '대기', null, null, null, '19:30', null),
    u('UNIT-2406-3', '대기', null, null, null, '20:10', null),
    u('UNIT-2406-4', '대기', null, null, null, '20:50', null),
  ]),

  // ── 구역 B (DST-02) ──
  o('ORD-3301', 'DST-02', '2026-06-12', '2026-06-12 19:00', 1, false, [
    u('UNIT-3301-1', '진행중', 'STEP_D', 'MACHINE-28', '08:30', '15:00', null),
    u('UNIT-3301-2', '진행중', 'STEP_C', 'MACHINE-31', '09:10', '16:40', null),
    u('UNIT-3301-3', '진행중', 'STEP_B', 'MACHINE-24', '10:50', '18:20', null),
    u('UNIT-3301-4', '대기', null, null, null, '19:50', null),
  ]),
  o('ORD-3302', 'DST-02', '2026-06-12', '2026-06-12 20:30', 2, true, [
    u('UNIT-3302-1', '완료', null, null, '07:40', null, '13:55'),
    u('UNIT-3302-2', '진행중', 'STEP_C', 'MACHINE-33', '09:30', '17:00', null),
    u('UNIT-3302-3', '진행중', 'STEP_A', 'MACHINE-26', '11:00', '17:30', null),
    u('UNIT-3302-4', '대기', null, null, null, '19:00', null),
  ]),
  o('ORD-3303', 'DST-02', '2026-06-12', '2026-06-13 13:00', 4, false, [
    u('UNIT-3303-1', '대기', null, null, null, '20:30', null),
    u('UNIT-3303-2', '대기', null, null, null, '21:10', null),
    u('UNIT-3303-3', '대기', null, null, null, '21:50', null),
    u('UNIT-3303-4', '대기', null, null, null, '22:30', null),
  ]),
  o('ORD-3304', 'DST-02', '2026-06-12', '2026-06-12 15:30', 5, false, [
    u('UNIT-3304-1', '완료', null, null, '06:10', null, '12:20'),
    u('UNIT-3304-2', '완료', null, null, '06:30', null, '12:40'),
    u('UNIT-3304-3', '완료', null, null, '06:50', null, '13:05'),
    u('UNIT-3304-4', '완료', null, null, '07:10', null, '13:25'),
  ]),
  o('ORD-3305', 'DST-02', '2026-06-12', '2026-06-13 10:00', 3, false, [
    u('UNIT-3305-1', '진행중', 'STEP_B', 'MACHINE-35', '10:10', '18:00', null),
    u('UNIT-3305-2', '진행중', 'STEP_A', 'MACHINE-29', '11:30', '18:40', null),
    u('UNIT-3305-3', '대기', null, null, null, '20:00', null),
    u('UNIT-3305-4', '대기', null, null, null, '20:40', null),
  ]),
  o('ORD-3306', 'DST-02', '2026-06-12', '2026-06-12 22:00', 2, false, [
    u('UNIT-3306-1', '완료', null, null, '07:00', null, '13:10'),
    u('UNIT-3306-2', '완료', null, null, '07:20', null, '13:30'),
    u('UNIT-3306-3', '진행중', 'STEP_C', 'MACHINE-37', '09:50', '17:20', null),
    u('UNIT-3306-4', '진행중', 'STEP_B', 'MACHINE-22', '11:20', '19:15', null),
  ]),
];
