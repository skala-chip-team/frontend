import { Clock } from 'lucide-react';

import { useSimStatus } from '@/hooks';

/** '2025-05-05T09:55:00' → { date: '2025.05.05', time: '09:55' } */
function formatSimTime(iso: string) {
  return { date: iso.slice(0, 10).replace(/-/g, '.'), time: iso.slice(11, 16) };
}

/** 헤더의 시뮬레이션(서버) 시각 표시. 진행 중이면 라이브 점, 정지면 회색. */
export function SimClock() {
  const { data } = useSimStatus();
  const running = data?.is_running ?? false;
  const iso = data?.sim_now_iso ?? null;
  const formatted = iso ? formatSimTime(iso) : null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
      <Clock className="h-4 w-4 text-gray-400" aria-hidden />
      <span className="text-label-3 font-medium text-gray-400">시뮬레이션</span>

      {formatted ? (
        <span className="text-body-2 font-semibold tabular-nums text-secondary-navy">
          {formatted.date} {formatted.time}
        </span>
      ) : (
        <span className="text-body-2 font-semibold text-gray-300">정지</span>
      )}

      <span className="relative ml-0.5 flex h-2 w-2" aria-hidden>
        {running ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
          </>
        ) : (
          <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" />
        )}
      </span>
    </div>
  );
}
