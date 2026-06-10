import { useEffect } from 'react';

import { AlertOctagon, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useToastStore, type Toast, type ToastTone } from '@/stores';

const AUTO_DISMISS_MS = 6000;

const toneStyle: Record<ToastTone, { card: string; icon: string; badge: string; label: string }> = {
  critical: {
    card: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
  high: {
    card: 'border-orange-200 bg-orange-50',
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    label: 'High',
  },
  info: {
    card: 'border-gray-200 bg-white',
    icon: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-600',
    label: 'Info',
  },
};

function ToastCard({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const navigate = useNavigate();
  const style = toneStyle[toast.tone];
  const Icon = toast.tone === 'critical' ? AlertOctagon : AlertTriangle;

  useEffect(() => {
    const timer = window.setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, removeToast]);

  const clickable = Boolean(toast.groupId);
  const handleClick = () => {
    if (!toast.groupId) return;
    navigate(`/reschedule/${toast.groupId}`);
    removeToast(toast.id);
  };

  return (
    <div
      role={clickable ? 'button' : 'status'}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') handleClick();
            }
          : undefined
      }
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-xl border p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)] transition ${style.card} ${
        clickable ? 'cursor-pointer hover:brightness-[0.98]' : ''
      }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} aria-hidden />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-body-2 font-semibold text-gray-900">{toast.title}</p>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${style.badge}`}
          >
            {toast.level ?? style.label}
          </span>
        </div>
        {toast.description ? (
          <p className="mt-1 truncate text-label-3 text-gray-500">{toast.description}</p>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="알림 닫기"
        onClick={(event) => {
          event.stopPropagation();
          removeToast(toast.id);
        }}
        className="shrink-0 rounded-md p-0.5 text-gray-400 transition hover:bg-black/5 hover:text-gray-600"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** 전역 토스트 컨테이너. 우상단에 쌓이고 자동으로 사라진다. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2.5">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
