import { useState } from 'react';
import { Clock, FastForward, Loader2, Play, RotateCcw, Square } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useSimControl, useSimStatus } from '@/hooks';
import type { SimControlResult } from '@apis/index';

/** 응답의 preset/sim_factor로 배속 여부 판정 (preset 우선, 없으면 sim_factor<1) */
function isFast(res?: SimControlResult): boolean {
  if (!res) return false;
  if (res.preset) return res.preset === 'fast';
  return (res.sim_factor ?? 60) < 1;
}

/** '2025-05-05T09:55:00' → { date: '2025.05.05', time: '09:55' } */
function formatSimTime(iso: string) {
  return { date: iso.slice(0, 10).replace(/-/g, '.'), time: iso.slice(11, 16) };
}

/** 헤더 시뮬레이션 제어 버튼 (시작/정지/다시 시작/속도 공통) */
function SimButton({
  label,
  icon: Icon,
  loading,
  disabled,
  onClick,
  tone = 'gray',
}: {
  label: string;
  icon: LucideIcon;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  tone?: 'primary' | 'gray';
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100'
      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`시뮬레이션 ${label}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-label-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}

/** 헤더의 시뮬레이션(서버) 시각 표시 + 시작/정지/다시 시작/속도 제어. */
export function SimClock() {
  const { data } = useSimStatus();
  const { start, stop, restart, toggleSpeed } = useSimControl();
  // 서버 status에 sim_factor가 없어 속도는 클라이언트에서 추적. 시작/다시 시작 직후 기본은 실시간.
  const [fast, setFast] = useState(false);

  const statusKnown = data != null; // 상태 로딩 전엔 시작/정지 비활성(중복 호출 409 방지)
  const running = data?.is_running ?? false;
  const iso = data?.sim_now_iso ?? null;
  const formatted = iso ? formatSimTime(iso) : null;
  const pending = start.isPending || stop.isPending || restart.isPending || toggleSpeed.isPending;

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

      {/* 구분선 + 시작 / 정지 / 다시 시작 / 속도 */}
      <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
      <div className="flex items-center gap-1">
        <SimButton
          label="시작"
          icon={Play}
          tone="primary"
          loading={start.isPending}
          disabled={pending || running || !statusKnown}
          onClick={() => start.mutate(undefined, { onSuccess: (res) => setFast(isFast(res)) })}
        />
        <SimButton
          label="정지"
          icon={Square}
          loading={stop.isPending}
          disabled={pending || !running || !statusKnown}
          onClick={() => stop.mutate()}
        />
        <SimButton
          label="다시 시작"
          icon={RotateCcw}
          loading={restart.isPending}
          disabled={pending}
          onClick={() => restart.mutate(undefined, { onSuccess: (res) => setFast(isFast(res)) })}
        />
        <SimButton
          label={fast ? '배속' : '실시간'}
          icon={FastForward}
          tone={fast ? 'primary' : 'gray'}
          loading={toggleSpeed.isPending}
          disabled={pending || !running}
          onClick={() => toggleSpeed.mutate(undefined, { onSuccess: (res) => setFast(isFast(res)) })}
        />
      </div>
    </div>
  );
}
