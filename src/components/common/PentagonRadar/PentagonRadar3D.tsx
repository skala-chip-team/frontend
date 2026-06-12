import { useMemo, useState } from 'react';

import { Check, Hexagon, Pentagon, Sparkles } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Edges, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import {
  pentagonAxes,
  type PentagonData,
  type PentagonOption,
} from '@/mocks/reschedulePentagon';

import { DASH, scoreColor, usePrefersReducedMotion, useTween } from './PentagonRadar';

// ── 기하 (월드 단위) ──
const R = 1.6; // 최대 반지름
const MAX_H = 1.35; // 종합점수 100 → 이 높이
const TAU = Math.PI * 2;

function axisAngle(i: number, n: number) {
  return -Math.PI / 2 + (i / n) * TAU;
}
/** 축 i의 월드 좌표 (지면 XZ, y=0). extrude 매핑(shape y → world -z)과 일치 */
function worldPoint(i: number, n: number, r: number): [number, number, number] {
  const a = axisAngle(i, n);
  return [Math.cos(a) * r, 0, -Math.sin(a) * r];
}

type Axis = (typeof pentagonAxes)[number];

interface PentagonRadar3DProps {
  data: PentagonData;
  onConfirm?: (strategy: string) => void;
}

export function PentagonRadar3D({ data, onConfirm }: PentagonRadar3DProps) {
  const reduced = usePrefersReducedMotion();

  const [showStability, setShowStability] = useState(false);
  const [morph, setMorph] = useState<'before' | 'after'>('after');
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);

  const recommended = data.options.find((o) => o.recommended) ?? data.options[0];
  const focusKey = highlightedKey ?? recommended.strategy;
  const focusOption = data.options.find((o) => o.strategy === focusKey) ?? recommended;
  const singleFocus = morph === 'before';

  const activeAxes = useMemo(
    () => pentagonAxes.filter((a) => a.base || showStability),
    [showStability]
  );
  const n = activeAxes.length;
  const morphP = useTween(morph === 'after' ? 1 : 0, 450, !reduced);

  const scoreOf = (opt: PentagonOption, axisKey: string) => {
    const after = opt.axes[axisKey].score;
    if (opt.strategy === focusKey) {
      const before = data.before[axisKey]?.score ?? 0;
      return before + (after - before) * morphP;
    }
    return after;
  };
  const avgScore = (opt: PentagonOption) =>
    Math.round(activeAxes.reduce((s, a) => s + opt.axes[a.key].score, 0) / n);

  const opacityOf = (opt: PentagonOption) => {
    if (singleFocus) return opt.strategy === focusKey ? 0.62 : 0;
    if (highlightedKey) return opt.strategy === highlightedKey ? 0.66 : 0.08;
    return opt.recommended ? 0.62 : 0.4;
  };

  const handleConfirm = () => {
    setConfirmedKey(focusKey);
    onConfirm?.(focusKey);
  };

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
      {/* ── 3D 캔버스 ── */}
      <div className="relative mx-auto h-[420px] w-full max-w-[480px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100">
        <Canvas camera={{ position: [0, 2.7, 3.9], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 2]} intensity={0.9} />
          <directionalLight position={[-3, 2, -2]} intensity={0.3} />

          {/* 그리드 링 + 스포크 */}
          <RadarGrid axes={activeAxes} n={n} />

          {/* 현재 상태(before) 참조 — singleFocus 시 */}
          {singleFocus ? (
            <Line
              points={[
                ...activeAxes.map((ax) => {
                  const i = activeAxes.indexOf(ax);
                  return worldPoint(i, n, (R * (data.before[ax.key]?.score ?? 0)) / 100);
                }),
                worldPoint(0, n, (R * (data.before[activeAxes[0].key]?.score ?? 0)) / 100),
              ]}
              color="#94a3b8"
              lineWidth={1.5}
              dashed
              dashSize={0.08}
              gapSize={0.06}
            />
          ) : null}

          {/* 옵션 프리즘 (부피 = 종합점수) */}
          {data.options.map((opt) => {
            const op = opacityOf(opt);
            if (op <= 0) return null;
            return (
              <OptionPrism
                key={opt.strategy}
                axes={activeAxes}
                n={n}
                color={opt.color}
                opacity={op}
                height={(avgScore(opt) / 100) * MAX_H * (opt.strategy === focusKey ? morphP : 1)}
                scoreFn={(k) => scoreOf(opt, k)}
                recommended={opt.recommended && !highlightedKey && !singleFocus}
                confirmed={confirmedKey === opt.strategy}
              />
            );
          })}

          {/* 축 라벨 + 호버 */}
          {activeAxes.map((ax, i) => {
            const [x, , z] = worldPoint(i, n, R * 1.16);
            const hovered = hoveredAxis === ax.key;
            return (
              <Html key={ax.key} position={[x, 0.06, z]} center distanceFactor={7}>
                <div
                  onPointerEnter={() => setHoveredAxis(ax.key)}
                  onPointerLeave={() => setHoveredAxis(null)}
                  className={`cursor-help select-none whitespace-nowrap rounded-md px-1.5 py-0.5 text-[13px] font-bold ${
                    hovered ? 'bg-secondary-navy text-white' : 'text-secondary-navy'
                  }`}
                >
                  {ax.label}
                </div>
              </Html>
            );
          })}

          <OrbitControls
            makeDefault
            enablePan={false}
            target={[0, 0.45, 0]}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={1.45}
            autoRotate={!reduced && !highlightedKey && !singleFocus}
            autoRotateSpeed={0.5}
          />
        </Canvas>

        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] text-gray-400">
          드래그하면 회전합니다 · 높이·크기가 클수록 좋은 안
        </p>

        {/* 축 호버 툴팁 (캔버스 밖 오버레이) */}
        {hoveredAxis ? (
          <div className="pointer-events-none absolute left-3 top-3 z-10 w-52 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur">
            <AxisTooltipContent axisKey={hoveredAxis} data={data} />
          </div>
        ) : null}
      </div>

      {/* ── 사이드 패널 (2D와 동일 구성) ── */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-body-2 text-emerald-800">
            <span className="font-semibold">AI 추천</span> ·{' '}
            <span className="font-bold">{recommended.label}</span> — 부피(종합)가 가장 큽니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowStability((v) => !v)}
            aria-pressed={showStability}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
          >
            {showStability ? <Hexagon className="h-4 w-4" /> : <Pentagon className="h-4 w-4" />}
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
            “{focusOption.label}” 선택 시 →{' '}
            <span className="font-semibold text-primary-600">재조정 후</span>로 부피가 커집니다.
          </p>
        ) : null}

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

