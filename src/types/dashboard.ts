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
  start_time: number; // work_status.start_time (mock: 시 단위)
  end_time: number; // work_status.end_time
  tone?: ScheduleTone;
}

export interface DistrictMachine {
  machine_id: string; // machine_master.machine_id
  machine_type: string; // machine_master.machine_type
  machine_status: MachineStatus; // machine_master.machine_status
  avg_utilization_rate: number; // 가동률(%)
  units: ScheduledUnit[];
}

export interface ProcessStep {
  step_id: string; // process_step_order.step_id
  process_step: string; // process_step_order.process_step
  avg_wait_time_min: number; // district_status.avg_wait_time_min
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
}
