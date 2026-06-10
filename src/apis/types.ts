// API 공통 응답 래퍼 및 monitoring 도메인 응답 타입. 필드명은 백엔드(camelCase) 기준.

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

/** POST /api/auth/login 요청/응답 data */
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  role: string;
}

/** POST /api/auth/signup 요청/응답 data */
export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}
export interface SignUpResponse {
  userId: string;
  username: string;
  email: string;
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
  maxRiskScore: number; // 0~1
  riskLevel: ApiRiskLevel | null; // 만료 등에서 null 가능
  groupStatus: string; // pending / approved / expired
  createdAt: string;
  affectedUnits: RescheduleAffectedUnit[];
}

/** 상세 delayRisks[] 항목 (delay_risk) */
export interface DelayRisk {
  riskId: string;
  unitId: string;
  riskLevel: ApiRiskLevel;
  riskFactor: string; // ex. Machine_Capacity
  riskScore: number; // 0~1
  delayProbability: number; // 0~1
  estimatedDelayHr: number;
  detectionTime: string;
}

/** root_cause.evidence[] 항목 (signal 지표 + 해석) */
export interface RiskEvidence {
  value: number | string | null;
  signal: string;
  interpretation: string;
}

/** 에이전트 원인분석. 미호출 시 null. fallback 시 evidence 비고 category 'Unknown' */
export interface RiskAnalysis {
  root_cause: { category: string; evidence: RiskEvidence[] } | null;
  causal_chain: string | null;
  signal_agreement: string | null;
  analysis_status: string;
}

/** options[].afterSchedule.units[].steps[] */
export interface AfterScheduleStep {
  step_id: string;
  start: string; // ISO
  finish: string; // ISO
  machine_id: string;
}
export interface AfterScheduleUnit {
  unit_id: string;
  steps: AfterScheduleStep[];
}
export interface AfterSchedule {
  units: AfterScheduleUnit[];
}

/** options[].queueReorder[] 항목 */
export interface QueueReorderItem {
  unit_id: string;
  queue_id: string;
  original_queue_position: number;
  new_queue_position: number;
  priority_score: number;
}

/** options[] — 전략별 재조정안 카드. fallback/실패 시 metrics·afterSchedule가 null일 수 있음 */
export interface RescheduleOption {
  strategy: string; // due_date_first | bottleneck_minimization | utilization_balance
  analysisStatus: string; // success | fallback
  fallbackReason: string | null;
  recommended: boolean;
  summary: string;
  selected: boolean;
  estimatedDelayHrAfter: number | null;
  avgWaitTimeMinAfter: number | null;
  avgUtilizationRateAfter: number | null; // 0~1
  maxWaitTimeMinAfter: number | null;
  deadlineViolationCount: number | null;
  afterSchedule: AfterSchedule | null;
  queueReorder: QueueReorderItem[];
}

/** GET /api/reschedule/groups/{groupId} 응답 data */
export interface RescheduleGroupDetail {
  groupId: string;
  districtId: string;
  stepId: string;
  processStep: string;
  stepOrder: number;
  maxDelayProbability: number;
  groupStatus: string;
  actedAt: string;
  delayRisks: DelayRisk[];
  riskAnalysis: RiskAnalysis | null;
  options: RescheduleOption[];
}

/** POST /api/reschedule/groups/{groupId}/select 응답 data */
export interface RescheduleSelectionResult {
  selectionId: string;
  groupId: string;
  strategy: string;
  status: string;
  selectedAt: string;
  groupStatus: string;
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
