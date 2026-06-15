import type { LucideIcon } from 'lucide-react';

// 대시보드 관련 타입. 필드명은 docs/data.dbml 컬럼명을 따른다. (tone 은 gantt 표시용)
export type ScheduleTone = 'primary' | 'navy' | 'orange' | 'slate';
export type MachineStatus = '점검중' | '가동중' | '대기중';
export type UnitStatus = '진행중' | '대기' | '완료';

export interface ScheduledUnit {
  schedule_id: string; // schedule_master.schedule_id
  unit_id: string; // unit_master.unit_id
  priority: number; // schedule_master.priority
  status: UnitStatus; // schedule_master.status
  start_time: number; // (3D 보드 호환) 실적 우선 병합 시각
  end_time: number;
  // 간트 계획/실적 2-레인용 (시 단위 소수)
  plan_start?: number; // 계획 시작 (schedule_master estimatedStart)
  plan_end?: number; // 계획 종료 (schedule_master estimatedEnd)
  actual_start?: number | null; // 실제 시작 (work_status), 미시작이면 null
  actual_end?: number | null; // 실제 종료 (work_status), 진행중/미시작이면 null
  tone?: ScheduleTone;
}

export interface DistrictMachine {
  machine_id: string; // machine_master.machine_id
  machine_type: string; // machine_master.machine_type
  machine_status: MachineStatus; // machine_master.machine_status
  avg_utilization_rate: number; // 가동률(%)
  load_rate: number; // 부하율(%) — machines API의 loadRate
  active_unit_id?: string | null; // 현재 투입 UNIT (machines API의 activeSchedule.unitId)
  units: ScheduledUnit[];
}

export interface ProcessStep {
  step_id: string; // process_step_order.step_id
  process_step: string; // process_step_order.process_step
  avg_wait_time_min: number; // district_status.avg_wait_time_min
  waiting_units: string[]; // 실제 대기 unit_id 목록(by-step 큐, queue_position 순)
  machines: DistrictMachine[];
}

export interface SummaryCard {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
}

export interface DistrictDashboardData {
  summaryCards: SummaryCard[];
  steps: ProcessStep[];
  daily_output_qty: number; // 오늘 생산 실적(summary.dailyOutputQty)
  daily_target_output_qty: number; // 오늘 생산 목표(summary.dailyTargetOutputQty)
}
