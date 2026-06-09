// API 공통 응답 래퍼 및 monitoring 도메인 응답 타입. 필드명은 백엔드(camelCase) 기준.

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
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
