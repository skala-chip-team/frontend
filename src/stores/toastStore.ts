import { create } from 'zustand';

export type ToastTone = 'critical' | 'high' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** 배지에 표시할 라벨(예: 위험 레벨). 없으면 tone 기본 라벨 사용 */
  level?: string;
  /** 클릭 시 이동할 재조정 그룹 id (있으면 상세로 이동) */
  groupId?: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({ toasts: [...state.toasts, { ...toast, id: `toast-${(counter += 1)}` }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
