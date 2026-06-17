import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSimStatus, startSim, stopSim } from '@apis/index';
import type { SimStatus } from '@apis/index';
import { useToastStore } from '@/stores';
import { getApiErrorMessage } from '@/utils';

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

/**
 * 시뮬레이션 시작/정지 제어. 성공하면 상태(시계)를 즉시 갱신하고, 실패하면 토스트로 알린다.
 */
export function useSimControl() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const refreshStatus = () => queryClient.invalidateQueries({ queryKey: ['simStatus'] });
  const onError = (label: string) => (error: unknown) =>
    addToast({
      tone: 'critical',
      title: `시뮬레이션 ${label} 실패`,
      description: getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
    });

  const start = useMutation({
    mutationFn: startSim,
    onSuccess: refreshStatus,
    onError: onError('시작'),
  });
  const stop = useMutation({
    mutationFn: stopSim,
    onSuccess: refreshStatus,
    onError: onError('정지'),
  });

  return { start, stop };
}
