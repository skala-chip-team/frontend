import { useQuery } from '@tanstack/react-query';

import { getSimStatus } from '@apis/index';
import type { SimStatus } from '@apis/index';

/**
 * 시뮬레이션 현재 시각/상태.
 * 진행 중이면 2초마다, 멈춰있어도 5초마다 폴링한다.
 * (멈춰도 계속 확인해야 시뮬레이션을 새로 시작했을 때 감지할 수 있다.)
 */
export function useSimStatus() {
  return useQuery<SimStatus>({
    queryKey: ['simStatus'],
    queryFn: getSimStatus,
    refetchInterval: (query) => (query.state.data?.is_running ? 2000 : 5000),
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
}
