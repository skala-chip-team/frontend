import { useQuery } from '@tanstack/react-query';

import { getPredictionStatus } from '@apis/index';
import type { PredictionStatus } from '@apis/index';

/**
 * 지연 예측 시스템 상태(대시보드 위젯용). 10초마다 폴링.
 * 실패 재시도는 1회만(retry:0)으로 콘솔 스팸을 줄인다.
 */
export function usePredictionStatus() {
  return useQuery<PredictionStatus>({
    queryKey: ['predictionStatus'],
    queryFn: getPredictionStatus,
    retry: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
}
