import { useEffect, useRef, useState } from 'react';

export interface RadarSeries {
  key: string;
  name: string;
  color: string; // stroke/fill 색 (hex)
  values: number[]; // 축 순서대로 0~100
}

interface StrategyRadarProps {
  axes: string[];
  series: RadarSeries[];
  selectedKey: string;
  onSelect?: (key: string) => void;
  className?: string;
}

const CX = 160;
const CY = 130;
const R = 92;

/** 값 배열이 바뀔 때 이전 형태에서 새 형태로 보간 — 레이더 폴리곤 모핑용 */
function useAnimatedValues(target: number[], duration = 500): number[] {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const key = target.join('|');

  useEffect(() => {
    const next = key.split('|').map(Number);
    const from = displayRef.current;
    if (from.length === next.length && from.every((value, i) => value === next[i]))
      return undefined;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const values = next.map((to, i) => (from[i] ?? to) + (to - (from[i] ?? to)) * eased);
      displayRef.current = values;
      setDisplay(values);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, duration]);

  return display;
}

/** 전략 비교 레이더 — 선택 전략 폴리곤이 모핑하며 전환, 나머지는 점선 고스트 */
export function StrategyRadar({
  axes,
  series,
  selectedKey,
  onSelect,
  className = '',
}: StrategyRadarProps) {
  const selected = series.find((item) => item.key === selectedKey) ?? series[0];
  const animatedValues = useAnimatedValues(selected.values);

  const angle = (index: number) => ((-90 + (360 / axes.length) * index) * Math.PI) / 180;
  const pt = (index: number, ratio: number) => ({
    x: CX + Math.cos(angle(index)) * R * ratio,
    y: CY + Math.sin(angle(index)) * R * ratio,
  });
  const toPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const { x, y } = pt(index, value / 100);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  const ringPoints = (ratio: number) =>
    axes
      .map((_, index) => {
        const { x, y } = pt(index, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <svg viewBox="0 0 320 268" className={className} role="img" aria-label="전략 비교 레이더 차트">
      {[1, 2 / 3, 1 / 3].map((ratio) => (
        <polygon
          key={ratio}
          points={ringPoints(ratio)}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={ratio === 1 ? 1 : 0.5}
        />
      ))}
      {axes.map((_, index) => {
        const { x, y } = pt(index, 1);
        return <line key={index} x1={CX} y1={CY} x2={x} y2={y} stroke="#F3F4F6" />;
      })}

      {/* 비선택 전략 — 점선 고스트 (넓은 투명 스트로크로 클릭 영역 확보) */}
      {series
        .filter((item) => item.key !== selected.key)
        .map((item) => (
          <g
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            <polygon
              points={toPoints(item.values)}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
              strokeLinejoin="round"
            >
              <title>{item.name}</title>
            </polygon>
            <polygon
              points={toPoints(item.values)}
              fill="none"
              stroke={item.color}
              strokeOpacity={0.28}
              strokeWidth={1.3}
              strokeDasharray="4 3"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          </g>
        ))}

      {/* 선택 전략 — 모핑 폴리곤 + 꼭짓점 */}
      <g>
        <polygon
          points={toPoints(animatedValues)}
          fill={selected.color}
          fillOpacity={0.16}
          stroke={selected.color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          className="transition-colors duration-300"
        >
          <title>{selected.name}</title>
        </polygon>
        {animatedValues.map((value, index) => {
          const { x, y } = pt(index, value / 100);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={3.5}
              fill={selected.color}
              className="transition-colors duration-300"
            >
              <title>{`${axes[index]} ${selected.values[index]}점`}</title>
            </circle>
          );
        })}
      </g>

      {axes.map((label, index) => {
        const { x, y } = pt(index, 1.16);
        const anchor = Math.abs(x - CX) < 6 ? 'middle' : x > CX ? 'start' : 'end';
        return (
          <text
            key={label}
            x={x}
            y={y + 4}
            textAnchor={anchor}
            className="fill-gray-500 text-[11px] font-semibold"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
