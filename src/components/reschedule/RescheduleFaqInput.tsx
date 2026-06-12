import type { FormEvent } from 'react';
import { Send } from 'lucide-react';

interface RescheduleFaqInputProps {
  draft: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function RescheduleFaqInput({ draft, onChange, onSubmit }: RescheduleFaqInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="border-t border-gray-100 bg-white p-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-surface-50 px-2 py-2 focus-within:border-primary-200 focus-within:bg-white">
        <input
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ChipScheduler에게 질문해보세요"
          className="h-10 flex-1 bg-transparent px-3 text-body-2 text-secondary-navy outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          aria-label="질문 보내기"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