/** 옵션 프리즘 — footprint(레이더 다각형) × 높이(종합점수) */
function OptionPrism({
  axes,
  n,
  color,
  opacity,
  height,
  scoreFn,
  recommended,
  confirmed,
}: {
  axes: Axis[];
  n: number;
  color: string;
  opacity: number;
  height: number;
  scoreFn: (axisKey: string) => number;
  recommended: boolean;
  confirmed: boolean;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    axes.forEach((ax, i) => {
      const a = axisAngle(i, n);
      const r = (R * scoreFn(ax.key)) / 100;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
    s.closePath();
    return s;
  }, [axes, n, scoreFn]);

  const h = Math.max(0.05, height);
  const scale = confirmed ? 1.06 : 1;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <extrudeGeometry args={[shape, { depth: h, bevelEnabled: false }]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.35}
        metalness={0.15}
        emissive={color}
        emissiveIntensity={recommended ? 0.35 : 0.12}
        depthWrite={false}
      />
      <Edges threshold={15} color={color} />
    </mesh>
  );
}

/** 그리드 링 + 스포크 */
function RadarGrid({ axes, n }: { axes: Axis[]; n: number }) {
  return (
    <group>
      {[0.25, 0.5, 0.75, 1].map((lvl) => (
        <Line
          key={lvl}
          points={[
            ...axes.map((_, i) => worldPoint(i, n, R * lvl)),
            worldPoint(0, n, R * lvl),
          ]}
          color="#cbd5e1"
          lineWidth={1}
        />
      ))}
      {axes.map((_, i) => (
        <Line
          key={i}
          points={[
            [0, 0, 0],
            worldPoint(i, n, R),
          ]}
          color="#cbd5e1"
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/** 툴팁 본문 (축 라벨 + 설명 + 각 안의 raw) */
function AxisTooltipContent({ axisKey, data }: { axisKey: string; data: PentagonData }) {
  const meta = pentagonAxes.find((a) => a.key === axisKey);
  if (!meta) return null;
  return (
    <>
      <p className="text-label-1 font-bold text-secondary-navy">{meta.label}</p>
      <p className="mt-0.5 text-label-3 leading-snug text-gray-400">{meta.desc}</p>
      <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
        <div className="flex items-center justify-between gap-2 text-label-3">
          <span className="text-gray-400">현재 상태</span>
          <span className="font-semibold text-gray-500">{data.before[axisKey]?.raw ?? '-'}</span>
        </div>
        {data.options.map((opt) => (
          <div key={opt.strategy} className="flex items-center justify-between gap-2 text-label-3">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} />
              <span className="text-gray-500">{opt.label}</span>
            </span>
            <span className="font-bold text-secondary-navy">{opt.axes[axisKey].raw}</span>
          </div>
        ))}
      </div>
    </>
  );
}
