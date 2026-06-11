import type {
  AffectedUnit,
  RescheduleDistrict,
  RescheduleGroup,
  RescheduleStrategy,
} from '@/types';

// risk_score / delay_probability 는 지연예측시간 기반으로 도출(mock)
const au = (unit_id: string, estimated_delay_hr: number): AffectedUnit => ({
  unit_id,
  estimated_delay_hr,
  risk_score: Math.min(99, Math.round(42 + estimated_delay_hr * 9)),
  delay_probability: Math.min(0.98, Math.round((0.34 + estimated_delay_hr * 0.1) * 100) / 100),
});

const g = (
  group_id: string,
  district_id: RescheduleDistrict,
  process_step: string,
  max_risk_score: number,
  risk_level: RescheduleGroup['risk_level'],
  risk_factor: string,
  affected_units: AffectedUnit[],
  group_status: RescheduleGroup['group_status']
): RescheduleGroup => ({
  group_id,
  district_id,
  process_step,
  max_risk_score,
  risk_level,
  risk_factor,
  affected_units,
  group_status,
});

export const rescheduleGroups: RescheduleGroup[] = [
  g('RG-2041', 'A', 'Step 4', 96, 'High', '납기 위험', [au('UNIT-041', 5.5), au('UNIT-117', 3.0), au('UNIT-233', 2.0)], 'pending'),
  g('RG-2042', 'A', 'Step 2', 72, 'Medium', '병목 심화', [au('UNIT-201', 2.5), au('UNIT-205', 1.5)], 'pending'),
  g('RG-2043', 'A', 'Step 1', 48, 'Low', '가동률 저하', [au('UNIT-012', 1.0)], 'approved'),
  g('RG-2044', 'A', 'Step 3', 88, 'High', '장비 고장 위험', [au('UNIT-301', 6.0), au('UNIT-309', 4.5), au('UNIT-318', 3.5), au('UNIT-340', 2.0)], 'pending'),
  g('RG-2045', 'A', 'Step 2', 61, 'Medium', '자재 부족', [au('UNIT-210', 2.0), au('UNIT-219', 1.5)], 'expired'),
  g('RG-3120', 'B', 'Step 1', 91, 'High', '납기 위험', [au('UNIT-510', 4.0), au('UNIT-522', 2.5)], 'pending'),
  g('RG-3121', 'B', 'Step 3', 67, 'Medium', '병목 심화', [au('UNIT-701', 3.0), au('UNIT-712', 2.0), au('UNIT-720', 1.0)], 'pending'),
  g('RG-3122', 'B', 'Step 2', 54, 'Low', '가동률 저하', [au('UNIT-601', 1.5)], 'approved'),
  g('RG-3123', 'B', 'Step 1', 83, 'High', '자재 부족', [au('UNIT-531', 3.5), au('UNIT-540', 2.5)], 'expired'),
  g('RG-4205', 'C', 'Step 2', 79, 'Medium', '납기 위험', [au('UNIT-820', 3.0), au('UNIT-831', 2.5), au('UNIT-840', 1.5)], 'pending'),
  g('RG-4206', 'C', 'Step 3', 94, 'High', '장비 고장 위험', [au('UNIT-901', 5.0), au('UNIT-915', 3.5), au('UNIT-920', 2.0)], 'pending'),
  g('RG-4207', 'C', 'Step 1', 42, 'Low', '가동률 저하', [au('UNIT-801', 1.0)], 'approved'),
  g('RG-4208', 'C', 'Step 2', 70, 'Medium', '병목 심화', [au('UNIT-851', 2.5), au('UNIT-860', 1.5)], 'expired'),
  g('RG-4209', 'C', 'Step 3', 86, 'High', '납기 위험', [au('UNIT-931', 4.0)], 'pending'),
];

// 위험 원인별 원인 설명 list (mock)
export const riskReasonsByFactor: Record<string, string[]> = {
  '병목 심화': [
    '현재 큐 깊이가 5로, 평균 대비 2.3배 수준. 단기간 적체 신호가 강합니다.',
    '처리 용량의 87%가 사용 중이라 신규 unit 처리 슬랙이 거의 없는 상태로 추정됩니다.',
    '최근 3시간 평균 대기 시간이 142분으로, 같은 step의 24h 평균 38분 대비 3.7배입니다.',
  ],
  '납기 위험': [
    '잔여 작업 기준 예상 완료가 납기를 약 3시간 초과합니다.',
    '선행 step 지연이 누적되어 착수 시점이 계획 대비 늦어졌습니다.',
    '대체 가능한 동일 공정 장비가 현재 모두 가동 중입니다.',
  ],
  '장비 고장 위험': [
    '직전 24시간 내 동일 장비에서 경고 이벤트가 4건 발생했습니다.',
    '점검 주기를 초과해 고장 확률이 상승 구간에 진입했습니다.',
    '고장 시 후속 step 전체가 정지될 수 있는 단일 장비 의존 구조입니다.',
  ],
  '자재 부족': [
    '현재 자재 재고가 안전 재고(min) 이하로 떨어졌습니다.',
    '다음 입고 예정 시점까지 예상 소요량을 충당하기 어렵습니다.',
    '동일 자재를 사용하는 인접 step과 수요가 겹칩니다.',
  ],
  '가동률 저하': [
    '최근 3시간 평균 가동률이 같은 step 24h 평균 대비 낮습니다.',
    '유휴 시간이 분산되어 처리량 손실이 누적되고 있습니다.',
    '작업 배분 불균형으로 일부 장비에 부하가 몰려 있습니다.',
  ],
};

