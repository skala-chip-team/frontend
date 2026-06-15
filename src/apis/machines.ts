import { machineStore, STEP_OPTIONS } from '@/mocks';
import type { MachineConfig, MachineConfigInput, StepOption } from '@/types';

// import { apiClient } from './axios';
// import type { ApiResponse } from './types';

/**
 * 장비 설정 API.
 *
 * 백엔드 계약(요청서: docs/machine-config-api-요청서.md):
 *   GET    /api/machines              → MachineConfig[]
 *   GET    /api/process-steps         → StepOption[]
 *   POST   /api/machines              → MachineConfig   (body: MachineConfigInput, machine_id 서버 생성)
 *   PUT    /api/machines/{machineId}  → MachineConfig   (body: MachineConfigInput)
 *   DELETE /api/machines/{machineId}  → 204
 *
 * 실 API 연결 전까지 MACHINE_API_READY=false 로 두면 mock store(세션 메모리)로 동작한다.
 * 연결 시 false→true 로 바꾸고 각 함수의 apiClient 분기를 활성화한다.
 */
const MACHINE_API_READY = false;

export async function getMachines(): Promise<MachineConfig[]> {
  if (!MACHINE_API_READY) return machineStore.list();
  // const { data } = await apiClient.get<ApiResponse<MachineConfig[]>>('/api/machines');
  // return data.data;
  return machineStore.list();
}

export async function getProcessSteps(): Promise<StepOption[]> {
  if (!MACHINE_API_READY) return STEP_OPTIONS;
  // const { data } = await apiClient.get<ApiResponse<StepOption[]>>('/api/process-steps');
  // return data.data;
  return STEP_OPTIONS;
}

export async function createMachine(input: MachineConfigInput): Promise<MachineConfig> {
  if (!MACHINE_API_READY) return machineStore.create(input);
  // const { data } = await apiClient.post<ApiResponse<MachineConfig>>('/api/machines', input);
  // return data.data;
  return machineStore.create(input);
}

export async function updateMachine(
  machineId: string,
  input: MachineConfigInput
): Promise<MachineConfig> {
  if (!MACHINE_API_READY) {
    const updated = machineStore.update(machineId, input);
    if (!updated) throw new Error(`장비를 찾을 수 없습니다: ${machineId}`);
    return updated;
  }
  // const { data } = await apiClient.put<ApiResponse<MachineConfig>>(`/api/machines/${machineId}`, input);
  // return data.data;
  const updated = machineStore.update(machineId, input);
  if (!updated) throw new Error(`장비를 찾을 수 없습니다: ${machineId}`);
  return updated;
}

export async function deleteMachine(machineId: string): Promise<void> {
  if (!MACHINE_API_READY) {
    machineStore.remove(machineId);
    return;
  }
  // await apiClient.delete(`/api/machines/${machineId}`);
  machineStore.remove(machineId);
}
