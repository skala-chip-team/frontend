import { Fragment } from 'react';

import { ChevronRight } from 'lucide-react';

export interface StepOption {
  id: string;
  label: string;
}

interface StepSelectorProps {
  steps: StepOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/** 공정 step 칩 셀렉터: step1 → step2 → … 형태로 칩을 나열하고 선택을 관리한다. */
export function StepSelector({ steps, selectedId, onSelect, className = '' }: StepSelectorProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {steps.map((step, index) => (
        <Fragment key={step.id}>
          <button
            type="button"
            onClick={() => onSelect(step.id)}
            aria-pressed={step.id === selectedId}
            className={`rounded-full border px-4 py-2 text-label-2 font-semibold transition ${
              step.id === selectedId
                ? 'border-primary-500 bg-primary-500 text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)]'
                : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:text-primary-600'
            }`}
          >
            {step.label}
          </button>

          {index < steps.length - 1 ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
