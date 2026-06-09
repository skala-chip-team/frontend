// 재조정안 관련 타입. 필드명은 docs/data.dbml 컬럼명을 따른다.
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type GroupStatus = 'pending' | 'approved' | 'expired';
export type RescheduleDistrict = 'A' | 'B' | 'C';

export interface AffectedUnit {
  unit_id: string; // unit_master.unit_id
  risk_score: number; // delay_risk.risk_score
  delay_probability: number; // delay_risk.delay_probability (0~1)
  estimated_delay_hr: number; // delay_risk.estimated_delay_hr
}

export interface RescheduleGroup {
  group_id: string; // reschedule_group.group_id
  district_id: RescheduleDistrict; // reschedule_group.district_id
  process_step: string; // process_step_order.process_step (ex. 'Step 4')
  max_risk_score: number; // reschedule_group.max_risk_score
  risk_level: RiskLevel; // delay_risk.risk_level
  risk_factor: string; // delay_risk.risk_factor (ex. '납기 위험')
  affected_units: AffectedUnit[]; // 멤버 delay_risk
  group_status: GroupStatus; // reschedule_group.group_status
}

// reschedule_selection.strategy 값
export type StrategyKey = 'due_date_first' | 'bottleneck_minimization' | 'utilization_balance';

export interface StrategyEffect {
  metricLabel: string; // ex. '납기 시간'
  before: string; // ex. '21:00'
  after: string; // ex. '18:00'
  deltaLabel: string; // ex. '3시간 단축'
  deltaDirection: 'up' | 'down'; // 지표 변화 방향(표시용)
}

export interface StrategyMetric {
  label: string; // ex. '전체 가동률'
  value: string; // 표시 값(이후/카운트) ex. '83%', '2건'
  before?: string; // 있으면 before→value 표시
  deltaLabel?: string; // ex. '21%p 증가'
  direction?: 'up' | 'down' | 'flat'; // 화살표 방향
  sentiment?: 'good' | 'bad' | 'neutral'; // 색상(개선=good)
}

export interface ScheduleUnitBar {
  unit_id: string;
  start: number; // 시작(시)
  end: number; // 완료(시)
  affected: boolean; // 위험 영향 unit
  due?: number; // 오늘 납기 시각(시) — 납기가 오늘이고 차트 범위 내일 때 위치 표시용
  due_today?: boolean; // 납기가 오늘인지(기본 true)
  due_label?: string; // 표시 라벨. 오늘이 아니면 'YYYY.MM.DD HH:00'
  due_lead_hr?: number; // 완료 대비 납기까지 여유 시간(시간) — 오늘이 아닐 때 사용
}

export interface ScheduleMachineRow {
  machine: string; // 표시 장비명
  load_before: number; // 부하율 이전(%)
  load_after: number; // 부하율 이후(%)
  units: ScheduleUnitBar[];
}

export interface DueReliefUnit {
  unit_id: string;
  before: string; // 이전 완료 시각
  after: string; // 이후 완료 시각
  delta_hr: number; // 앞당겨진 시간
}

export interface QueueState {
  before: string[]; // 이전 대기열(우선순위 순 unit_id)
  after: string[]; // 이후 대기열(우선순위 순 unit_id)
  affected: string[]; // 위험으로 영향받는 unit_id
}

export interface StrategyDetail {
  summary: string; // 핵심 내용 한 줄
  metrics: StrategyMetric[]; // 핵심 효과 카드
  queue: QueueState; // 큐 우선순위 변경(이전/이후)
  schedule: ScheduleMachineRow[]; // 스케줄 변경 간트
  dueRelief: DueReliefUnit[]; // 납기 위험 완화 UNIT
}

export interface RescheduleStrategy {
  key: StrategyKey;
  name: string; // ex. '납기 우선 전략'
  recommended: boolean;
  effect: StrategyEffect; // 목록 카드용 대표 효과
  detail: StrategyDetail; // 상세 패널용
}
