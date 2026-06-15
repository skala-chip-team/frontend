import { useMemo, useRef, useState } from 'react';
import { Bell, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useClickOutside } from '@hooks/useClickOutside';
import { getPendingRescheduleGroups } from '@apis/index';
import { districtLabels, type DistrictId } from '@/stores';
import { formatRelativeTime, processStepLabel } from '@/utils';

const READ_KEY = 'notifications.read';

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveRead(read: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-300)));
  } catch {
    /* localStorage 불가 시 무시 */
  }
}

/** 위험 레벨 → 점 색상 (읽지 않은 알림) */
function dotColor(riskLevel: string | null | undefined): string {
  if (riskLevel === 'Critical' || riskLevel === 'High') return 'bg-red-500';
  if (riskLevel === 'Medium') return 'bg-orange-500';
  return 'bg-emerald-500';
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(loadRead);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 실제 위험 알람 = pending 재조정 그룹(살아있는 위험). useRiskAlerts와 동일 쿼리키로 캐시 공유
  const { data } = useQuery({
    queryKey: ['riskAlerts'],
    queryFn: getPendingRescheduleGroups,
    refetchInterval: 5000,
  });

  const notifications = useMemo(() => {
    return (data ?? [])
      .filter((group) => group.affectedUnits.length > 0) // 해소된 stale 제외
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) // 최신순
      .map((group) => ({
        id: group.groupId,
        riskLevel: group.riskLevel,
        title: '위험이 발생했습니다',
        description: `${districtLabels[group.districtId as DistrictId] ?? group.districtId} · ${processStepLabel(group.processStep)}`,
        time: formatRelativeTime(group.createdAt),
        unread: !read.has(group.groupId),
      }));
  }, [data, read]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useClickOutside([triggerRef, panelRef], () => setOpen(false), open);

  const markRead = (id: string) => {
    setRead((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveRead(next);
      return next;
    });
  };

  const openDetail = (id: string) => {
    markRead(id);
    setOpen(false);
    navigate(`/reschedule/${id}`);
  };

  const markAllRead = () => {
    setRead((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveRead(next);
      return next;
    });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-content-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        aria-label="알림"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-content-center rounded-full bg-point text-label-3 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        ref={panelRef}
        className={`fixed bottom-4 right-4 top-20 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-gray-200/30 bg-white shadow-lg transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'pointer-events-none translate-x-[calc(100%+1rem)]'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between p-4">
          <div>
            <h3 className="text-subtitle-2 text-gray-900">알림</h3>
            <p className="mt-1 text-caption-1 text-gray-500">{unreadCount}개의 읽지 않은 알림</p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-md px-2 py-1 text-caption-1 text-gray-500 hover:bg-gray-50"
              >
                모두 읽음
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-content-center rounded-md text-gray-500 hover:bg-gray-50"
              aria-label="닫기"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="grid h-40 place-content-center px-4 text-center text-caption-1 text-gray-400">
              새 위험 알림이 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openDetail(n.id)}
                  className="w-full cursor-pointer p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                        n.unread ? dotColor(n.riskLevel) : 'bg-gray-300'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-label-1 text-gray-900">{n.title}</p>
                      <p className="text-caption-1 text-gray-500">{n.description}</p>
                      <p className="text-caption-1 text-gray-400">{n.time}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
