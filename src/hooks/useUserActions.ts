import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assignUserDistricts, changeUserRole, deleteUser } from '@apis/index';

interface SaveWorkerInput {
  userId: string;
  roleName: string;
  districtIds: string[];
}

/** 역할 변경 + 구역 배정을 한 번에 저장. 성공 시 목록 캐시 무효화. */
export function useSaveWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleName, districtIds }: SaveWorkerInput) => {
      await changeUserRole(userId, roleName);
      await assignUserDistricts(userId, districtIds);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

/** 사용자 삭제. 성공 시 목록 캐시 무효화. */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
