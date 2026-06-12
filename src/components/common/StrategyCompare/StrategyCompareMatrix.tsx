import { useEffect, useState, type CSSProperties } from 'react';

import { flushSync } from 'react-dom';
import { ArrowDownUp, Check, Crown, Sliders, Sparkles } from 'lucide-react';

import {
  pentagonAxes,
  type PentagonData,
  type PentagonOption,
} from '@/mocks/reschedulePentagon';
import { scoreColor, usePrefersReducedMotion } from '../PentagonRadar/PentagonRadar';

// 행 1등 칸 라벨
const BEST_LABEL: Record<string, string> = {
  rescue: '최다 구제',
  deadline: '최소 위험',
  speed: '최단',
  wait: '최대 단축',
  utilization: '최적 균형',
  stability: '최소 변경',
};
// 방향 꼬리표 (모든 막대는 '좋음=길다'로 정규화돼 있음을 글로 보조)
const DIR_TAIL: Record<string, string> = {
  rescue: '많을수록 좋음',
  deadline: '적을수록 좋음',
  speed: '짧을수록 좋음',
  wait: '많이 줄수록 좋음',
  utilization: '균형일수록 좋음',
  stability: '적을수록 좋음',
};
const WEIGHT_LABELS = ['무관심', '보통', '중요', '매우중요'];

const HEADER_H = 104;
const CELL_H = 92;
const LABEL_W = 158;

function bestSetByAxis(axes: typeof pentagonAxes, options: PentagonOption[]) {
  const map: Record<string, Set<string>> = {};
  for (const ax of axes) {
    const max = Math.max(...options.map((o) => o.axes[ax.key].score));
    map[ax.key] = new Set(options.filter((o) => o.axes[ax.key].score === max).map((o) => o.strategy));
  }
  return map;
}

function ValueText({ raw }: { raw: string }) {
  if (raw.includes('→')) {
    const [b, a] = raw.split('→');
    return (
      <span className="inline-flex items-baseline gap-1">
        <span className="text-label-3 text-gray-400">{b.trim()}</span>
        <span className="text-[10px] text-gray-300">→</span>
        <span className="text-label-1 font-bold text-secondary-navy">{a.trim()}</span>
      </span>
    );
  }
  return <span className="text-label-1 font-bold text-secondary-navy">{raw}</span>;
}

interface StrategyCompareMatrixProps {
  data: PentagonData;
  onConfirm?: (strategy: string) => void;
}

