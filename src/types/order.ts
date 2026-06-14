// 주문 관리 관련 타입. 필드명은 docs/data.dbml 컬럼명을 따른다.
// TT_DAILY_ORDER / TM_UNIT_MASTER / TM_PROCESS_STEP_ORDER 참고.

export type OrderDistrict = 'DST-01' | 'DST-02';

// TM_PROCESS_STEP_ORDER.process_step (STEP_A ~ STEP_D)
export type StepCode = 'STEP_A' | 'STEP_B' | 'STEP_C' | 'STEP_D';

// TM_UNIT_MASTER.unit_status
export type OrderUnitStatus = '대기' | '진행중' | '완료';

// 주문 전체 상태 (유닛 상태에서 도출)
export type OrderStatus = '대기' | '진행중' | '완료';

export interface OrderUnit {
  unit_id: string; // TM_UNIT_MASTER.unit_id
  unit_status: OrderUnitStatus; // 대기 / 진행중 / 완료
  unit_size_qty: number; // 25 고정
  current_step: StepCode | null; // 진행중이면 현재 공정. 대기/완료는 null
  current_machine: string | null; // 진행중일 때 배정 장비 (TM_SCHEDULE_MASTER.machine_id)
  actual_start_time: string | null; // STEP_A 시작 시각 ('HH:mm'), 미시작 null
  estimated_complete_time: string | null; // 완료 예상 시각 ('HH:mm'), 완료된 유닛은 null
  actual_complete_time: string | null; // STEP_D 완료 시각 ('HH:mm'), 미완료 null
}

export interface Order {
  order_id: string; // TT_DAILY_ORDER.order_id
  district_id: OrderDistrict; // TT_DAILY_ORDER.district_id
  plan_date: string; // 계획일 ('YYYY-MM-DD')
  due_date: string; // 납기 ('YYYY-MM-DD HH:mm')
  planned_output_qty: number; // 100 고정 (4 Unit × 25)
  order_priority: number; // 1(높음) ~ 5(낮음)
  is_burst: boolean; // burst(긴급) 주문 여부
  due_imminent?: boolean; // 서버 제공 납기 임박 플래그(있으면 우선 사용). mock은 미설정
  units: OrderUnit[]; // 소속 유닛 (4개)
}
