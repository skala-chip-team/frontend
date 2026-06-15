interface Board3DSkeletonProps {
  className?: string;
}

// 장비 라인을 옅게 암시하는 플레이스홀더 블록(높이만 살짝 다르게)
const BARS = [0, 1, 2];

/** 3D 보드 마운트 전 잠깐 보이는 옅은 로딩 스켈레톤.
 *  surface 토큰 기반의 은은한 pulse — 실제 3D 씬의 무게감만 가볍게 흉내낸다. */
export function Board3DSkeleton({ className = '' }: Board3DSkeletonProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl bg-surface-50 ${className}`}
      aria-hidden
    >
      {/* 옅은 셔머 레이어 */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-100 via-surface-50 to-surface-200" />

      {/* 장비 자리 — 바닥 그림자 위에 놓인 듯한 옅은 블록 */}
      <div className="absolute inset-0 flex items-end justify-center gap-6 pb-[18%]">
        {BARS.map((i) => (
          <div key={i} className="flex flex-col items-center gap-3 opacity-50">
            <div
              className="animate-pulse rounded-2xl bg-surface-200"
              style={{ width: 64, height: 96 + i * 20, animationDelay: `${i * 160}ms` }}
            />
            <div
              className="h-2.5 w-16 animate-pulse rounded-full bg-surface-200"
              style={{ animationDelay: `${i * 160 + 80}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export type { Board3DSkeletonProps };
