import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/** 페이지네이션: 이전/다음 + 페이지 번호 */
export function Pagination({ page, totalPages, onChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
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
