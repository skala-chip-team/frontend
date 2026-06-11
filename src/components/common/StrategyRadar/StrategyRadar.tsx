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

const CX = 140;
const CY = 114;
const R = 72;

/** 전략 비교 레이더 차트 — 선택 전략 강조, 폴리곤 클릭으로 전략 전환 */
export function StrategyRadar({
  axes,
  series,
  selectedKey,
  onSelect,
  className = '',
}: StrategyRadarProps) {
  const angle = (index: number) => ((-90 + (360 / axes.length) * index) * Math.PI) / 180;
  const pt = (index: number, ratio: number) => ({
    x: CX + Math.cos(angle(index)) * R * ratio,
    y: CY + Math.sin(angle(index)) * R * ratio,
  });
  const ringPoints = (ratio: number) =>
    axes
      .map((_, index) => {
        const { x, y } = pt(index, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  const seriesPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const { x, y } = pt(index, value / 100);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  // 선택 전략을 마지막에 그려 위로 올린다
  const ordered = [
    ...series.filter((item) => item.key !== selectedKey),
    ...series.filter((item) => item.key === selectedKey),
  ];

  return (
    <svg viewBox="0 0 280 236" className={className} role="img" aria-label="전략 비교 레이더 차트">
      {[1, 0.5].map((ratio) => (
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

      {ordered.map((item) => {
        const active = item.key === selectedKey;
        return (
          <g
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            <polygon
              points={seriesPoints(item.values)}
              fill={item.color}
              fillOpacity={active ? 0.13 : 0.03}
              stroke={item.color}
              strokeWidth={active ? 2 : 1.2}
              strokeOpacity={active ? 1 : 0.3}
              strokeLinejoin="round"
              className="transition-all duration-300"
            >
              <title>{item.name}</title>
            </polygon>
            {active
              ? item.values.map((value, index) => {
                  const { x, y } = pt(index, value / 100);
                  return (
                    <circle key={index} cx={x} cy={y} r={3} fill={item.color}>
                      <title>{`${axes[index]} ${value}점`}</title>
                    </circle>
                  );
                })
              : null}
          </g>
        );
      })}

      {axes.map((label, index) => {
        const { x, y } = pt(index, 1.17);
        const anchor = Math.abs(x - CX) < 6 ? 'middle' : x > CX ? 'start' : 'end';
        return (
          <text
            key={label}
            x={x}
            y={y + 3}
            textAnchor={anchor}
            className="fill-gray-400 text-[10px] font-medium"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
