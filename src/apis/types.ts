// API 공통 응답 래퍼 및 monitoring 도메인 응답 타입. 필드명은 백엔드(camelCase) 기준.

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

/** GET /api/monitoring/production-status — 생산 완료 현황(생산 완료 알림용) */
export interface ProductionStatus {
  completedTodayQty: number; // 금일 전체 구역 완성품 수(최종 공정 output 합)
  latestCompletionAt: string | null; // 최근 완성 작업 시각(sim)
  planDate: string; // sim 기준 오늘(일 경계 리셋 판별용)
  simulatedAt?: string | null; // 시뮬 기준 스냅샷 시각
}

/** GET /api/reschedule/prediction-status — 지연 예측 시스템 상태(대시보드용) */
export interface PredictionStatus {
  /** SUCCESS(성공) / SKIPPED_INSUFFICIENT(입력 부족) / FAILED(추론 실패) / NONE(시도 없음) */
  status: 'SUCCESS' | 'SKIPPED_INSUFFICIENT' | 'FAILED' | 'NONE';
  message: string | null; // 입력 부족/추론 실패 사유. 정상이면 null
  insertedCount: number | null; // 마지막 예측에서 새로 기록된 위험 수(성공 시)
  lastAttemptAt: string | null; // 마지막 예측 시도 시각(실제 시각)
  latestRiskDetectionTime: string | null; // delay_risk 최신 탐지 시각(sim 시각)
}

