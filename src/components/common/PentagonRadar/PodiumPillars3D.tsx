import { useMemo, useState } from 'react';

import { Check, Sparkles } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';

import {
  pentagonAxes,
  type PentagonData,
  type PentagonOption,
} from '@/mocks/reschedulePentagon';

import { scoreColor, usePrefersReducedMotion, useTween } from './PentagonRadar';

// 축별 색 (색칸 = 축 기여). 색약 대비: 명도 차 + 라벨 병행.
const AXIS_COLORS: Record<string, string> = {
  rescue: '#16a34a',
  deadline: '#2563eb',
  speed: '#f59e0b',
  wait: '#0891b2',
  utilization: '#7c3aed',
  stability: '#db2777',
};

const SEG_UNIT = 0.0042; // 점수 1점당 월드 높이
const GAP = 0.14; // 분해 시 칸 사이 간격
const COL_W = 0.72;
const POS_X = [0, -2.05, 2.05]; // rank0=가운데, 1=왼쪽, 2=오른쪽
const PLATFORM_TOP = [0.22, 0.14, 0.1]; // 시상대 단 높이(우승이 가장 높음)

type Axis = (typeof pentagonAxes)[number];

interface PodiumPillars3DProps {
  data: PentagonData;
  onConfirm?: (strategy: string) => void;
}

