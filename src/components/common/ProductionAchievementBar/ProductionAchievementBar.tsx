interface ProductionAchievementBarProps {
  /** 현재 생산 실적(summary.dailyOutputQty) */
  current?: number;
  /** 목표 생산량(summary.dailyTargetOutputQty) */
  target?: number;
  /** 달성률(%) — null이면 "산출 불가". 미지정 시 current/target로 계산 */
  rate?: number | null;
  className?: string;
}

/** 오늘의 생산 달성률 — 카드 묶음 위에 놓이는 가로 글래스 바.
 *  제목 → 달성률(%) → 진행바 → 현재/목표 순의 시각 위계.
 *  목표 정보가 없으면(달성률 산출 불가) %·진행바 대신 안내 + 절대값만 표시. */
export function ProductionAchievementBar({
  current = 0,
  target = 0,
  rate,
  className = '',
}: ProductionAchievementBarProps) {
  // rate가 명시되면 우선. 아니면 목표>0일 때만 계산. 목표 정보 없으면 산출 불가.
  const computable = rate === null ? false : rate !== undefined ? true : target > 0;
  const percent = computable ? (rate ?? Math.round((current / target) * 100)) : 0;
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-white/60 bg-gradient-to-r from-white/75 via-white/55 to-white/45 px-5 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-white/40 backdrop-blur-md sm:gap-5 ${className}`}
    >
      {/* 제목 + 달성률 */}
      <div className="flex shrink-0 items-baseline gap-2.5">
        <span className="whitespace-nowrap text-subtitle-3 font-bold tracking-[-0.01em] text-secondary-navy">
          오늘의 생산 달성률
        </span>
        {computable ? (
          <span className="text-subtitle-2 font-extrabold leading-none tracking-[-0.03em] text-primary-600">
            {percent}
            <span className="ml-0.5 text-body-1 font-bold text-primary-500">%</span>
          </span>
        ) : (
          <span className="whitespace-nowrap text-label-2 font-semibold text-gray-400">
            달성률 산출 불가
          </span>
        )}
      </div>

      {/* 진행바 — 산출 가능할 때만 */}
      {computable ? (
        <div className="relative h-2.5 min-w-[64px] flex-1 overflow-hidden rounded-full bg-gray-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 shadow-[0_0_8px_rgba(234,0,44,0.35)] transition-[width] duration-500 ease-out"
            style={{ width: `${clamped}%` }}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* 현재 / 목표 (목표 없으면 현재 실적만) */}
      <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
        <span className="text-body-1 font-bold text-secondary-navy">
          {current.toLocaleString()}
        </span>
        <span className="text-label-2 text-gray-400">
          {computable && target > 0 ? `/ ${target.toLocaleString()} EA` : 'EA'}
        </span>
      </div>
    </div>
  );
}

export type { ProductionAchievementBarProps };
