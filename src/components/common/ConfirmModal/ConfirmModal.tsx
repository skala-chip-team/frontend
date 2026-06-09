import type { ReactNode } from 'react';

import { Modal } from '../Modal';

interface ConfirmModalProps {
  open: boolean;
  /** 메인 문구(큰 글씨) */
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  className?: string;
}

/** 2버튼 확인(알림) 모달. 메인 문구 + 설명 + 취소/확인. */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onClose,
  className = 'max-w-md',
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} className={className}>
      <div className="flex flex-col gap-2">
        <h3 className="text-subtitle-1 font-bold text-secondary-navy">{title}</h3>
        {description ? (
          <p className="text-body-2 leading-relaxed text-gray-500">{description}</p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-label-1 font-semibold text-secondary-navy transition hover:bg-surface-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
