import { create } from 'zustand';

export type NotificationType = 'risk' | 'generated' | 'resolved';

/** 알람 기록창에 쌓이는 알림 1건 */
export interface AppNotification {
  id: string; // 고유 키 (예: `${groupId}:risk`) — 중복 적재 방지
  type: NotificationType;
  title: string;
  description: string;
  riskLevel?: string | null;
  groupId?: string; // 있으면 클릭 시 상세로 이동
  ts: number; // 정렬용(ms)
  iso: string; // 표시용(상대시간). 서버 시각(무접미사) 또는 클라이언트 ISO
  read: boolean;
}

const KEY = 'notifications.log';
const MAX = 100;

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function persist(items: AppNotification[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* localStorage 불가 시 무시 */
  }
}

interface NotificationState {
  items: AppNotification[];
  /** 알림 추가 (id 중복이면 무시). read/정렬 필드는 자동 채움 */
  add: (n: Omit<AppNotification, 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: load(),
  add: (n) => {
    if (get().items.some((it) => it.id === n.id)) return; // 중복 방지
    const items = [{ ...n, read: false }, ...get().items]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX);
    persist(items);
    set({ items });
  },
  markRead: (id) => {
    const items = get().items.map((it) => (it.id === id ? { ...it, read: true } : it));
    persist(items);
    set({ items });
  },
  markAllRead: () => {
    const items = get().items.map((it) => ({ ...it, read: true }));
    persist(items);
    set({ items });
  },
}));
