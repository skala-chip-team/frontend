import { Bot, X } from 'lucide-react';

interface RescheduleFaqChatHeaderProps {
  onClose: () => void;
}

export function RescheduleFaqChatHeader({ onClose }: RescheduleFaqChatHeaderProps) {
  return (
    <div className="border-b border-gray-100 bg-[linear-gradient(135deg,#ffffff_0%,#f7f8fa_58%,#fff1f4_100%)] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-navy text-white shadow-[0_10px_24px_rgba(8,16,40,0.16)]">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-subtitle-3 font-bold text-secondary-navy">ChipScheduler</p>
            <p className="text-label-3 text-gray-500">재조정 Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/80 hover:text-secondary-navy"
          aria-label="챗봇 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