// 재조정 전략(고정 3종). 효과 수치는 mock.
// compare.radar 축 순서: 위험 구제 / 신규 차단 / 완료 속도 / 대기 개선 / 부하 균등 / 순서 안정
export const rescheduleStrategies: RescheduleStrategy[] = [
  {
    key: 'due_date_first',
    name: '납기 보호형',
    recommended: true,
    compare: {
      units: [
        { unit_id: 'UNIT-901', relieved: true },
        { unit_id: 'UNIT-915', relieved: true },
        { unit_id: 'UNIT-920', relieved: true },
      ],
      makespan_before_min: 90,
      makespan_after_min: 45,
      wait_before_min: 60,
      wait_after_min: 45,
      utils: [
        { machine: 'Diffusion A', util_before: 55, util_after: 92 },
        { machine: 'Etching B', util_before: 48, util_after: 71 },
        { machine: 'Packaging C', util_before: 35, util_after: 38 },
      ],
      util_summary: '평균 67% · 편차 큼',
      moved_units: 1,
      radar: [100, 100, 100, 100, 45, 100],
      bests: ['rescue', 'makespan', 'wait'],
    },
    detail: {
      summary:
        '납기 임박 unit을 최우선 배치해 위험 3건을 모두 구제합니다. 전체 완료 45분으로 가장 빠르고 순서 변경은 1건에 그치지만, 장비 간 부하 편차가 커집니다.',
      queue: {
        before: ['UNIT-820', 'UNIT-831', 'UNIT-901', 'UNIT-915', 'UNIT-840', 'UNIT-920'],
        after: ['UNIT-901', 'UNIT-915', 'UNIT-820', 'UNIT-831', 'UNIT-920', 'UNIT-840'],
        affected: ['UNIT-901', 'UNIT-915', 'UNIT-920'],
      },
      schedule: [
        {
          machine: 'Diffusion A',
          load_before: 55,
          load_after: 92,
          units: [
            { unit_id: 'UNIT-901', start: 8, end: 12, affected: true, due: 15 },
            { unit_id: 'UNIT-820', start: 12, end: 16, affected: false },
          ],
        },
        {
          machine: 'Etching B',
          load_before: 48,
          load_after: 71,
          units: [
            { unit_id: 'UNIT-831', start: 9, end: 13, affected: false },
            { unit_id: 'UNIT-915', start: 13, end: 16, affected: true, due: 17 },
          ],
        },
        {
          machine: 'Packaging C',
          load_before: 35,
          load_after: 38,
          units: [
            { unit_id: 'UNIT-840', start: 8, end: 12, affected: false },
            {
              unit_id: 'UNIT-920',
              start: 14,
              end: 18,
              affected: true,
              due_today: false,
              due_label: '2026.06.10 18:00',
              due_lead_hr: 25,
            },
          ],
        },
      ],
      dueRelief: [
        { unit_id: 'UNIT-901', before: '21:00', after: '18:00', delta_hr: 3 },
        { unit_id: 'UNIT-915', before: '19:30', after: '18:00', delta_hr: 1.5 },
        { unit_id: 'UNIT-933', before: '20:00', after: '17:30', delta_hr: 2.5 },
        { unit_id: 'UNIT-948', before: '18:30', after: '17:00', delta_hr: 1.5 },
      ],
    },
  },
  {
    key: 'utilization_bal',
    name: '장비 균형형',
    recommended: false,
    compare: {
      units: [
        { unit_id: 'UNIT-901', relieved: true },
        { unit_id: 'UNIT-915', relieved: true },
        { unit_id: 'UNIT-920', relieved: false },
        { unit_id: 'UNIT-840', relieved: false, is_new: true },
      ],
      makespan_before_min: 90,
      makespan_after_min: 80,
      wait_before_min: 60,
      wait_after_min: 60,
      utils: [
        { machine: 'Diffusion A', util_before: 55, util_after: 40 },
        { machine: 'Etching B', util_before: 48, util_after: 38 },
        { machine: 'Packaging C', util_before: 35, util_after: 36 },
      ],
      util_summary: '평균 38% · 균등 분배',
      moved_units: 1,
      radar: [55, 40, 25, 15, 100, 100],
      bests: ['balance'],
    },
    detail: {
      summary:
        '장비 간 부하를 균등 분배해 가동률 편차를 최소화합니다. UNIT-920 위험이 남고 UNIT-840이 새로 위험권에 진입하는 trade-off가 있습니다.',
      queue: {
        before: ['UNIT-901', 'UNIT-820', 'UNIT-831', 'UNIT-915', 'UNIT-840', 'UNIT-920'],
        after: ['UNIT-820', 'UNIT-831', 'UNIT-901', 'UNIT-840', 'UNIT-920', 'UNIT-915'],
        affected: ['UNIT-901', 'UNIT-915', 'UNIT-920'],
      },
      schedule: [
        {
          machine: 'Diffusion A',
          load_before: 55,
          load_after: 40,
          units: [
            { unit_id: 'UNIT-820', start: 8, end: 11, affected: false },
            { unit_id: 'UNIT-901', start: 11, end: 15, affected: true, due: 16 },
          ],
        },
        {
          machine: 'Etching B',
          load_before: 48,
          load_after: 38,
          units: [
            { unit_id: 'UNIT-831', start: 9, end: 12, affected: false },
            { unit_id: 'UNIT-915', start: 13, end: 17, affected: true, due: 18 },
          ],
        },
        {
          machine: 'Packaging C',
          load_before: 35,
          load_after: 36,
          units: [
            { unit_id: 'UNIT-840', start: 8, end: 13, affected: false },
            {
              unit_id: 'UNIT-920',
              start: 14,
              end: 18,
              affected: true,
              due_today: false,
              due_label: '2026.06.10 12:00',
              due_lead_hr: 19,
            },
          ],
        },
      ],
      dueRelief: [
        { unit_id: 'UNIT-901', before: '18:00', after: '16:00', delta_hr: 2 },
        { unit_id: 'UNIT-915', before: '19:00', after: '17:00', delta_hr: 2 },
      ],
    },
  },
  {
    key: 'line_recovery',
    name: '하류 안정형',
    recommended: false,
    compare: {
      units: [
        { unit_id: 'UNIT-901', relieved: true },
        { unit_id: 'UNIT-915', relieved: true },
        { unit_id: 'UNIT-920', relieved: true },
      ],
      makespan_before_min: 90,
      makespan_after_min: 65,
      wait_before_min: 60,
      wait_after_min: 55,
      utils: [
        { machine: 'Diffusion A', util_before: 55, util_after: 50 },
        { machine: 'Etching B', util_before: 48, util_after: 46 },
        { machine: 'Packaging C', util_before: 35, util_after: 42 },
      ],
      util_summary: '평균 46% · 비교적 균등',
      moved_units: 3,
      radar: [100, 100, 60, 70, 60, 25],
      bests: ['rescue'],
    },
    detail: {
      summary:
        '하류 공정 안정을 우선해 순서를 재배치합니다. 위험 3건을 모두 구제하지만 순서 변경이 3건으로 가장 많습니다.',
      queue: {
        before: ['UNIT-820', 'UNIT-831', 'UNIT-840', 'UNIT-901', 'UNIT-915', 'UNIT-920'],
        after: ['UNIT-901', 'UNIT-820', 'UNIT-840', 'UNIT-915', 'UNIT-831', 'UNIT-920'],
        affected: ['UNIT-901', 'UNIT-915', 'UNIT-920'],
      },
      schedule: [
        {
          machine: 'Diffusion A',
          load_before: 55,
          load_after: 50,
          units: [
            { unit_id: 'UNIT-901', start: 8, end: 12, affected: true, due: 14 },
            { unit_id: 'UNIT-820', start: 12, end: 17, affected: false },
          ],
        },
        {
          machine: 'Etching B',
          load_before: 48,
          load_after: 46,
          units: [
            { unit_id: 'UNIT-831', start: 8, end: 11, affected: false },
            { unit_id: 'UNIT-915', start: 12, end: 16, affected: true, due: 18 },
          ],
        },
        {
          machine: 'Packaging C',
          load_before: 35,
          load_after: 42,
          units: [
            { unit_id: 'UNIT-840', start: 9, end: 13, affected: false },
            {
              unit_id: 'UNIT-920',
              start: 13,
              end: 18,
              affected: true,
              due_today: false,
              due_label: '2026.06.11 09:00',
              due_lead_hr: 39,
            },
          ],
        },
      ],
      dueRelief: [
        { unit_id: 'UNIT-901', before: '16:00', after: '14:30', delta_hr: 1.5 },
        { unit_id: 'UNIT-915', before: '19:00', after: '17:00', delta_hr: 2 },
        { unit_id: 'UNIT-948', before: '18:00', after: '16:30', delta_hr: 1.5 },
      ],
    },
  },
];
