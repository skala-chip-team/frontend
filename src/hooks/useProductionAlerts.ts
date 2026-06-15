import { useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getProductionStatus } from '@apis/index';
import type { ProductionStatus } from '@apis/index';
import { useToastStore } from '@/stores';

/**
 * 생산 완료 알림.
 * 금일 완성품 수(completedTodayQty)를 10초마다 폴링하고, **증가분**이 생기면
 * "생산 N개 완료" 토스트를 띄운다.
 * - 첫 폴링은 기준선만 잡고 알림하지 않는다(기존 누적분 폭주 방지).
 * - planDate(=sim 오늘)가 바뀌면(일 경계/시뮬 리셋) 기준선을 다시 잡는다(음수 델타 무시).
 */
export function useProductionAlerts() {
  const addToast = useToastStore((state) => state.addToast);
  const prevQty = useRef<number | null>(null);
  const prevDate = useRef<string | null>(null);

  const { data } = useQuery<ProductionStatus>({
    queryKey: ['productionStatus'],
    queryFn: getProductionStatus,
    retry: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!data) return;
    const { completedTodayQty, planDate } = data;

    // 날짜가 바뀌었거나 첫 관측 → 기준선만 잡고 알림 안 함
    if (prevDate.current !== planDate || prevQty.current === null) {
      prevDate.current = planDate;
      prevQty.current = completedTodayQty;
      return;
    }

    const delta = completedTodayQty - prevQty.current;
    prevQty.current = completedTodayQty;
    if (delta > 0) {
      addToast({
        tone: 'info',
        title: '생산 완료',
        description: `완성품 ${delta.toLocaleString()}개가 생산되었습니다`,
      });
    }
  }, [data, addToast]);
}
