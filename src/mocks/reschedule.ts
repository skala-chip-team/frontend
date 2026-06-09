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
export const rescheduleStrategies: RescheduleStrategy[] = [
  {
    key: 'due_date_first',
    name: '납기 우선 전략',
    recommended: true,
    effect: {
      metricLabel: '납기 시간',
      before: '21:00',
      after: '18:00',
      deltaLabel: '3시간 단축',
      deltaDirection: 'down',
    },
    detail: {
      summary:
        '납기 임박 unit 2건(UNIT-901/UNIT-915)을 우선 처리해 누적 지연 5.2h 감소와 납기 위험 2건 해소가 예상됩니다. UNIT-920이 새로 위험권에 진입하는 trade-off가 있어 검토가 필요합니다.',
      metrics: [
        { label: '전체 가동률', before: '62%', value: '74%', deltaLabel: '12%p 증가', direction: 'up', sentiment: 'good' },
        { label: '평균 대기시간', before: '142분', value: '118분', deltaLabel: '24분 단축', direction: 'down', sentiment: 'good' },
        { label: '누적 지연시간', before: '12.4h', value: '7.2h', deltaLabel: '5.2h 감소', direction: 'down', sentiment: 'good' },
        { label: '납기 위험 완화', value: '2건' },
      ],
      queue: {
        before: ['UNIT-820', 'UNIT-831', 'UNIT-901', 'UNIT-915', 'UNIT-840', 'UNIT-920'],
        after: ['UNIT-901', 'UNIT-915', 'UNIT-820', 'UNIT-831', 'UNIT-920', 'UNIT-840'],
        affected: ['UNIT-901', 'UNIT-915', 'UNIT-920'],
      },
      schedule: [
        {
          machine: 'Diffusion A',
          load_before: 58,
          load_after: 72,
          units: [
            { unit_id: 'UNIT-901', start: 8, end: 12, affected: true, due: 15 },
            { unit_id: 'UNIT-820', start: 12, end: 16, affected: false },
          ],
        },
        {
          machine: 'Etching B',
          load_before: 64,
          load_after: 70,
          units: [
            { unit_id: 'UNIT-831', start: 9, end: 13, affected: false },
            { unit_id: 'UNIT-915', start: 13, end: 16, affected: true, due: 17 },
          ],
        },
        {
          machine: 'Packaging C',
          load_before: 75,
          load_after: 63,
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
    key: 'bottleneck_minimization',
    name: '병목 최소화 전략',
    recommended: false,
    effect: {
      metricLabel: '큐 평균 대기 시간',
      before: '142분',
      after: '56분',
      deltaLabel: '86분 단축',
      deltaDirection: 'down',
    },
    detail: {
      summary:
        '병목 step의 대기 큐를 재분배해 평균 대기 시간을 86분 단축합니다. 일부 저우선 unit의 착수가 지연되는 trade-off가 있습니다.',
      metrics: [
        { label: '전체 가동률', before: '62%', value: '71%', deltaLabel: '9%p 증가', direction: 'up', sentiment: 'good' },
        { label: '평균 대기시간', before: '142분', value: '56분', deltaLabel: '86분 단축', direction: 'down', sentiment: 'good' },
        { label: '누적 지연시간', before: '12.4h', value: '9.0h', deltaLabel: '3.4h 감소', direction: 'down', sentiment: 'good' },
        { label: '납기 위험 완화', value: '1건' },
      ],
      queue: {
        before: ['UNIT-901', 'UNIT-820', 'UNIT-831', 'UNIT-915', 'UNIT-840', 'UNIT-920'],
        after: ['UNIT-820', 'UNIT-831', 'UNIT-901', 'UNIT-840', 'UNIT-920', 'UNIT-915'],
        affected: ['UNIT-901', 'UNIT-915', 'UNIT-920'],
      },
      schedule: [
        {
          machine: 'Diffusion A',
          load_before: 70,
          load_after: 62,
          units: [
            { unit_id: 'UNIT-820', start: 8, end: 11, affected: false },
            { unit_id: 'UNIT-901', start: 11, end: 15, affected: true, due: 16 },
          ],
        },
        {
          machine: 'Etching B',
          load_before: 66,
          load_after: 58,
          units: [
            { unit_id: 'UNIT-831', start: 9, end: 12, affected: false },
            { unit_id: 'UNIT-915', start: 13, end: 17, affected: true, due: 18 },
          ],
        },
        {
          machine: 'Packaging C',
          load_before: 60,
          load_after: 64,
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
    key: 'utilization_balance',
    name: '가동률 균형 전략',
    recommended: false,
    effect: {
      metricLabel: '가동률',
      before: '62%',
      after: '83%',
      deltaLabel: '21%p 증가',
      deltaDirection: 'up',
    },
    detail: {
      summary:
        '장비 간 부하를 균형 배분해 전체 가동률을 21%p 끌어올립니다. 셋업 전환이 늘어 평균 대기 단축 폭이 다소 줄어드는 trade-off가 있습니다.',
      metrics: [
        { label: '전체 가동률', before: '62%', value: '83%', deltaLabel: '21%p 증가', direction: 'up', sentiment: 'good' },
        { label: '평균 대기시간', before: '142분', value: '88분', deltaLabel: '54분 단축', direction: 'down', sentiment: 'good' },
        { label: '누적 지연시간', before: '12.4h', value: '8.5h', deltaLabel: '3.9h 감소', direction: 'down', sentiment: 'good' },
        { label: '납기 위험 완화', value: '1건' },
      ],
      queue: {
        before: ['UNIT-820', 'UNIT-831', 'UNIT-840', 'UNIT-901', 'UNIT-915', 'UNIT-920'],
        after: ['UNIT-901', 'UNIT-820', 'UNIT-840', 'UNIT-915', 'UNIT-831', 'UNIT-920'],
        affected: ['UNIT-901', 'UNIT-915', 'UNIT-920'],
      },
      schedule: [
        {
          machine: 'Diffusion A',
          load_before: 55,
          load_after: 78,
          units: [
            { unit_id: 'UNIT-901', start: 8, end: 12, affected: true, due: 14 },
            { unit_id: 'UNIT-820', start: 12, end: 17, affected: false },
          ],
        },
        {
          machine: 'Etching B',
          load_before: 60,
          load_after: 80,
          units: [
            { unit_id: 'UNIT-831', start: 8, end: 11, affected: false },
            { unit_id: 'UNIT-915', start: 12, end: 16, affected: true, due: 18 },
          ],
        },
        {
          machine: 'Packaging C',
          load_before: 72,
          load_after: 86,
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
