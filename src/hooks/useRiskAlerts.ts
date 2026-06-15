import { useEffect, useRef } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { generateReschedule, getPendingRescheduleGroups, getRescheduleGroupDetail } from '@apis/index';
import { districtLabels, useToastStore, type DistrictId } from '@/stores';
import { processStepLabel } from '@/utils';

/**
 * 위험 탐지 → 자동 재조정안 생성 알림 (실시간/이벤트 기반).
 *
 * pending 재조정 그룹을 5초마다 폴링하고, **최근 생성된(createdAt 기준) 새 그룹**에 대해 1회:
 *  1) "위험이 발생했습니다. 재조정안을 생성합니다" 토스트
 *  2) 옵션이 아직 없으면 자동 생성 → success면 "재조정안이 생성되었습니다" 토스트
 *
 * 설계 메모(이전 버그 수정):
 *  - "첫 로드 스냅샷" 방식은 새로고침할 때마다 현재 그룹이 전부 seen 으로 등록돼 영영 토스트가
 *    안 뜨는 문제가 있었다. → createdAt 이 RECENT_MS 이내인 그룹만 새 위험으로 보고, 이미
 *    알린 group_id 는 localStorage 에 영속해 새로고침에도 중복/누락이 없게 한다.
 *  - 서버 createdAt 은 UTC wall-clock 인데 'Z' 가 없어 브라우저가 로컬시간으로 오해한다.
 *    createdAtMs() 에서 'Z' 를 보정해 TZ 와 무관하게 비교한다.
 *  - refetchIntervalInBackground: 탭이 비활성이어도 폴링을 멈추지 않는다(데모 중 창 전환 대비).
 */

const SEEN_KEY = 'riskAlerts.seen';
const RECENT_MS = 120_000; // 생성 후 2분 이내면 '새 위험'으로 알림

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300))); // 무한 증가 방지
  } catch {
    /* localStorage 불가 시 무시 */
  }
}

/** 서버 createdAt(UTC wall-clock, 'Z' 없음)을 안전하게 ms 로. 오프셋 표기가 이미 있으면 그대로. */
function createdAtMs(createdAt?: string): number {
  if (!createdAt) return NaN;
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(createdAt);
  return new Date(hasZone ? createdAt : `${createdAt}Z`).getTime();
}

export function useRiskAlerts() {
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const seen = useRef<Set<string>>(loadSeen());
  // 해소 알림용: 직전 폴링에서 pending(=활성 위험)이던 그룹 (id → 위치 라벨).
  // pending 목록에서 사라지면 "해결됨"으로 본다(만료/처리/승인). 인메모리(세션 단위).
  const active = useRef<Map<string, string>>(new Map());
  const resolutionReady = useRef(false);

  const { data } = useQuery({
    queryKey: ['riskAlerts'],
    queryFn: getPendingRescheduleGroups,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!data) return;

    const now = Date.now();
    let changed = false;
    const currentIds = new Set(data.map((g) => g.groupId));

    data.forEach((group) => {
      const where = `${districtLabels[group.districtId as DistrictId] ?? group.districtId} · ${processStepLabel(group.processStep)}`;
      active.current.set(group.groupId, where); // 해소 추적용 등록(라벨 캐시)

      if (seen.current.has(group.groupId)) return;
      seen.current.add(group.groupId);
      changed = true;

      // 최근 생성된 그룹만 '새 위험'으로 알림. 오래된 그룹은 조용히 seen 등록(첫 로드 폭주 방지).
      const created = createdAtMs(group.createdAt);
      const isNew = Number.isFinite(created) && now - created < RECENT_MS;
      if (!isNew) return;

      const tone =
        group.riskLevel === 'Critical' ? 'critical' : group.riskLevel === 'High' ? 'high' : 'info';

      // 1) 위험 발생 알림 (항상)
      addToast({
        tone,
        level: group.riskLevel ?? undefined,
        title: '위험이 발생했습니다. 재조정안을 생성합니다',
        description: where,
        groupId: group.groupId,
      });

      // 2) 옵션이 아직 없을 때만 자동 생성 → 생성 완료 알림
      void (async () => {
        try {
          const current = await getRescheduleGroupDetail(group.groupId);
          if (current.options.length > 0) return; // 이미 생성됨 → #1만

          const generated = await generateReschedule(group.groupId);
          queryClient.setQueryData(['rescheduleDetail', group.groupId], generated);
          queryClient.invalidateQueries({ queryKey: ['rescheduleGroups'] });

          if (generated.options.some((option) => option.analysisStatus === 'success')) {
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

    if (changed) saveSeen(seen.current);

    // --- 해소 알림: pending 에서 사라진(해결/처리된) 그룹 ---
    // 첫 폴링은 기준선만 잡고 알림하지 않는다(기존 active 가 전부 '해소'로 쏟아지는 것 방지).
    if (resolutionReady.current) {
      for (const [id, where] of active.current) {
        if (!currentIds.has(id)) {
          addToast({ tone: 'info', title: '위험이 해결되었습니다', description: where });
          active.current.delete(id);
        }
      }
    } else {
      resolutionReady.current = true;
    }
  }, [data, addToast, queryClient]);
}
