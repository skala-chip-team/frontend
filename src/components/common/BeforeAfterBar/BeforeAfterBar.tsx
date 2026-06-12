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
  instant?: boolean; // true면 애니메이션 없이 즉시 반영 (조정 전 상태 스냅용)
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
  instant = false,
  className = '',
}: BeforeAfterBarProps) {
  const target = phase === 'before' ? before : after;
  const display = useAnimatedNumber(target, instant ? 0 : 700);
  const widthPct = Math.min(100, (target / max) * 100);
  const ghostPct = Math.min(100, (before / max) * 100);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {label ? (
        <span className="w-24 shrink-0 truncate text-label-3 font-semibold text-gray-500">
          {label}
        </span>
      ) : null}
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full border border-gray-200/70 bg-white">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${barClassName} ${
            instant ? 'transition-none' : 'transition-all duration-700 ease-out'
          }`}
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

interface BeforeAfterColumnProps {
  before: number;
  after: number;
  phase: ComparePhase;
  label: string;
  max?: number;
  unit?: string;
  barClassName?: string;
  instant?: boolean;
}

/** 전→후 변화 세로 막대 — 장비 가동률 등 항목별 수직 비교용 */
export function BeforeAfterColumn({
  before,
  after,
  phase,
  label,
  max = 100,
  unit = '%',
  barClassName = 'bg-primary-500',
  instant = false,
}: BeforeAfterColumnProps) {
  const target = phase === 'before' ? before : after;
  const display = useAnimatedNumber(target, instant ? 0 : 700);
  const heightPct = Math.min(100, (target / max) * 100);
  const ghostPct = Math.min(100, (before / max) * 100);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-label-3 font-bold tabular-nums text-secondary-navy">
        {Math.round(display)}
        {unit}
      </span>
      <div className="relative h-24 w-9 overflow-hidden rounded-lg border border-gray-200/70 bg-white">
        <span
          className={`absolute inset-x-0 bottom-0 ${barClassName} ${
            instant ? 'transition-none' : 'transition-all duration-700 ease-out'
          }`}
          style={{ height: `${heightPct}%` }}
        />
        <span
          className="absolute inset-x-0 h-0.5 bg-gray-400/70"
          style={{ bottom: `${ghostPct}%` }}
          aria-hidden
        />
      </div>
      <span className="max-w-28 truncate text-label-3 font-semibold text-gray-500">{label}</span>
    </div>
  );
}
