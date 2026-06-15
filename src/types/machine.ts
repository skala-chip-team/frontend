// 장비 설정(Machine Config) 도메인 타입. 필드명은 docs/data.dbml(TM_MACHINE_MASTER) 기준.

export type MachineType = 'TYPE_A' | 'TYPE_B' | 'TYPE_C' | 'TYPE_D';

/** 장비 가동 상태 (machine_master.machine_status) */
export type MachineConfigStatus = '가동' | '대기' | '정지' | '점검중';

/** 공정 STEP 옵션 (process_step_order + 매핑 대상) */
export interface StepOption {
  step_id: string; // process_step_order.step_id
  process_step: string; // STEP_A ~ STEP_D
  district_id: string; // 이 STEP이 속한 구역
}

/** 장비 설정 행: 장비 마스터 + 매핑된 STEP 1개 */
export interface MachineConfig {
  machine_id: string; // 자동 생성 (MACHINE-NN)
  machine_type: MachineType;
  district_id: string; // 소속 구역 (DST-01 …)
  step_id: string; // 매핑된 STEP (1개)
  process_step: string; // STEP_A~D (step_id에서 파생, 표시용)
  machine_status: MachineConfigStatus;
}

/** 추가/수정 폼 입력값 (machine_id는 추가 시 서버 생성, 수정 시 식별자로 사용) */
export interface MachineConfigInput {
  machine_type: MachineType;
  district_id: string;
  step_id: string;
  machine_status: MachineConfigStatus;
}
