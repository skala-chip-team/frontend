// 재조정안 비교 펜타곤(레이더) 차트 mock. 백엔드 데이터 계약과 동일 형태 +
// 모핑용 'before'(현재 상태) 기준선을 추가로 포함한다.
// score(0~100): 3개 안 사이 min-max 정규화된 "좋음" 점수 → 레이더 모양에 사용(바깥=좋음).
// raw: 운영자에게 보여줄 실제 값 → 툴팁/라벨에 사용.

export interface PentagonAxisMeta {
  key: string;
  label: string; // 축 라벨 (크게 표시)
  desc: string; // 호버 툴팁 한 줄 설명
  base: boolean; // true=기본 5각, false=stability(6번째 축)
}

export interface PentagonAxisValue {
  raw: string;
  score: number; // 0~100
}

export interface PentagonOption {
  strategy: string;
  label: string;
  recommended: boolean;
  color: string;
  axes: Record<string, PentagonAxisValue>;
}

export interface PentagonData {
  step_id: string;
  risk_unit_count: number;
  before: Record<string, PentagonAxisValue>; // 현재 상태(재조정 전)
  options: PentagonOption[];
}

/** 축 정의 (순서 = 펜타곤 꼭짓점 순서). stability는 6번째(토글 시 육각형). */
export const pentagonAxes: PentagonAxisMeta[] = [
  { key: 'rescue', label: '위험유닛 구제', desc: '위험 유닛을 납기 안에 살린 수 (많을수록 좋음)', base: true },
  { key: 'deadline', label: '납기 안전', desc: '다른 제품 납기를 새로 건드리지 않음 (적을수록 좋음)', base: true },
  { key: 'speed', label: '처리 속도', desc: '전체 완료까지 걸리는 시간 (짧을수록 좋음)', base: true },
  { key: 'wait', label: '대기 단축', desc: '평균 대기 시간 감소폭 (클수록 좋음)', base: true },
  { key: 'utilization', label: '장비 효율', desc: '장비 부하 균형도 (균형 좋을수록 좋음)', base: true },
  { key: 'stability', label: '안정성', desc: '순서가 바뀐 유닛 수 (적을수록 좋음)', base: false },
];

export const pentagonData: PentagonData = {
  step_id: 'STEP_03',
  risk_unit_count: 3,
  // 현재 상태(재조정 전) — 모핑 기준선
  before: {
    rescue: { raw: '3건 위험 (미구제)', score: 0 },
    deadline: { raw: '위험 노출', score: 35 },
    speed: { raw: '90분', score: 18 },
    wait: { raw: '60분', score: 0 },
    utilization: { raw: '52%', score: 40 },
    stability: { raw: '0개', score: 100 },
  },
  options: [
    {
      strategy: 'due_date_first',
      label: '납기 보호형',
      recommended: true,
      color: '#2E7D32',
      axes: {
        rescue: { raw: '3건→0건', score: 100 },
        deadline: { raw: '0건', score: 100 },
        speed: { raw: '45분', score: 100 },
        wait: { raw: '60→45분', score: 100 },
        utilization: { raw: '67%', score: 50 },
        stability: { raw: '1개', score: 100 },
      },
    },
    {
      strategy: 'utilization_balance',
      label: '장비 균형형',
      recommended: false,
      color: '#1565C0',
      axes: {
        rescue: { raw: '3건→1건', score: 0 },
        deadline: { raw: '1건', score: 0 },
        speed: { raw: '80분', score: 0 },
        wait: { raw: '60→60분', score: 0 },
        utilization: { raw: '38% (균등)', score: 100 },
        stability: { raw: '1개', score: 100 },
      },
    },
    {
      strategy: 'line_recovery_first',
      label: '하류 안정형',
      recommended: false,
      color: '#E65100',
      axes: {
        rescue: { raw: '3건→0건', score: 100 },
        deadline: { raw: '0건', score: 100 },
        speed: { raw: '65분', score: 43 },
        wait: { raw: '60→55분', score: 33 },
        utilization: { raw: '46%', score: 70 },
        stability: { raw: '3개', score: 0 },
      },
    },
  ],
};
