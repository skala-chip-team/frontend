import { Bot } from 'lucide-react';

import type { ChatMessage } from './chatTypes';

interface RescheduleFaqMessageProps {
  message: ChatMessage;
}

export function RescheduleFaqMessage({ message }: RescheduleFaqMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {isAssistant ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-secondary-navy/10 bg-secondary-navy text-white">
          <Bot className="h-4 w-4" />
        </div>
      ) : null}
      <div className={`max-w-[85%] ${isAssistant ? '' : 'flex flex-col items-end'}`}>
        {isAssistant ? (
          <p className="mb-1 text-caption-1 font-semibold text-gray-400">ChipScheduler</p>
        ) : null}
        <div
          className={`rounded-2xl px-4 py-3 text-body-2 leading-relaxed whitespace-pre-wrap ${
            isAssistant
              ? 'rounded-tl-sm border border-gray-100 bg-surface-100 text-secondary-navy'
              : 'rounded-tr-sm bg-primary-500 text-white shadow-[0_10px_20px_rgba(234,0,44,0.16)]'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
