import { districtOverviews } from '@/mocks';

const SIZE = 132;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** 구역별 평균 가동률 도넛 (구역 비중 = 가동률 기여, 가운데 전체 평균) */
export function DonutUtilization() {
  const items = districtOverviews.map((d) => ({
    id: d.district_id,
    label: d.label,
    color: d.color,
    util: d.summary.avg_utilization_rate,
  }));
  const totalUtil = items.reduce((s, i) => s + i.util, 0);
  const avg = Math.round((totalUtil / items.length) * 10) / 10;

  const fracs = items.map((it) => it.util / totalUtil);
  const segments = items.map((it, i) => {
    const before = fracs.slice(0, i).reduce((a, b) => a + b, 0);
    return { ...it, dash: fracs[i] * C, gap: C - fracs[i] * C, offset: -before * C };
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#eef2f6" strokeWidth={STROKE} />
          {segments.map((s) => (
            <circle
              key={s.id}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.4rem] font-extrabold leading-none text-secondary-navy">{avg}%</span>
          <span className="text-[10px] text-gray-400">전체 평균</span>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 text-label-3">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: it.color }} />
              {it.id}
            </span>
            <span className="font-bold text-secondary-navy">{it.util}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
