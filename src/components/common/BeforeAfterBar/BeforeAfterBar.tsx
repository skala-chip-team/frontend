import { useAnimatedNumber } from '@/hooks';

export type ComparePhase = 'before' | 'after';

interface BeforeAfterBarProps {
  before: number;
  after: number;
  phase: ComparePhase; // 표시 시점 — 전환 시 너비·숫자 애니메이션
  max: number;
  label?: string;
  unit?: string; // ex. '분', '%'
  barClassName?: string; // 채움 색 (ex. 'bg-primary-500')
  className?: string;
}

/** 전→후 변화 진행 바 — 조정 전 위치는 고스트 마커로 남아 변화 폭이 항상 보인다 */
export function BeforeAfterBar({
  before,
  after,
  phase,
  max,
  label,
  unit = '',
  barClassName = 'bg-primary-500',
  className = '',
}: BeforeAfterBarProps) {
  const target = phase === 'before' ? before : after;
  const display = useAnimatedNumber(target);
  const widthPct = Math.min(100, (target / max) * 100);
  const ghostPct = Math.min(100, (before / max) * 100);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {label ? (
        <span className="w-24 shrink-0 truncate text-label-3 font-semibold text-gray-500">
          {label}
        </span>
      ) : null}
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${barClassName} transition-all duration-700 ease-out`}
          style={{ width: `${widthPct}%` }}
        />
        <span
          className="absolute inset-y-0 w-0.5 bg-gray-400/70"
          style={{ left: `${ghostPct}%` }}
          aria-hidden
        />
      </div>
      <span className="w-12 shrink-0 text-right text-label-2 font-bold tabular-nums text-secondary-navy">
        {Math.round(display)}
        {unit}
      </span>
    </div>
  );
}
