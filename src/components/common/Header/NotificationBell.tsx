import { useRef, useState } from 'react';
import { Bell, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useClickOutside } from '@hooks/useClickOutside';
import { useNotificationStore, type NotificationType } from '@/stores';
import { formatRelativeTime } from '@/utils';

/** 알림 종류·위험 레벨 → 점 색상 (읽지 않은 알림) */
function dotColor(type: NotificationType, riskLevel: string | null | undefined): string {
  if (type === 'generated') return 'bg-primary-500';
  if (type === 'resolved') return 'bg-emerald-500';
  if (riskLevel === 'Critical' || riskLevel === 'High') return 'bg-red-500';
  if (riskLevel === 'Medium') return 'bg-orange-500';
  return 'bg-amber-500';
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 위험 발생/재조정안 생성/위험 해결 등 이벤트 로그 (useRiskAlerts가 적재)
  const items = useNotificationStore((state) => state.items);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clear = useNotificationStore((state) => state.clear);

  const unreadCount = items.filter((n) => !n.read).length;

  useClickOutside([triggerRef, panelRef], () => setOpen(false), open);

  const onItemClick = (id: string, groupId?: string) => {
    markRead(id);
    if (groupId) {
      setOpen(false);
      navigate(`/reschedule/${groupId}`);
    }
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
            {items.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                className="rounded-md px-2 py-1 text-caption-1 text-gray-500 hover:bg-gray-50 hover:text-rose-600"
              >
                지우기
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
          {items.length === 0 ? (
            <div className="grid h-40 place-content-center px-4 text-center text-caption-1 text-gray-400">
              알림이 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onItemClick(n.id, n.groupId)}
                  className="w-full cursor-pointer p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                        n.read ? 'bg-gray-300' : dotColor(n.type, n.riskLevel)
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-label-1 text-gray-900">{n.title}</p>
                      <p className="text-caption-1 text-gray-500">{n.description}</p>
                      <p className="text-caption-1 text-gray-400">{formatRelativeTime(n.iso)}</p>
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
