import { apiClient } from './axios';
import type { ApiResponse, MachineItem, MachineUpsertRequest, ProcessStepOption } from './types';
import type {
  MachineConfig,
  MachineConfigInput,
  MachineConfigStatus,
  MachineType,
  StepOption,
} from '@/types';

/**
 * 장비 설정 API (ADMIN 전용, 공통 래퍼 → data).
 *   GET    /api/machines?districtId=&stepId=  → MachineItem[]
 *   GET    /api/process-steps                 → ProcessStepOption[]
 *   POST   /api/machines                      → MachineItem (201, machineId 서버 생성)
 *   PUT    /api/machines/{machineId}          → MachineItem
 *   DELETE /api/machines/{machineId}          → null (409: 진행 중 스케줄 시 삭제 거부)
 * 응답(camelCase) ↔ 화면 모델(snake_case) 변환.
 */

function toConfig(item: MachineItem): MachineConfig {
  return {
    machine_id: item.machineId,
    machine_type: item.machineType as MachineType,
    district_id: item.districtId,
    step_id: item.stepId,
    process_step: item.processStep,
    machine_status: item.machineStatus as MachineConfigStatus,
  };
}

function toStepOption(option: ProcessStepOption): StepOption {
  return {
    step_id: option.stepId,
    process_step: option.processStep,
    district_id: option.districtId,
  };
}

function toUpsert(input: MachineConfigInput): MachineUpsertRequest {
  return {
    machineType: input.machine_type,
    districtId: input.district_id,
    stepId: input.step_id, // null이면 공정 매핑 해제
    machineStatus: input.machine_status,
  };
}

export async function getMachines(districtId?: string, stepId?: string): Promise<MachineConfig[]> {
  const params: Record<string, string> = {};
  if (districtId && districtId !== 'all') params.districtId = districtId;
  if (stepId) params.stepId = stepId;
  const { data } = await apiClient.get<ApiResponse<MachineItem[]>>('/api/machines', {
    params: Object.keys(params).length ? params : undefined,
  });
  return data.data.map(toConfig);
}

export async function getProcessSteps(): Promise<StepOption[]> {
  const { data } = await apiClient.get<ApiResponse<ProcessStepOption[]>>('/api/process-steps');
  return data.data.map(toStepOption);
}

export async function createMachine(input: MachineConfigInput): Promise<MachineConfig> {
  const { data } = await apiClient.post<ApiResponse<MachineItem>>('/api/machines', toUpsert(input));
  return toConfig(data.data);
}

export async function updateMachine(
  machineId: string,
  input: MachineConfigInput
): Promise<MachineConfig> {
  const { data } = await apiClient.put<ApiResponse<MachineItem>>(
    `/api/machines/${machineId}`,
    toUpsert(input)
  );
  return toConfig(data.data);
}

export async function deleteMachine(machineId: string): Promise<void> {
  await apiClient.delete(`/api/machines/${machineId}`);
}
