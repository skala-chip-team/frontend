// API 공통 응답 래퍼 및 monitoring 도메인 응답 타입. 필드명은 백엔드(camelCase) 기준.

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

/** GET /sim/status (시뮬레이션 서버 8000). 래퍼 없이 평면 객체로 옴 */
export interface SimStatus {
  status: string; // 'idle' | 'running' | 'finished' 등
  is_running: boolean;
  sim_now_min: number | null; // idle이면 null
  sim_now_iso: string | null; // 현재 시뮬레이션 시각. idle이면 null
  error: string | null;
}

/** 위험도 레벨 (배지용). 백엔드는 Low/Medium/High/Critical을 준다. */
export type ApiRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RescheduleAffectedUnit {
  unitId: string;
  estimatedDelayHr: number;
}

/** GET /api/reschedule/groups (status=pending) 항목 */
export interface RescheduleGroupSummary {
  groupId: string;
  districtId: string;
  stepId: string;
  processStep: string;
  maxRiskScore: number;
  riskLevel: ApiRiskLevel;
  groupStatus: string;
  createdAt: string;
  affectedUnits: RescheduleAffectedUnit[];
}

/** GET /api/monitoring/districts/{districtId}/summary */
export interface DistrictSummary {
  districtId: string;
  districtName: string | null;
  totalMachineCount: number;
  availableMachineCount: number;
  downMachineCount: number;
  avgUtilizationRate: number;
  totalWaitingUnitCount: number;
  avgWaitTimeMin: number;
  dailyOutputQty: number;
}

/** GET /api/monitoring/districts/{districtId}/machines */
export interface ActiveSchedule {
  scheduleId: string;
  unitId: string;
  startTime: string;
  estimatedEnd: string;
  priority: number;
}

export interface MachineDetail {
  machineId: string;
  machineType: string;
  machineStatus: string;
  stepId: string;
  processStep: string;
  utilizationRate: number;
  activeSchedule: ActiveSchedule | null;
}

export interface DistrictMachines {
  districtId: string;
  districtName: string | null;
  machines: MachineDetail[];
}

/** GET /api/monitoring/districts/{districtId}/work-status (실제 작업 시각). data는 평면 배열 */
export interface WorkStatusItem {
  statusId: string;
  scheduleId: string;
  machineId: string;
  machineStatus: string;
  districtId: string;
  unitId: string;
  /** 실제 작업 시작 시각(없으면 null) */
  startTime: string | null;
  /** 실제 작업 종료 시각(진행중/미시작이면 null) */
  endTime: string | null;
  defectCount: number | null;
  outputQty: number | null;
}

/** GET /api/monitoring/districts/{districtId}/schedules/gantt */
export interface GanttBar {
  scheduleId: string;
  machineId: string;
  machineStatus: string;
  unitId: string;
  unitStatus: string;
  priority: number;
  status: string;
  active: boolean;
  estimatedStart: string;
  estimatedEnd: string;
}

export interface StepGantt {
  stepId: string;
  processStep: string;
  stepOrder: number;
  stepAvgTime: number;
  schedules: GanttBar[];
}

export interface DistrictGantt {
  districtId: string;
  districtName: string | null;
  steps: StepGantt[];
}

/** GET /api/monitoring/districts/{districtId}/queues/by-step */
export interface WaitingUnit {
  queueId: string;
  unitId: string;
  orderId: string;
  unitStatus: string;
  queuePosition: number;
  enqueueTime: string;
  actualWaitTime: number;
  status: string;
}

export interface StepQueue {
  stepId: string;
  processStep: string;
  stepOrder: number;
  waitingUnitCount: number;
  avgWaitTimeMin: number;
  waitingUnits: WaitingUnit[];
}

export interface DistrictStepQueue {
  districtId: string;
  districtName: string | null;
  steps: StepQueue[];
}
