import { useEffect, useRef, useState } from 'react';

import { Check, ChevronDown } from 'lucide-react';

export interface DistrictOption {
  value: string;
  label: string;
}

interface DistrictSelectProps {
  value: string;
  options: DistrictOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * 구역 선택 드롭다운.
 * radix Select 의 디자인/인터랙션(트리거+셰브론, 좌측 체크 인디케이터, 라운드 팝오버)을 참고한 커스텀 구현.
 */
export function DistrictSelect({ value, options, onChange, className = '' }: DistrictSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 min-w-[8rem] items-center justify-between gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[0.8125rem] font-semibold text-secondary-navy shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-gray-300 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20"
      >
        <span className="line-clamp-1">{selected?.label ?? '선택'}</span>
        <ChevronDown
          className={`-me-0.5 h-4 w-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        role="listbox"
        className={`absolute left-0 top-[calc(100%+6px)] z-50 min-w-full origin-top overflow-hidden rounded-md border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition duration-150 ease-out ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="relative flex w-full items-center rounded-sm py-1.5 pe-2 ps-8 text-left text-[0.8125rem] font-medium text-secondary-navy transition hover:bg-surface-100"
            >
              <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected ? <Check className="h-4 w-4 text-primary-500" /> : null}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
