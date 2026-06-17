import { Clock, Loader2, Play, Square } from 'lucide-react';

import { useSimControl, useSimStatus } from '@/hooks';

/** '2025-05-05T09:55:00' → { date: '2025.05.05', time: '09:55' } */
function formatSimTime(iso: string) {
  return { date: iso.slice(0, 10).replace(/-/g, '.'), time: iso.slice(11, 16) };
}

/** 헤더의 시뮬레이션(서버) 시각 표시 + 시작/정지 제어. 진행 중이면 라이브 점, 정지면 회색. */
export function SimClock() {
  const { data } = useSimStatus();
  const { start, stop } = useSimControl();
  const running = data?.is_running ?? false;
  const iso = data?.sim_now_iso ?? null;
  const formatted = iso ? formatSimTime(iso) : null;
  const pending = start.isPending || stop.isPending;

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-1.5">
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

      {/* 구분선 + 시작/정지 버튼 */}
      <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
      {running ? (
        <button
          type="button"
          onClick={() => stop.mutate()}
          disabled={pending}
          title="시뮬레이션 정지"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-label-3 font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Square className="h-3.5 w-3.5" aria-hidden />
          )}
          정지
        </button>
      ) : (
        <button
          type="button"
          onClick={() => start.mutate()}
          disabled={pending}
          title="시뮬레이션 시작"
          className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-label-3 font-semibold text-primary-600 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden />
          )}
          시작
        </button>
      )}
    </div>
  );
}
