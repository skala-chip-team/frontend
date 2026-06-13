import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** 패널 추가 클래스(너비 등) */
  className?: string;
}

/** 기본 모달 — 오버레이 + 중앙 패널, 오버레이 클릭/ESC/닫기 버튼으로 닫힘 */
export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-secondary-navy/30 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${className}`}
      >
        {title !== undefined ? (
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div className="text-subtitle-1 font-bold text-secondary-navy">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-secondary-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
