import { useEffect, useMemo, useRef, useState } from 'react';

import { Check, Hexagon, Pentagon, Sparkles } from 'lucide-react';

import {
  pentagonAxes,
  type PentagonData,
  type PentagonOption,
} from '@/mocks/reschedulePentagon';

// ── 기하 상수 (정사각 viewBox; 컨테이너도 정사각이라 좌표→% 매핑이 정확) ──
const SIZE = 440;
const CX = SIZE / 2;
const CY = 222;
const R = 150;
const R_LABEL = R + 30;
const TAU = Math.PI * 2;
export const DASH = ['', '7 5', '2 5']; // 옵션별 선 패턴(색약 대비)

function axisAngle(i: number, n: number) {
  return -Math.PI / 2 + (i / n) * TAU;
}
function polar(r: number, a: number): [number, number] {
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
}

/** 종합점수 → 신호등 색 (좋음=초록 … 나쁨=빨강) */
export function scoreColor(v: number) {
  if (v >= 75) return '#16a34a';
  if (v >= 50) return '#84cc16';
  if (v >= 25) return '#f59e0b';
  return '#dc2626';
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** target 으로 부드럽게 보간(easeOutCubic). enabled=false면 즉시 target 반환(애니메이션 없음). */
export function useTween(target: number, duration: number, enabled: boolean) {
  const [val, setVal] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    if (!enabled) return;
    const from = ref.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      ref.current = v;
      setVal(v); // RAF 콜백 내 호출 — effect 본문 동기 호출 아님
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return enabled ? val : target;
}

interface PentagonRadarProps {
  data: PentagonData;
  onConfirm?: (strategy: string) => void;
}

export function PentagonRadar({ data, onConfirm }: PentagonRadarProps) {
  const reduced = usePrefersReducedMotion();

  const [showStability, setShowStability] = useState(false);
  const [morph, setMorph] = useState<'before' | 'after'>('after');
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const recommended = data.options.find((o) => o.recommended) ?? data.options[0];
  const focusKey = highlightedKey ?? recommended.strategy;
  const focusOption = data.options.find((o) => o.strategy === focusKey) ?? recommended;
  const singleFocus = morph === 'before'; // 현재상태 보기 → 포커스 1개만

  const activeAxes = useMemo(
    () => pentagonAxes.filter((a) => a.base || showStability),
    [showStability]
  );
  const n = activeAxes.length;

  // morphP: 0=현재상태(before) … 1=재조정후(after). 포커스 옵션에만 적용.
  const morphP = useTween(morph === 'after' ? 1 : 0, 450, !reduced);

  const scoreOf = (opt: PentagonOption, axisKey: string) => {
    const after = opt.axes[axisKey].score;
    if (opt.strategy === focusKey) {
      const before = data.before[axisKey]?.score ?? 0;
      return before + (after - before) * morphP;
    }
    return after;
  };

  const pointsFor = (scoreFn: (axisKey: string) => number) =>
    activeAxes
      .map((ax, i) => polar(R * (scoreFn(ax.key) / 100), axisAngle(i, n)).join(','))
      .join(' ');

  const avgScore = (opt: PentagonOption) =>
    Math.round(activeAxes.reduce((s, a) => s + opt.axes[a.key].score, 0) / n);

  const fillOpacity = (opt: PentagonOption) => {
    if (singleFocus) return opt.strategy === focusKey ? 0.3 : 0;
    if (highlightedKey) return opt.strategy === highlightedKey ? 0.32 : 0.04;
    return 0.16;
  };
  const strokeOpacity = (opt: PentagonOption) => {
    if (singleFocus) return opt.strategy === focusKey ? 1 : 0;
    if (highlightedKey) return opt.strategy === highlightedKey ? 1 : 0.16;
    return opt.recommended ? 1 : 0.55;
  };

  const handleConfirm = () => {
    setConfirmedKey(focusKey);
    onConfirm?.(focusKey);
  };

  // 호버 축의 라벨 좌표(툴팁 위치, %)
  const hoveredIndex = hoveredAxis ? activeAxes.findIndex((a) => a.key === hoveredAxis) : -1;
  const tooltipPos =
    hoveredIndex >= 0 ? polar(R_LABEL, axisAngle(hoveredIndex, n)) : null;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
      <style>{`
        @keyframes pentaPulse { 0%,100% { stroke-width: 3; } 50% { stroke-width: 6.5; } }
        @keyframes pentaConfirm { 0% { transform: scale(1);} 40% { transform: scale(1.06);} 100% { transform: scale(1);} }
      `}</style>

      {/* ── 차트 ── */}
      <div className="relative mx-auto aspect-square w-full max-w-[460px] shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
          <g
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: mounted || reduced ? 'scale(1)' : 'scale(0)',
              transition: reduced ? undefined : 'transform 0.55s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* 그리드 링 */}
            {[0.25, 0.5, 0.75, 1].map((lvl) => (
              <polygon
                key={lvl}
                points={activeAxes
                  .map((_, i) => polar(R * lvl, axisAngle(i, n)).join(','))
                  .join(' ')}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            ))}
            {/* 스포크 + 축 라벨 */}
            {activeAxes.map((ax, i) => {
              const a = axisAngle(i, n);
              const [ex, ey] = polar(R, a);
              const [lx, ly] = polar(R_LABEL, a);
              const cos = Math.cos(a);
              const anchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
              const isHover = hoveredAxis === ax.key;
              return (
                <g
                  key={ax.key}
                  onMouseEnter={() => setHoveredAxis(ax.key)}
                  onMouseLeave={() => setHoveredAxis(null)}
                  style={{ cursor: 'help' }}
                >
                  <line x1={CX} y1={CY} x2={ex} y2={ey} stroke="#e5e7eb" strokeWidth={1} />
                  {/* 라벨 히트 영역 */}
                  <circle cx={lx} cy={ly} r={28} fill="transparent" />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    className="select-none"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fill: isHover ? '#0f172a' : '#475569',
                    }}
                  >
                    {ax.label}
                  </text>
                </g>
              );
            })}

            {/* 현재 상태(before) 참조 — singleFocus일 때 점선 회색 */}
            {singleFocus ? (
              <polygon
                points={pointsFor((k) => data.before[k]?.score ?? 0)}
                fill="#94a3b8"
                fillOpacity={0.1}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            ) : null}

            {/* 옵션 폴리곤 */}
            {data.options.map((opt, idx) => {
              const so = strokeOpacity(opt);
              if (so === 0) return null;
              const pts = pointsFor((k) => scoreOf(opt, k));
              const pulse = opt.recommended && !highlightedKey && !singleFocus && !reduced;
              const isConfirmed = confirmedKey === opt.strategy;
              return (
                <g
                  key={opt.strategy}
                  style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    animation: isConfirmed && !reduced ? 'pentaConfirm 0.5s ease-out' : undefined,
                  }}
                >
                  <polygon
                    points={pts}
                    fill={opt.color}
                    fillOpacity={fillOpacity(opt)}
                    stroke={opt.color}
                    strokeOpacity={so}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeDasharray={DASH[idx % DASH.length] || undefined}
                    style={{
                      animation: pulse ? 'pentaPulse 2.2s ease-in-out infinite' : undefined,
                      transition: reduced ? undefined : 'fill-opacity 0.3s, stroke-opacity 0.3s',
                    }}
                  />
                  {/* 꼭짓점 (포커스/하이라이트만) */}
                  {(opt.strategy === focusKey || opt.strategy === highlightedKey) &&
                    activeAxes.map((ax, i) => {
                      const [px, py] = polar(R * (scoreOf(opt, ax.key) / 100), axisAngle(i, n));
                      return (
                        <circle
                          key={ax.key}
                          cx={px}
                          cy={py}
                          r={hoveredAxis === ax.key ? 6 : 4}
                          fill="#fff"
                          stroke={opt.color}
                          strokeWidth={2.5}
                          onMouseEnter={() => setHoveredAxis(ax.key)}
                          onMouseLeave={() => setHoveredAxis(null)}
                        />
                      );
                    })}
                </g>
              );
            })}
          </g>
        </svg>

        {/* 축 호버 툴팁 */}
        {hoveredAxis && tooltipPos ? (
          <AxisTooltip
            axisKey={hoveredAxis}
            options={data.options}
            before={data.before}
            xPct={(tooltipPos[0] / SIZE) * 100}
            yPct={(tooltipPos[1] / SIZE) * 100}
          />
        ) : null}
      </div>

      {/* ── 사이드 패널 ── */}
      <div className="flex flex-1 flex-col gap-3">
        {/* AI 추천 배너 (항상 명시) */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-body-2 text-emerald-800">
            <span className="font-semibold">AI 추천</span> ·{' '}
            <span className="font-bold">{recommended.label}</span> — 종합 점수가 가장 큽니다.
          </p>
        </div>

        {/* 컨트롤 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowStability((v) => !v)}
            aria-pressed={showStability}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
          >
            {showStability ? (
              <Hexagon className="h-4 w-4" aria-hidden />
            ) : (
              <Pentagon className="h-4 w-4" aria-hidden />
            )}
            {showStability ? '6각 (안정성 포함)' : '5각'}
          </button>

          <div className="inline-flex overflow-hidden rounded-lg border border-gray-200">
            {(['before', 'after'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMorph(m)}
                aria-pressed={morph === m}
                className={`px-3 py-1.5 text-label-2 font-semibold transition ${
                  morph === m
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-surface-100'
                }`}
              >
                {m === 'before' ? '현재 상태' : '재조정 후'}
              </button>
            ))}
          </div>
        </div>
        {morph === 'before' ? (
          <p className="text-label-3 text-gray-400">
            “{focusOption.label}” 선택 시 → <span className="font-semibold text-primary-600">재조정 후</span>로
            바뀌며 펜타곤이 바깥으로 커집니다.
          </p>
        ) : null}

        {/* 옵션 범례 카드 (클릭 = 하이라이트 토글) */}
        <div className="flex flex-col gap-2">
          {data.options.map((opt, idx) => {
            const active = highlightedKey === opt.strategy;
            const avg = avgScore(opt);
            return (
              <button
                key={opt.strategy}
                type="button"
                onClick={() => setHighlightedKey(active ? null : opt.strategy)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                  active
                    ? 'border-secondary-navy bg-surface-100 ring-1 ring-secondary-navy/15'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* 색 + 패턴 스와치 (색약 대비) */}
                <svg width="34" height="14" className="shrink-0" aria-hidden>
                  <line
                    x1="1"
                    y1="7"
                    x2="33"
                    y2="7"
                    stroke={opt.color}
                    strokeWidth="3"
                    strokeDasharray={DASH[idx % DASH.length] || undefined}
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-2 font-bold text-secondary-navy">{opt.label}</span>
                    {opt.recommended ? (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        ★ 추천
                      </span>
                    ) : null}
                  </div>
                  <p className="text-label-3 text-gray-400">종합 점수</p>
                </div>
                <span
                  className="text-[1.5rem] font-extrabold leading-none"
                  style={{ color: scoreColor(avg) }}
                >
                  {avg}
                </span>
              </button>
            );
          })}
        </div>

        {/* 선택 확정 */}
        <div className="mt-auto flex flex-col gap-2">
          {confirmedKey ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-body-2 font-semibold text-emerald-700">
              <Check className="h-5 w-5" aria-hidden />
              {data.options.find((o) => o.strategy === confirmedKey)?.label} (으)로 결정됨
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-xl bg-primary-500 px-4 py-3 text-label-1 font-bold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 active:scale-[0.99]"
            >
              이 안으로 결정 — {focusOption.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 축 호버 툴팁 — 축 라벨 + 설명 + 각 안의 raw 값 */
function AxisTooltip({
  axisKey,
  options,
  before,
  xPct,
  yPct,
}: {
  axisKey: string;
  options: PentagonOption[];
  before: PentagonData['before'];
  xPct: number;
  yPct: number;
}) {
  const meta = pentagonAxes.find((a) => a.key === axisKey);
  if (!meta) return null;
  const flipX = xPct > 55;
  const flipY = yPct > 60;
  return (
    <div
      className="pointer-events-none absolute z-20 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(${flipX ? '-100%' : '0'}, ${flipY ? '-100%' : '0'}) translate(${
          flipX ? '-8px' : '8px'
        }, ${flipY ? '-8px' : '8px'})`,
      }}
    >
      <p className="text-label-1 font-bold text-secondary-navy">{meta.label}</p>
      <p className="mt-0.5 text-label-3 leading-snug text-gray-400">{meta.desc}</p>
      <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
        <div className="flex items-center justify-between gap-2 text-label-3">
          <span className="text-gray-400">현재 상태</span>
          <span className="font-semibold text-gray-500">{before[axisKey]?.raw ?? '-'}</span>
        </div>
        {options.map((opt) => (
          <div key={opt.strategy} className="flex items-center justify-between gap-2 text-label-3">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              <span className="text-gray-500">{opt.label}</span>
            </span>
            <span className="font-bold text-secondary-navy">{opt.axes[axisKey].raw}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
