import { useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getPendingRescheduleGroups } from '@apis/index';
import { useToastStore } from '@/stores';

/**
 * 위험 탐지 알림.
 * pending 재조정 그룹을 5초마다 폴링하고, 처음 보는 groupId마다 토스트 1회.
 * seen은 빈 상태로 시작 → 첫 로드 때 이미 있던 pending도 알림으로 띄운다.
 * (Critical=빨강, High=주황, 그 외=회색. 레벨은 배지로 표시)
 */
export function useRiskAlerts() {
  const addToast = useToastStore((state) => state.addToast);
  const seen = useRef<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ['riskAlerts'],
    queryFn: getPendingRescheduleGroups,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!data) return;

    data.forEach((group) => {
      if (seen.current.has(group.groupId)) return;
      seen.current.add(group.groupId);

      const tone =
        group.riskLevel === 'Critical' ? 'critical' : group.riskLevel === 'High' ? 'high' : 'info';

      addToast({
        tone,
        level: group.riskLevel,
        title: '위험이 탐지되었습니다',
        description: `${group.districtId} · ${group.processStep}`,
        groupId: group.groupId,
      });
    });
  }, [data, addToast]);
}
