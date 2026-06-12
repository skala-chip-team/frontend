import { useQuery } from '@tanstack/react-query';

import { getUsers } from '@apis/index';
import type { UserSummary } from '@apis/index';

/** 사용자(작업자) 목록. ADMIN 전용 API. */
export function useUsers() {
  return useQuery<UserSummary[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });
}
