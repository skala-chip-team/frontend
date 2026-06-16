import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
  /** 한 번에 보여줄 페이지 번호 개수(슬라이딩 윈도우). 기본 10 */
  maxButtons?: number;
}

/** 페이지네이션: 이전/다음 + 페이지 번호(최대 maxButtons개 슬라이딩 윈도우) */
export function Pagination({
  page,
  totalPages,
  onChange,
  className = '',
  maxButtons = 10,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // 현재 페이지 주변으로 최대 maxButtons개만 노출 (예: 1~10, 이동 시 슬라이드)
  const windowSize = Math.min(maxButtons, totalPages);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped !== page) onChange(clamped);
  };

  const navButton =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-secondary-navy disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button type="button" aria-label="이전 페이지" className={navButton} disabled={page === 1} onClick={() => go(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((value) => (
        <button
          key={value}
          type="button"
          aria-current={value === page}
          onClick={() => go(value)}
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-label-2 font-semibold transition ${
            value === page
              ? 'border-primary-500 bg-primary-500 text-white shadow-[0_6px_16px_rgba(234,0,44,0.18)]'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
          }`}
        >
          {value}
        </button>
      ))}

      <button type="button" aria-label="다음 페이지" className={navButton} disabled={page === totalPages} onClick={() => go(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
