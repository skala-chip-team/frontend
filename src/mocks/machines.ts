import type {
  MachineConfig,
  MachineConfigInput,
  MachineConfigStatus,
  MachineType,
  StepOption,
} from '@/types';

// 장비 설정 mock — 실 API 연결 전까지 화면이 실제로 동작하도록 세션 메모리에 보관한다.
// (apis/machines.ts 가 이 store 를 통해 목록/추가/수정/삭제를 처리)

const DISTRICTS = ['DST-01', 'DST-02'];
const STEP_LETTERS = ['A', 'B', 'C', 'D'] as const;

/** 구역별 STEP A~D 옵션 (step_id 는 합성값) */
export const STEP_OPTIONS: StepOption[] = DISTRICTS.flatMap((district) =>
  STEP_LETTERS.map((letter) => ({
    step_id: `STEP-${district}-${letter}`,
    process_step: `STEP_${letter}`,
    district_id: district,
  }))
);

function stepIdOf(district: string, letter: string): string {
  return `STEP-${district}-${letter}`;
}

const m = (
  num: number,
  type: MachineType,
  district: string,
  letter: (typeof STEP_LETTERS)[number],
  status: MachineConfigStatus
): MachineConfig => ({
  machine_id: `MACHINE-${String(num).padStart(2, '0')}`,
  machine_type: type,
  district_id: district,
  step_id: stepIdOf(district, letter),
  process_step: `STEP_${letter}`,
  machine_status: status,
});

// 초기 mock 장비 (구역/스텝/타입/상태가 고루 섞이도록)
const SEED: MachineConfig[] = [
  m(1, 'TYPE_A', 'DST-01', 'A', '가동'),
  m(2, 'TYPE_A', 'DST-01', 'A', '점검중'),
  m(10, 'TYPE_B', 'DST-01', 'B', '가동'),
  m(11, 'TYPE_B', 'DST-01', 'B', '대기'),
  m(22, 'TYPE_C', 'DST-01', 'C', '정지'),
  m(31, 'TYPE_D', 'DST-01', 'D', '가동'),
  m(5, 'TYPE_A', 'DST-02', 'A', '가동'),
  m(16, 'TYPE_B', 'DST-02', 'B', '점검중'),
  m(26, 'TYPE_C', 'DST-02', 'C', '가동'),
  m(35, 'TYPE_D', 'DST-02', 'D', '대기'),
];

// 세션 동안 유지되는 가변 store (새로고침 시 SEED 로 초기화)
let store: MachineConfig[] = SEED.map((x) => ({ ...x }));

function processStepOf(stepId: string): string {
  return STEP_OPTIONS.find((s) => s.step_id === stepId)?.process_step ?? stepId;
}

/** 다음 MACHINE-NN 번호 부여 */
function nextMachineId(): string {
  const max = store.reduce((acc, x) => {
    const n = parseInt(x.machine_id.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `MACHINE-${String(max + 1).padStart(2, '0')}`;
}

export const machineStore = {
  list(): MachineConfig[] {
    return store.map((x) => ({ ...x }));
  },
  create(input: MachineConfigInput): MachineConfig {
    const created: MachineConfig = {
      machine_id: nextMachineId(),
      ...input,
      process_step: processStepOf(input.step_id),
    };
    store = [created, ...store];
    return created;
  },
  update(machineId: string, input: MachineConfigInput): MachineConfig | null {
    let updated: MachineConfig | null = null;
    store = store.map((x) => {
      if (x.machine_id !== machineId) return x;
      updated = { ...x, ...input, process_step: processStepOf(input.step_id) };
      return updated;
    });
    return updated;
  },
  remove(machineId: string): void {
    store = store.filter((x) => x.machine_id !== machineId);
  },
};
