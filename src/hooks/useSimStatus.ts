import { useQuery } from '@tanstack/react-query';

import { getSimStatus } from '@apis/index';
import type { SimStatus } from '@apis/index';

/**
 * 시뮬레이션 현재 시각/상태.
 * 진행 중이면 2초, 멈춰있어도 5초마다 폴링한다(서버가 다시 뜨면 5초 안에 시계 복구).
 * 실패 시 재시도는 1회만(retry:0)으로 콘솔 스팸을 줄인다.
 */
export function useSimStatus() {
  return useQuery<SimStatus>({
    queryKey: ['simStatus'],
    queryFn: getSimStatus,
    retry: 0,
    refetchInterval: (query) => (query.state.data?.is_running ? 2000 : 5000),
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
}
