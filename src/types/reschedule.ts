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
export type StrategyKey = 'due_date_first' | 'utilization_bal' | 'line_recovery';

/** 전략이 1등인 비교 파트 — 배지(아이콘+짧은 단어) 표시용 */
export type StrategyBest = 'rescue' | 'makespan' | 'wait' | 'balance';

export interface UnitRiskChange {
  unit_id: string;
  relieved: boolean; // 조정 후 위험 해소 여부
  is_new?: boolean; // 조정 후 새로 위험권 진입(조정 전에는 위험이 아니던 unit)
  done_before: string; // 조정 전 예상 완료 시각 (ex. '21:00')
  done_after: string; // 조정 후 예상 완료 시각
  delta_hr: number; // 완료 변화(시간). 양수=앞당김, 음수=지연
}

export interface MachineUtilChange {
  machine: string; // 표시 장비명
  util_before: number; // 가동률 이전(%)
  util_after: number; // 가동률 이후(%)
}

/** 전략 비교 섹션 데이터 — 전/후 인터랙션 비교용 */
export interface StrategyCompare {
  units: UnitRiskChange[]; // 위험 unit 변화(구제/잔존/신규)
  makespan_before_min: number; // 전체 완료 소요 이전(분)
  makespan_after_min: number; // 전체 완료 소요 이후(분)
  wait_before_min: number; // 평균 대기 이전(분)
  wait_after_min: number; // 평균 대기 이후(분)
  utils: MachineUtilChange[]; // 장비별 부하율 전/후
  util_dev_pp: number; // 부하율 편차(±%p, 최대-최소 기준)
  util_dev_label: string; // ex. '편차 큼', '매우 균등'
  moved_units: number; // 순서 바뀐 unit 수
  radar: number[]; // 레이더 6축 점수(0~100) — RADAR_AXES 순서
  bests: StrategyBest[]; // 이 전략이 1등인 파트
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
  queue: QueueState; // 큐 우선순위 변경(이전/이후)
  schedule: ScheduleMachineRow[]; // 스케줄 변경 간트
  dueRelief: DueReliefUnit[]; // 납기 위험 완화 UNIT
}

/** 후보안 카드의 핵심 효과 — 전→후 + 개선폭 (ex. 21:00 → 18:00, 3시간 확보) */
export interface CandidateEffect {
  metric: string; // ex. '위험 유닛 납기 완료 시간'
  before: string;
  after: string;
  delta: string; // ex. '3시간 확보'
}

/** 후보안 카드 메타 — 제목/선택 기준/핵심 효과 */
export interface CandidateMeta {
  badge: string; // ex. '후보A안'
  title: string; // ex. '유닛 납기 우선 전략'
  whenLead: string; // 선택 기준 설명 중 강조할 앞부분 (ex. '납기가 임박한 유닛을 먼저 끝내는 것')
  whenTail: string; // 나머지 (ex. '이 중요할 때 적용해야 할 전략입니다')
  effect: CandidateEffect;
}

export interface RescheduleStrategy {
  key: StrategyKey;
  name: string; // ex. '유닛 납기 우선 전략'
  recommended: boolean;
  candidate: CandidateMeta; // 후보안 카드용
  compare: StrategyCompare; // 전략 비교 섹션용
  detail: StrategyDetail; // 하단 상세(큐/간트/납기완화)용
}
