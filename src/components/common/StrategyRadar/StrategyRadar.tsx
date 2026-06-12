import { useEffect, useRef, useState } from 'react';

export interface RadarSeries {
  key: string;
  name: string;
  color: string; // stroke/fill 색 (hex)
  values: number[]; // 축 순서대로 0~100
}

interface StrategyRadarProps {
  axes: string[];
  descriptions?: string[]; // 축별 설명(툴팁), axes와 같은 순서
  bestAxes?: boolean[]; // 축별 — 선택 전략이 세 전략 중 1등인지, axes와 같은 순서
  series: RadarSeries[];
  selectedKey: string;
  onSelect?: (key: string) => void;
  className?: string;
}

const VW = 320;
const VH = 268;
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

/** 전략 비교 레이더 — 선택 전략 폴리곤만 모핑하며 표시. 축 라벨 hover 시 설명 툴팁 */
export function StrategyRadar({
  axes,
  descriptions,
  bestAxes,
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
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="block w-full"
        role="img"
        aria-label="전략 비교 레이더 차트"
      >
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

        {/* 선택 전략 — 모핑 폴리곤 + 꼭짓점 */}
        <polygon
          points={toPoints(animatedValues)}
          fill={selected.color}
          fillOpacity={0.16}
          stroke={selected.color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />
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
            />
          );
        })}
      </svg>

      {/* 축 라벨(HTML 오버레이) — hover 시 설명 툴팁 */}
      {axes.map((label, index) => {
        const { x, y } = pt(index, 1.16);
        const isMiddle = Math.abs(x - CX) < 6;
        const isRight = x > CX;
        // 라벨 박스를 점 기준으로 정렬: 가운데/오른쪽/왼쪽
        const translateX = isMiddle ? '-50%' : isRight ? '0' : '-100%';
        const best = bestAxes?.[index];
        return (
          <span
            key={label}
            className="group absolute -translate-y-1/2 cursor-default whitespace-nowrap"
            style={{
              left: `${(x / VW) * 100}%`,
              top: `${(y / VH) * 100}%`,
              transform: `translate(${translateX}, -50%)`,
            }}
          >
            <span
              className={`inline-flex items-center transition-all ${
                best
                  ? 'text-[15px] font-extrabold text-secondary-navy'
                  : 'text-[12.5px] font-semibold text-gray-500'
              }`}
            >
              {label}
            </span>

            {descriptions?.[index] ? (
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 scale-95 rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium leading-snug text-white opacity-0 shadow-md shadow-black/10 transition duration-150 group-hover:scale-100 group-hover:opacity-100"
              >
                {descriptions[index]}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-zinc-900" />
              </span>
            ) : null}
          </span>
        );
      })}

      {/* 전략 전환 클릭 영역 — 다른 전략 폴리곤 외곽선(투명). svg 자체는 이벤트 통과 */}
      {onSelect ? (
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="pointer-events-none absolute inset-0 block w-full"
        >
          {series
            .filter((item) => item.key !== selected.key)
            .map((item) => (
              <polygon
                key={item.key}
                points={toPoints(item.values)}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                strokeLinejoin="round"
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelect(item.key)}
              >
                <title>{item.name}</title>
              </polygon>
            ))}
        </svg>
      ) : null}
    </div>
  );
}
