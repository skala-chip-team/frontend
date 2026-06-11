import { Sparkles } from 'lucide-react';

interface RescheduleFaqQuickQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function RescheduleFaqQuickQuestions({
  questions,
  onSelect,
}: RescheduleFaqQuickQuestionsProps) {
  return (
    <div className="border-b border-gray-100 bg-surface-50 px-4 py-3">
      <div className="flex items-center gap-1.5 text-caption-1 font-semibold text-gray-500">
        <Sparkles className="h-3.5 w-3.5 text-primary-500" />
        이런 질문을 해보세요
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-caption-1 font-semibold leading-snug text-secondary-navy transition hover:border-primary-200 hover:bg-primary-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