export function PodiumPillars3D({ data, onConfirm }: PodiumPillars3DProps) {
  const reduced = usePrefersReducedMotion();

  const [showStability, setShowStability] = useState(false);
  const [morph, setMorph] = useState<'before' | 'after'>('after');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ opt: string; axis: string } | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);

  const recommended = data.options.find((o) => o.recommended) ?? data.options[0];

  const activeAxes = useMemo(
    () => pentagonAxes.filter((a) => a.base || showStability),
    [showStability]
  );
  const n = activeAxes.length;
  const morphP = useTween(morph === 'after' ? 1 : 0, 500, !reduced);

  const scoreOf = (opt: PentagonOption, axisKey: string) => {
    const before = data.before[axisKey]?.score ?? 0;
    const after = opt.axes[axisKey].score;
    return before + (after - before) * morphP;
  };
  const avgScore = (opt: PentagonOption) =>
    Math.round(activeAxes.reduce((s, a) => s + opt.axes[a.key].score, 0) / n);

  // 종합점수 내림차순 → 시상대 순위(0=우승 가운데)
  const ranked = useMemo(
    () => [...data.options].sort((a, b) => avgScore(b) - avgScore(a)),
    // avgScore는 activeAxes 의존 → showStability 바뀌면 재정렬
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.options, showStability]
  );

  const focusKey = expandedKey ?? recommended.strategy;
  const focusOption = data.options.find((o) => o.strategy === focusKey) ?? recommended;

  const handleConfirm = () => {
    setConfirmedKey(focusKey);
    onConfirm?.(focusKey);
  };

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
      {/* ── 3D 시상대 ── */}
      <div className="relative mx-auto h-[440px] w-full max-w-[520px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900">
        <Canvas camera={{ position: [0, 2.4, 5.4], fov: 42 }} dpr={[1, 2]}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 6, 4]} intensity={0.7} />
          {/* 우승 스포트라이트 */}
          <spotLight
            position={[0, 6, 2.5]}
            angle={0.5}
            penumbra={0.6}
            intensity={2.2}
            color="#fff7d6"
            target-position={[POS_X[0], 0, 0]}
          />

          {/* 바닥 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {ranked.map((opt, rank) => (
            <Pillar
              key={opt.strategy}
              option={opt}
              rank={rank}
              axes={activeAxes}
              scoreFn={(k) => scoreOf(opt, k)}
              avg={avgScore(opt)}
              expanded={expandedKey === opt.strategy}
              dimmed={expandedKey !== null && expandedKey !== opt.strategy}
              isRecommended={opt.recommended}
              confirmed={confirmedKey === opt.strategy}
              onToggle={() =>
                setExpandedKey((prev) => (prev === opt.strategy ? null : opt.strategy))
              }
              onHover={(axis) => setHovered(axis ? { opt: opt.strategy, axis } : null)}
            />
          ))}

          <OrbitControls
            makeDefault
            enablePan={false}
            target={[0, 0.95, 0]}
            minDistance={4}
            maxDistance={9}
            maxPolarAngle={1.5}
            autoRotate={!reduced && expandedKey === null}
            autoRotateSpeed={0.45}
          />
        </Canvas>

        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] text-slate-400">
          드래그 회전 · 높을수록 좋은 안 · 기둥 클릭 → 축별 분해
        </p>

        {/* 호버 툴팁 */}
        {hovered ? (
          <div className="pointer-events-none absolute left-3 top-3 z-10 w-52 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.22)] backdrop-blur">
            <HoverTooltip data={data} optKey={hovered.opt} axisKey={hovered.axis} />
          </div>
        ) : null}
      </div>

      {/* ── 사이드 패널 ── */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-body-2 text-emerald-800">
            <span className="font-semibold">AI 추천</span> ·{' '}
            <span className="font-bold">{recommended.label}</span> — 종합 점수가 가장 높습니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowStability((v) => !v)}
            aria-pressed={showStability}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
          >
            {showStability ? '안정성 축 포함 (6)' : '기본 축 (5)'}
          </button>
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-200">
            {(['before', 'after'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMorph(m)}
                aria-pressed={morph === m}
                className={`px-3 py-1.5 text-label-2 font-semibold transition ${
                  morph === m ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-surface-100'
                }`}
              >
                {m === 'before' ? '현재 상태' : '재조정 후'}
              </button>
            ))}
          </div>
        </div>
        {morph === 'before' ? (
          <p className="text-label-3 text-gray-400">
            <span className="font-semibold text-primary-600">재조정 후</span>로 바꾸면 기둥이 자라납니다.
          </p>
        ) : null}

        {/* 축 색 범례 */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 rounded-xl border border-gray-100 bg-surface-100/60 px-3 py-2">
          {activeAxes.map((ax) => (
            <span key={ax.key} className="flex items-center gap-1.5 text-label-3 text-gray-500">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: AXIS_COLORS[ax.key] }}
              />
              {ax.label}
            </span>
          ))}
        </div>

        {/* 옵션 카드 (클릭 → 해당 기둥 분해/강조) */}
        <div className="flex flex-col gap-2">
          {data.options.map((opt) => {
            const active = expandedKey === opt.strategy;
            const avg = avgScore(opt);
            return (
              <button
                key={opt.strategy}
                type="button"
                onClick={() =>
                  setExpandedKey((prev) => (prev === opt.strategy ? null : opt.strategy))
                }
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                  active
                    ? 'border-secondary-navy bg-surface-100 ring-1 ring-secondary-navy/15'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span
                  className="h-8 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-2 font-bold text-secondary-navy">{opt.label}</span>
                    {opt.recommended ? (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        ★ 추천
                      </span>
                    ) : null}
                  </div>
                  <p className="text-label-3 text-gray-400">
                    {active ? '축별 분해 보기 중' : '종합 점수'}
                  </p>
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

/** 시상대 기둥 하나 (축별 색칸 스택) */
function Pillar({
  option,
  rank,
  axes,
  scoreFn,
  avg,
  expanded,
  dimmed,
  isRecommended,
  confirmed,
  onToggle,
  onHover,
}: {
  option: PentagonOption;
  rank: number;
  axes: Axis[];
  scoreFn: (axisKey: string) => number;
  avg: number;
  expanded: boolean;
  dimmed: boolean;
  isRecommended: boolean;
  confirmed: boolean;
  onToggle: () => void;
  onHover: (axisKey: string | null) => void;
}) {
  const x = POS_X[rank] ?? 0;
  const platformTop = PLATFORM_TOP[rank] ?? 0.1;
  const gap = expanded ? GAP : 0;
  const opacity = dimmed ? 0.18 : 1;

  // 세그먼트 누적 배치 (재할당 없이 순수 계산)
  const heights = axes.map((ax) => Math.max(0.012, scoreFn(ax.key) * SEG_UNIT));
  const offsets = heights.map((_, i) => heights.slice(0, i).reduce((a, b) => a + b, 0));
  const segments = axes.map((ax, i) => ({
    ax,
    h: heights[i],
    cy: platformTop + offsets[i] + heights[i] / 2 + gap * i,
    color: AXIS_COLORS[ax.key],
    raw: option.axes[ax.key].raw,
  }));
  const totalH = heights.reduce((a, b) => a + b, 0);
  const topY = platformTop + totalH + gap * (axes.length - 1);
  const scale = confirmed ? 1.05 : 1;

  return (
    <group position={[x, 0, 0]} scale={scale} onClick={onToggle}>
      {/* 시상대 단 */}
      <mesh position={[0, platformTop / 2, 0]}>
        <boxGeometry args={[COL_W + 0.5, platformTop, COL_W + 0.5]} />
        <meshStandardMaterial
          color={rank === 0 ? '#f5d061' : '#475569'}
          emissive={rank === 0 ? '#f5d061' : '#000000'}
          emissiveIntensity={rank === 0 ? 0.25 : 0}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 축별 색칸 */}
      {segments.map((s) => (
        <mesh
          key={s.ax.key}
          position={[0, s.cy, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(s.ax.key);
          }}
          onPointerOut={() => onHover(null)}
        >
          <boxGeometry args={[COL_W, s.h, COL_W]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={isRecommended ? 0.28 : 0.12}
            transparent
            opacity={opacity}
            roughness={0.4}
          />
          {/* 분해 시 칸 라벨 */}
          {expanded ? (
            <Html position={[COL_W / 2 + 0.15, 0, 0]} center distanceFactor={8}>
              <div className="pointer-events-none whitespace-nowrap rounded-md bg-white/95 px-2 py-1 text-[12px] shadow">
                <span className="font-bold text-secondary-navy">{s.ax.label}</span>
                <span className="ml-1.5 font-semibold" style={{ color: s.color }}>
                  {s.raw}
                </span>
              </div>
            </Html>
          ) : null}
        </mesh>
      ))}

      {/* 라벨 + 종합점수 */}
      <Html position={[0, topY + 0.32, 0]} center distanceFactor={9}>
        <div className="pointer-events-none flex flex-col items-center gap-0.5">
          {isRecommended ? (
            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-amber-950 shadow">
              ★ AI 추천
            </span>
          ) : null}
          <span
            className="text-[26px] font-extrabold leading-none drop-shadow"
            style={{ color: scoreColor(avg) }}
          >
            {avg}
          </span>
          <span className="whitespace-nowrap text-[13px] font-bold text-white drop-shadow">
            {option.label}
          </span>
        </div>
      </Html>
    </group>
  );
}

function HoverTooltip({
  data,
  optKey,
  axisKey,
}: {
  data: PentagonData;
  optKey: string;
  axisKey: string;
}) {
  const meta = pentagonAxes.find((a) => a.key === axisKey);
  const opt = data.options.find((o) => o.strategy === optKey);
  if (!meta || !opt) return null;
  return (
    <>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: AXIS_COLORS[axisKey] }}
        />
        <p className="text-label-1 font-bold text-secondary-navy">{meta.label}</p>
      </div>
      <p className="mt-0.5 text-label-3 leading-snug text-gray-400">{meta.desc}</p>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-label-2">
        <span className="font-semibold text-gray-500">{opt.label}</span>
        <span className="font-bold text-secondary-navy">{opt.axes[axisKey].raw}</span>
      </div>
    </>
  );
}
