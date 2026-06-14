import { useEffect, useRef } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { generateReschedule, getPendingRescheduleGroups, getRescheduleGroupDetail } from '@apis/index';
import { districtLabels, useToastStore, type DistrictId } from '@/stores';
import { processStepLabel } from '@/utils';

/**
 * 위험 탐지 → 자동 재조정안 생성 알림.
 * pending 재조정 그룹을 5초마다 폴링한다.
 * 첫 로드 스냅샷(이미 존재하던 위험)은 알림/자동생성 없이 '본 것'으로 등록만 한다
 *  → 새로고침할 때마다 토스트가 쏟아지는 것을 방지.
 * 이후 세션 중 새로 생기는 위험에 대해서만:
 *  1) "위험이 발생했습니다. 재조정안을 생성합니다" 토스트
 *  2) 재조정안 자동 생성(이미 옵션 있으면 백엔드가 생성한 것으로 보고 재호출 생략)
 *  3) success 옵션이 있으면 "재조정안이 생성되었습니다" 토스트
 * 자동 생성 실패(409 처리 불가 / 502 일시 오류)는 조용히 무시 — 상세에서 수동 재생성 가능.
 */
export function useRiskAlerts() {
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const { data } = useQuery({
    queryKey: ['riskAlerts'],
    queryFn: getPendingRescheduleGroups,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!data) return;

    // 첫 로드: 기존 위험은 알림 없이 '본 것'으로만 등록
    if (!initialized.current) {
      data.forEach((group) => seen.current.add(group.groupId));
      initialized.current = true;
      return;
    }

    data.forEach((group) => {
      if (seen.current.has(group.groupId)) return;
      seen.current.add(group.groupId);

      const tone =
        group.riskLevel === 'Critical' ? 'critical' : group.riskLevel === 'High' ? 'high' : 'info';
      const where = `${districtLabels[group.districtId as DistrictId] ?? group.districtId} · ${processStepLabel(group.processStep)}`;

      // 1) 위험 발생 알림
      addToast({
        tone,
        level: group.riskLevel ?? undefined,
        title: '위험이 발생했습니다. 재조정안을 생성합니다',
        description: where,
        groupId: group.groupId,
      });

      // 2) 재조정안 자동 생성 → 3) 생성 완료 알림
      void (async () => {
        try {
          let detail = await getRescheduleGroupDetail(group.groupId);
          if (detail.options.length === 0) {
            detail = await generateReschedule(group.groupId); // 아직 없으면 직접 생성
          }
          queryClient.setQueryData(['rescheduleDetail', group.groupId], detail);
          queryClient.invalidateQueries({ queryKey: ['rescheduleGroups'] });

          if (detail.options.some((option) => option.analysisStatus === 'success')) {
            addToast({
              tone: 'info',
              title: '재조정안이 생성되었습니다',
              description: where,
              groupId: group.groupId,
            });
          }
        } catch {
          // 409(처리 가능한 위험 없음)·502(일시 오류) 등 자동 생성 실패는 조용히 무시
        }
      })();
    });
  }, [data, addToast, queryClient]);
}
