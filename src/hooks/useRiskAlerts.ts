import { useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getPendingRescheduleGroups, getRescheduleGroupDetail } from '@apis/index';
import { districtLabels, useNotificationStore, useToastStore, type DistrictId } from '@/stores';
import { processStepLabel } from '@/utils';
import { useSimStatus } from './useSimStatus';

/**
 * 위험 탐지 → (백엔드 자동) 재조정안 생성 알림 (실시간/이벤트 기반).
 *
 * pending 재조정 그룹을 5초마다 폴링하고, **최근 생성된(createdAt 기준) 새 그룹**에 대해:
 *  1) "위험이 발생했습니다. 재조정안을 생성합니다" 토스트 (1회)
 *  2) 생성은 백엔드가 자동으로 하므로, 그룹 상세를 폴링하며 옵션이 생기면(=생성 완료)
 *     "재조정안이 생성되었습니다" 토스트 (1회). fallback만 나오면 '운영자 검토 필요'로 안내.
 *
 * 설계 메모:
 *  - createdAt 이 RECENT_MS 이내인 그룹만 새 위험으로 보고, 이미 알린 group_id 는 localStorage 에
 *    영속해 새로고침에도 중복/누락이 없게 한다.
 *  - 서버 createdAt 은 UTC wall-clock('Z' 없음) → createdAtMs() 에서 보정.
 *  - refetchIntervalInBackground: 탭 비활성에도 폴링 유지(데모 중 창 전환 대비).
 */

const SEEN_KEY = 'riskAlerts.seen';
const GEN_KEY = 'riskAlerts.generated'; // 생성 완료 알림을 이미 띄운 group_id
const RECENT_MS = 120_000; // 생성 후 2분 이내면 '새 위험'으로 알림

function loadIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveIds(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids].slice(-300))); // 무한 증가 방지
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
  const logNotification = useNotificationStore((state) => state.add);
  const clearNotifications = useNotificationStore((state) => state.clear);
  const seen = useRef<Set<string>>(loadIds(SEEN_KEY)); // '위험 발생' 알림 띄운 그룹
  const generated = useRef<Set<string>>(loadIds(GEN_KEY)); // '생성 완료' 알림 띄운(또는 baseline) 그룹
  const awaitingGen = useRef<Set<string>>(new Set()); // 옵션이 비어 '생성 중'으로 관찰한 그룹
  const inflight = useRef<Set<string>>(new Set()); // 상세 조회 중복 방지
  // 해소 알림용: 직전 폴링에서 pending(=활성 위험)이던 그룹 (id → 위치 라벨).
  const active = useRef<Map<string, string>>(new Map());
  const resolutionReady = useRef(false);

  const { data } = useQuery({
    queryKey: ['riskAlerts'],
    queryFn: getPendingRescheduleGroups,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // 시뮬 재시작/새 런 감지: sim_now_min 이 되돌아가면(처음으로 리셋) 한 런의 알림 기록을 초기화.
  // (한 번 도는 동안은 유지, 시작/재시작 시 비움 — DB도 동일하게 truncate 됨)
  const { data: sim } = useSimStatus();
  const prevSimMin = useRef<number | null>(null);
  useEffect(() => {
    const min = sim?.sim_now_min ?? null;
    if (min == null) return;
    const prev = prevSimMin.current;
    prevSimMin.current = min;
    if (prev != null && min + 1 < prev) {
      clearNotifications();
      seen.current.clear();
      generated.current.clear();
      awaitingGen.current.clear();
      active.current.clear();
      resolutionReady.current = false;
      try {
        localStorage.removeItem(SEEN_KEY);
        localStorage.removeItem(GEN_KEY);
      } catch {
        /* localStorage 불가 시 무시 */
      }
    }
  }, [sim?.sim_now_min, clearNotifications]);

  useEffect(() => {
    if (!data) return;

    const now = Date.now();
    let seenChanged = false;
    const currentIds = new Set(data.map((g) => g.groupId));

    data.forEach((group) => {
      const where = `${districtLabels[group.districtId as DistrictId] ?? group.districtId} · ${processStepLabel(group.processStep)}`;
      active.current.set(group.groupId, where); // 해소 추적용 등록(라벨 캐시)

      const created = createdAtMs(group.createdAt);
      const isRecent = Number.isFinite(created) && now - created < RECENT_MS;

      // 기록창엔 현재 살아있는 위험을 항상 1회 적재(store가 id로 중복 방지)
      logNotification({
        id: `${group.groupId}:risk`,
        type: 'risk',
        title: '위험이 발생했습니다',
        description: where,
        riskLevel: group.riskLevel,
        groupId: group.groupId,
        ts: Number.isFinite(created) ? created : now,
        iso: group.createdAt,
      });

      // 1) 위험 발생 알림 (새 그룹 1회, 최근 것만). 오래된 그룹은 조용히 seen 등록(첫 로드 폭주 방지).
      if (!seen.current.has(group.groupId)) {
        seen.current.add(group.groupId);
        seenChanged = true;
        if (isRecent) {
          const tone =
            group.riskLevel === 'Critical'
              ? 'critical'
              : group.riskLevel === 'High'
                ? 'high'
                : 'info';
          addToast({
            tone,
            level: group.riskLevel ?? undefined,
            title: '위험이 발생했습니다. 재조정안을 생성합니다',
            description: where,
            groupId: group.groupId,
          });
        }
      }

      // 2) 생성 완료 감지 — 백엔드가 자동 생성. 옵션이 비어 있다가 채워지는 '순간'만 알린다.
      //    생성은 최대 2분 걸리므로 시간 게이트(isRecent)를 쓰지 않는다.
      //    처음부터 옵션이 있던 그룹은 baseline 으로 조용히 등록(중복 알림 방지).
      if (!generated.current.has(group.groupId) && !inflight.current.has(group.groupId)) {
        inflight.current.add(group.groupId);
        void (async () => {
          try {
            const detail = await getRescheduleGroupDetail(group.groupId);
            if (detail.options.length === 0) {
              awaitingGen.current.add(group.groupId); // 생성 중 → 다음 폴링에서 완료 감지
              return;
            }
            generated.current.add(group.groupId);
            saveIds(GEN_KEY, generated.current);
            // 알림 대상: ① empty→채워짐을 지켜봤거나(witnessed) ② 방금 생성된(2분 내) 그룹이
            // (생성이 폴링보다 빨라 empty를 못 본 경우). 그 외(오래된 기존 안)는 baseline 무알림.
            const witnessed = awaitingGen.current.delete(group.groupId);
            if (!witnessed && !isRecent) return;
            const ok = detail.options.some((option) => option.analysisStatus === 'success');
            const title = ok ? '재조정안이 생성되었습니다' : '재조정안 생성 완료 — 운영자 검토 필요';
            addToast({ tone: 'info', title, description: where, groupId: group.groupId });
            logNotification({
              id: `${group.groupId}:generated`,
              type: 'generated',
              title,
              description: where,
              groupId: group.groupId,
              ts: Date.now(),
              iso: new Date().toISOString(),
            });
          } catch {
            // 일시 오류는 조용히 무시(다음 폴링에서 재시도)
          } finally {
            inflight.current.delete(group.groupId);
          }
        })();
      }
    });

    if (seenChanged) saveIds(SEEN_KEY, seen.current);

    // --- 해소 알림: pending 에서 사라진(해결/처리된) 그룹 ---
    // 첫 폴링은 기준선만 잡고 알림하지 않는다(기존 active 가 전부 '해소'로 쏟아지는 것 방지).
    if (resolutionReady.current) {
      for (const [id, where] of active.current) {
        if (!currentIds.has(id)) {
          addToast({ tone: 'info', title: '위험이 해결되었습니다', description: where });
          logNotification({
            id: `${id}:resolved`,
            type: 'resolved',
            title: '위험이 해결되었습니다',
            description: where,
            ts: Date.now(),
            iso: new Date().toISOString(),
          });
          active.current.delete(id);
        }
      }
    } else {
      resolutionReady.current = true;
    }
  }, [data, addToast, logNotification]);
}
