import { useRef, useState } from 'react';
import { Bell, ChevronsRight } from 'lucide-react';
import { useClickOutside } from '@hooks/useClickOutside';
import type { Notification } from './types';

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'John이 새 메시지를 보냈습니다',
    description: '안녕하세요, 지난번 대화 관련해서 후속 논의를...',
    time: '2분 전',
    unread: true,
  },
  {
    id: '2',
    title: '프로젝트 업데이트',
    description: 'Sarah가 디자인 파일을 업데이트했습니다',
    time: '1시간 전',
    unread: true,
  },
  {
    id: '3',
    title: '새 댓글',
    description: 'Mike가 게시물에 댓글을 남겼습니다',
    time: '3시간 전',
    unread: true,
  },
  {
    id: '4',
    title: '시스템 업데이트',
    description: '새로운 기능이 추가되었습니다',
    time: '어제',
    unread: false,
  },
  {
    id: '5',
    title: '플랫폼에 오신 것을 환영합니다',
    description: '이 팁들로 시작해보세요',
    time: '2일 전',
    unread: false,
  },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useClickOutside([triggerRef, panelRef], () => setOpen(false), open);

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
            <p className="mt-1 text-caption-1 text-gray-500">
              {unreadCount}개의 읽지 않은 알림
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-7 w-7 place-content-center rounded-md text-gray-500 hover:bg-gray-50"
            aria-label="닫기"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div key={n.id} className="cursor-pointer p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      n.unread ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-label-1 text-gray-900">{n.title}</p>
                    <p className="text-caption-1 text-gray-500">{n.description}</p>
                    <p className="text-caption-1 text-gray-400">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
