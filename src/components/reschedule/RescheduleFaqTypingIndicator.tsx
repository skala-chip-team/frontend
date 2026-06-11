import { Bot } from 'lucide-react';

export function RescheduleFaqTypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-secondary-navy/10 bg-secondary-navy text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="w-fit">
        <p className="mb-1 text-caption-1 font-semibold text-gray-400">ChipScheduler</p>
        <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-surface-100 px-3 py-3">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
