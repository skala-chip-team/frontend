// 재조정안 관련 타입. 필드명은 docs/data.dbml 컬럼명을 따른다.
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type GroupStatus = 'pending' | 'approved' | 'expired';
export type RescheduleDistrict = 'A' | 'B' | 'C';

export interface AffectedUnit {
  unit_id: string; // unit_master.unit_id
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
  before: string; // ex. '62%'
  after: string; // ex. '83%'
  deltaLabel: string; // ex. '21%p 증가'
  direction: 'up' | 'down' | 'flat'; // 화살표 방향
  sentiment: 'good' | 'bad' | 'neutral'; // 색상(개선=good)
}

export interface StrategyDetail {
  summary: string; // 핵심 내용 한 줄
  metrics: StrategyMetric[]; // 핵심 효과 카드
}

export interface RescheduleStrategy {
  key: StrategyKey;
  name: string; // ex. '납기 우선 전략'
  recommended: boolean;
  effect: StrategyEffect; // 목록 카드용 대표 효과
  detail: StrategyDetail; // 상세 패널용
}