/** GET /api/users 항목 (UserSummary) */
export interface UserSummary {
  userId: string;
  username: string;
  email: string;
  role: string; // ADMIN | OPERATOR | WORKER
  active: boolean;
  districtIds: string[]; // 권한 구역 (DST-01 등)
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
  // 그룹 내 최고 등급 위험의 risk_factor(영문 코드). 대표 위험 없으면 null (PR #31~)
  riskFactor?: string | null;
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

/** 적용 전/후 비교 단일 지표 (생산량·누적지연 등) */
export interface MetricDelta {
  before: number;
  after: number;
  delta: number;
}

/** options[].metricsComparison — 적용 전/후 비교. 지표별 계산 실패 시 해당 항목 null */
export interface MetricsComparison {
  completedUnits: MetricDelta | null; // ★ 생산량 차이
  cumulativeDelayHr: MetricDelta | null; // ★ 누적지연 개선
  avgQueueWaitMin: MetricDelta | null;
  deadlineViolationCount: MetricDelta | null;
  overallLoad: MetricDelta | null;
  loadByMachine: Record<string, MetricDelta>; // ★ 장비별 부하율 차이 (정지 장비 제외). 편차 KPI 산출용
}

/** options[].keyImprovements[] — 추천 근거(개선점) */
export interface KeyImprovement {
  description: string;
  magnitude: string;
}

/** options[].keyConcerns[] — 추천 근거(우려점) */
export interface KeyConcern {
  description: string;
  magnitude: string;
  mitigation: string;
}

/** options[].detailedReport — AI 상세 리포트 */
export interface DetailedReport {
  executiveSummary: string;
  riskBackground: string;
  metricAnalysis: string;
  tradeoffs: string;
  decisionBasis: string;
}

/** options[].deadlineImpact — 납기 영향 */
export interface DeadlineImpact {
  rescuedCount: number;
  stillAtRiskCount: number;
  newlyAtRiskCount: number;
  newlyViolatedCount: number;
}

/** options[] — 전략별 재조정안 카드. fallback/실패 시 metrics·afterSchedule가 null일 수 있음 */
export interface RescheduleOption {
  // due_date_first | utilization_balance | line_recovery_first. fallback 시 null 가능
  strategy: string | null;
  analysisStatus: string; // success | fallback
  fallbackReason: string | null;
  recommended: boolean;
  recommendation?: string; // "recommend" | "not_recommend"
  manualReviewRequired?: boolean; // 운영자 수동 검토 대상 여부
  summary: string;
  selected: boolean;
  estimatedDelayHrAfter: number | null;
  avgWaitTimeMinAfter: number | null;
  avgUtilizationRateAfter: number | null; // 0~1
  maxWaitTimeMinAfter: number | null;
  deadlineViolationCount: number | null;
  afterSchedule: AfterSchedule | null;
  queueReorder: QueueReorderItem[];
  // 적용 전/후 비교 — fallback 시 null 가능
  metricsComparison: MetricsComparison | null;
  // 추천 근거
  recommendationReasoning: string | null;
  keyImprovements: KeyImprovement[];
  keyConcerns: KeyConcern[];
  detailedReport: DetailedReport | null;
  deadlineImpact: DeadlineImpact | null;
}

/** GET /api/reschedule/groups/history 응답 data (페이지네이션) */
export interface RescheduleHistoryPage {
  content: RescheduleGroupSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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
  simulatedAt?: string | null; // 재조정안 시뮬 기준 시각(actedAt과 비교)
  delayRisks: DelayRisk[];
  riskAnalysis: RiskAnalysis | null;
  // 적용 전 스케줄 (null 가능). afterSchedule와 동일 구조
  beforeSchedule: AfterSchedule | null;
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

/** GET /api/machines 항목 (장비 설정). stepId/processStep은 미매핑 시 null */
export interface MachineItem {
  machineId: string; // MACHINE-01
  machineType: string; // TYPE_A ~ TYPE_D
  districtId: string;
  stepId: string | null;
  processStep: string | null; // STEP_A ~ STEP_D
  machineStatus: string; // 가동 | 대기 | 정지 | 점검중
}

/** GET /api/process-steps 항목 (구역 × STEP 조합) */
export interface ProcessStepOption {
  stepId: string; // STEP-AF589E464
  processStep: string; // STEP_A
  districtId: string;
}

/** POST/PUT /api/machines 요청 바디 (machineId는 서버 생성) */
export interface MachineUpsertRequest {
  machineType: string;
  districtId: string;
  stepId: string | null; // 매핑 안 하면 null
  machineStatus: string;
}

/** POST /api/chatbot/messages 요청. 첫 메시지엔 sessionId·refTime 생략 가능 */
export interface ChatMessageRequest {
  groupId: string;
  message: string;
  sessionId?: string; // 첫 대화면 생략 → 응답에서 발급된 값을 이후 메시지에 사용
  refTime?: string; // 기준 시각(선택). 첫 메시지엔 불필요
}

/** POST /api/chatbot/messages 응답 data */
export interface ChatMessageResult {
  sessionId: string;
  answer: string;
  toolCalls: string[];
}

/** GET /api/chatbot/sessions 항목 */
export interface ChatSession {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  messageCount: number;
}

/** GET /api/chatbot/sessions/{sessionId}/messages 항목 */
export interface ChatHistoryMessage {
  messageId: string;
  messageType: string; // user / assistant
  content: string;
  createdAt: string;
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
  dailyTargetOutputQty: number; // 일일 목표 생산량
  achievementRate?: number | null; // 달성률(%)=output/target*100. null이면 산출 불가
  simulatedAt?: string | null; // 시뮬 기준 스냅샷 시각
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
  loadRate: number; // 부하율(%)
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

/** GET /api/monitoring/overview — 전체 구역 단일 스냅샷 */
export interface OverviewSummary {
  totalMachineCount: number; // 항상 machines.length 와 일치
  availableMachineCount: number;
  downMachineCount: number;
  avgUtilizationRate: number; // %
  totalWaitingUnitCount: number;
  avgWaitTimeMin: number;
  dailyOutputQty: number;
}

export interface OverviewMachineDto {
  machineId: string;
  machineStatus: string; // 가동 / 점검중 / 정지
  processStep: string; // STEP_A ...
  stepOrder: number;
  utilizationRate: number; // %
  activeUnitId: string | null;
  faultSince: string | null; // 정지 시작 ISO시각
  recoveryEta: string | null; // 항상 null
}

export interface OverviewStepQueueDto {
  processStep: string;
  stepOrder: number;
  waitingUnitCount: number;
}

export interface OverviewDelayRiskDto {
  riskId: string;
  riskLevel: ApiRiskLevel;
  detectionTime: string;
  estimatedDelayHr: number;
  delayProbability: number;
  riskFactor: string;
  unitId: string;
  machineId: string | null;
}

export interface OverviewLatestReschedule {
  groupId: string;
  processStep: string;
  maxRiskScore: number;
  occurredAt: string;
  rootCauseCategory: string;
  affectedUnits: string[];
  delayRisks: OverviewDelayRiskDto[];
}

export interface DistrictOverviewDto {
  districtId: string;
  districtName: string | null;
  summary: OverviewSummary;
  machines: OverviewMachineDto[];
  stepQueues: OverviewStepQueueDto[];
  rescheduleGroupCount: number;
  latestReschedule: OverviewLatestReschedule | null;
}

// ── 주문(Order) 도메인 — GET /api/orders, GET /api/orders/{orderId} ──

/** 주문 목록/상세 공통 헤더 필드 */
export interface OrderBaseDto {
  orderId: string;
  districtId: string;
  districtName: string | null;
  planDate: string; // 'YYYY-MM-DD'
  dueDate: string; // ISO datetime
  plannedOutputQty: number;
  priority: number;
  priorityLabel: string;
  status: string;
  totalUnits: number;
  completedUnits: number;
  progressRatio: number;
  dueImminent: boolean;
  urgent: boolean;
}

/** GET /api/orders data.orders 항목 (units 없음) */
export type OrderListItemDto = OrderBaseDto;

/** GET /api/orders data */
export interface OrderListDto {
  totalCount: number;
  imminentCount: number;
  orders: OrderListItemDto[];
}

/** 주문 상세 unit의 공정 step */
export interface OrderStepDto {
  stepId: string;
  processStep: string; // 'STEP_A' 등
  stepOrder: number;
  stepStatus: string;
}

/** GET /api/orders/{orderId} data.units 항목 */
export interface OrderUnitDto {
  unitId: string;
  unitSizeQty: number;
  unitStatus: string;
  actualStartTime: string | null;
  actualCompleteTime: string | null;
  currentStepId: string | null;
  currentMachineId: string | null;
  estimatedCompleteTime: string | null;
  steps: OrderStepDto[];
}

/** GET /api/orders/{orderId} data */
export interface OrderDetailDto extends OrderBaseDto {
  units: OrderUnitDto[];
}
