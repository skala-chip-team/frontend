import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createMachine,
  deleteMachine,
  getMachines,
  getProcessSteps,
  updateMachine,
} from '@apis/index';
import type { MachineConfigInput } from '@/types';

const MACHINES_KEY = ['machines'];
const STEPS_KEY = ['processSteps'];

/** 장비 목록 */
export function useMachines() {
  return useQuery({ queryKey: MACHINES_KEY, queryFn: () => getMachines() });
}

/** 공정 STEP 옵션 (구역별 A~D) */
export function useProcessSteps() {
  return useQuery({ queryKey: STEPS_KEY, queryFn: getProcessSteps, staleTime: Infinity });
}

/** 장비 추가/수정/삭제 mutation. 성공 시 목록 무효화. */
export function useMachineActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: MACHINES_KEY });

  const create = useMutation({
    mutationFn: (input: MachineConfigInput) => createMachine(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ machineId, input }: { machineId: string; input: MachineConfigInput }) =>
      updateMachine(machineId, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (machineId: string) => deleteMachine(machineId),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