export function StrategyCompareMatrix({ data, onConfirm }: StrategyCompareMatrixProps) {
  const reduced = usePrefersReducedMotion();
  const axes = pentagonAxes;

  const [mounted, setMounted] = useState(false);
  const [sortMode, setSortMode] = useState<'default' | 'wins'>('default');
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [hoverAxis, setHoverAxis] = useState<string | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(axes.map((a) => [a.key, 1]))
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const best = bestSetByAxis(axes, data.options);
  const winsOf = (opt: PentagonOption) => axes.filter((ax) => best[ax.key].has(opt.strategy)).length;

  const recommended = data.options.find((o) => o.recommended) ?? data.options[0];
  const recWins = axes.filter((ax) => best[ax.key].has(recommended.strategy));

  // 가중치 종합 (기본 가중치 1 → 단순 평균)
  const totalWeight = axes.reduce((s, a) => s + weights[a.key], 0);
  const weightedTotal = (opt: PentagonOption) =>
    totalWeight === 0
      ? 0
      : Math.round(axes.reduce((s, a) => s + weights[a.key] * opt.axes[a.key].score, 0) / totalWeight);
  const customized = axes.some((a) => weights[a.key] !== 1);
  const myTop = [...data.options].sort((a, b) => weightedTotal(b) - weightedTotal(a))[0];

  // 추천은 항상 기준으로 맨 왼쪽. 나머지는 정렬 토글 대상.
  const others = data.options.filter((o) => o.strategy !== recommended.strategy);
  const orderedOthers = sortMode === 'wins' ? [...others].sort((a, b) => winsOf(b) - winsOf(a)) : others;
  const columns = [recommended, ...orderedOthers];

  const changeSort = (mode: 'default' | 'wins') => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (!reduced && doc.startViewTransition) {
      doc.startViewTransition(() => flushSync(() => setSortMode(mode)));
    } else {
      setSortMode(mode);
    }
  };

  const handleConfirm = () => {
    const key = focusKey ?? recommended.strategy;
    setConfirmedKey(key);
    onConfirm?.(key);
  };
  const confirmTarget = data.options.find((o) => o.strategy === (focusKey ?? recommended.strategy));

  return (
    <div className="flex flex-col gap-4">
      {/* 평결 배너 */}
      <div className="flex flex-col gap-1.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-body-2 text-emerald-900">
            <span className="font-semibold">AI 추천</span> ·{' '}
            <span className="font-bold">{recommended.label}</span> — 6개 항목 중{' '}
            <span className="font-bold">{recWins.length}개</span>에서 최고
          </p>
          <div className="flex flex-wrap gap-1">
            {recWins.map((ax) => (
              <span
                key={ax.key}
                className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
              >
                {ax.label}
              </span>
            ))}
          </div>
        </div>
        {advancedOpen && customized && myTop.strategy !== recommended.strategy ? (
          <p className="flex items-center gap-1.5 text-label-2 text-amber-700">
            <Crown className="h-4 w-4" aria-hidden />내 우선순위 기준 1위:{' '}
            <span className="font-bold">{myTop.label}</span> (가중 종합 {weightedTotal(myTop)})
          </p>
        ) : null}
      </div>

      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          <span className="text-label-3 text-gray-400">정렬</span>
          {(
            [
              { key: 'default' as const, label: '추천 기준' },
              { key: 'wins' as const, label: '승점순' },
            ]
          ).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => changeSort(s.key)}
              aria-pressed={sortMode === s.key}
              className={`rounded-lg px-2.5 py-1 text-label-3 font-semibold transition ${
                sortMode === s.key
                  ? 'bg-secondary-navy text-white'
                  : 'bg-surface-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-pressed={advancedOpen}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-label-3 font-semibold transition ${
            advancedOpen ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" aria-hidden />
          내 우선순위로 추천
        </button>
      </div>

      {/* 고급: 가중치 슬라이더 */}
      {advancedOpen ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-gray-200 bg-surface-100/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {axes.map((ax) => (
            <label key={ax.key} className="flex flex-col gap-1">
              <span className="flex items-center justify-between text-label-3">
                <span className="font-semibold text-secondary-navy">{ax.label}</span>
                <span className="text-gray-400">{WEIGHT_LABELS[weights[ax.key]]}</span>
              </span>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={weights[ax.key]}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [ax.key]: Number(e.target.value) }))
                }
                className="w-full accent-primary-500"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => setWeights(Object.fromEntries(axes.map((a) => [a.key, 1])))}
            className="self-end justify-self-start rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-label-3 font-semibold text-gray-500 transition hover:bg-surface-100"
          >
            초기화
          </button>
        </div>
      ) : null}

      {/* 비교 매트릭스 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* 지표 라벨 열 (가로 스크롤 시 고정) */}
        <div className="sticky left-0 z-10 shrink-0 bg-white" style={{ width: LABEL_W }}>
          <div style={{ height: HEADER_H }} className="flex items-end px-1 pb-3">
            <span className="text-label-3 font-semibold uppercase tracking-wide text-gray-400">
              항목
            </span>
          </div>
          {axes.map((ax) => (
            <div
              key={ax.key}
              onMouseEnter={() => setHoverAxis(ax.key)}
              onMouseLeave={() => setHoverAxis(null)}
              style={{ height: CELL_H }}
              className={`flex flex-col justify-center border-t border-gray-100 px-1 ${
                hoverAxis === ax.key ? 'bg-surface-100/70' : ''
              }`}
            >
              <span className="text-label-1 font-bold text-secondary-navy">{ax.label}</span>
              <span className="mt-0.5 text-[11px] text-gray-400">
                {hoverAxis === ax.key ? ax.desc : DIR_TAIL[ax.key]}
              </span>
            </div>
          ))}
        </div>

        {/* 옵션 열들 */}
        {columns.map((opt) => {
          const focused = focusKey === opt.strategy;
          const dimmed = focusKey !== null && !focused;
          const isRec = opt.strategy === recommended.strategy;
          const isMyTop = advancedOpen && customized && opt.strategy === myTop.strategy;
          return (
            <div
              key={opt.strategy}
              style={{ viewTransitionName: `col-${opt.strategy}` } as CSSProperties}
              className={`min-w-[176px] flex-1 rounded-xl border transition-opacity ${
                focused
                  ? 'border-secondary-navy ring-1 ring-secondary-navy/20'
                  : isRec
                    ? 'border-emerald-300'
                    : 'border-gray-200'
              } ${isRec ? 'bg-emerald-50/40' : ''} ${dimmed ? 'opacity-45' : 'opacity-100'}`}
            >
              {/* 헤더 */}
              <button
                type="button"
                onClick={() => setFocusKey(focused ? null : opt.strategy)}
                style={{ height: HEADER_H }}
                className="flex w-full flex-col justify-center gap-1 rounded-t-xl border-b border-gray-100 px-3 text-left transition hover:bg-surface-100/40"
              >
                <span className="h-1 w-9 rounded-full" style={{ backgroundColor: opt.color }} />
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-body-1 font-bold text-secondary-navy">{opt.label}</span>
                  {isRec ? (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      ★ 추천
                    </span>
                  ) : null}
                  {isMyTop ? (
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <Crown className="h-2.5 w-2.5" aria-hidden />내 1위
                    </span>
                  ) : null}
                </div>
                <span className="text-label-3 text-gray-400">
                  승점 <span className="font-bold text-secondary-navy">{winsOf(opt)}</span> /{' '}
                  {axes.length}
                  {advancedOpen ? (
                    <span className="ml-2">
                      가중 <span className="font-bold text-primary-600">{weightedTotal(opt)}</span>
                    </span>
                  ) : null}
                </span>
              </button>

              {/* 셀들 — 신호등 데이터바 */}
              {axes.map((ax, rowIdx) => {
                const isBest = best[ax.key].has(opt.strategy);
                const score = opt.axes[ax.key].score;
                const rowHover = hoverAxis === ax.key;
                return (
                  <div
                    key={ax.key}
                    onMouseEnter={() => setHoverAxis(ax.key)}
                    onMouseLeave={() => setHoverAxis(null)}
                    style={{ height: CELL_H }}
                    className={`flex flex-col justify-center gap-2 border-t border-gray-100 px-3 transition-colors ${
                      rowHover ? 'bg-surface-100/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <ValueText raw={opt.axes[ax.key].raw} />
                      {isBest ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Check className="h-2.5 w-2.5" aria-hidden />
                          {BEST_LABEL[ax.key] ?? '최고'}
                        </span>
                      ) : null}
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: mounted || reduced ? `${score}%` : '0%',
                          backgroundColor: scoreColor(score),
                          opacity: isBest ? 1 : 0.5,
                          transition: reduced
                            ? undefined
                            : `width 0.7s cubic-bezier(0.22,1,0.36,1) ${rowIdx * 0.05}s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 확정 */}
      <div className="flex justify-end">
        {confirmedKey ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-body-2 font-semibold text-emerald-700">
            <Check className="h-5 w-5" aria-hidden />
            {data.options.find((o) => o.strategy === confirmedKey)?.label} (으)로 결정됨
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-primary-500 px-5 py-3 text-label-1 font-bold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 active:scale-[0.99]"
          >
            이 안으로 결정 — {confirmTarget?.label}
          </button>
        )}
      </div>
    </div>
  );
}
