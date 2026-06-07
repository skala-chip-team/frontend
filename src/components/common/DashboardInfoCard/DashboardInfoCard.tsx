import { ArrowDownRight, ArrowUpRight, Gauge, Minus, type LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';

type DashboardInfoCardTrend = {
  value: string;
  direction?: TrendDirection;
  label?: string;
};

type DashboardInfoCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
  trend?: DashboardInfoCardTrend;
  className?: string;
};

const trendStyleMap: Record<
  TrendDirection,
  {
    icon: LucideIcon;
    className: string;
  }
> = {
  up: {
    icon: ArrowUpRight,
    className: 'border-primary-100 bg-primary-50 text-primary-600',
  },
  down: {
    icon: ArrowDownRight,
    className: 'border-orange-100 bg-orange-50 text-secondary-orange',
  },
  neutral: {
    icon: Minus,
    className: 'border-gray-200 bg-gray-50 text-gray-500',
  },
};

export function DashboardInfoCard({
  label,
  value,
  unit,
  icon,
  trend,
  className = '',
}: DashboardInfoCardProps) {
  const ItemIcon = icon ?? Gauge;
  const trendDirection = trend?.direction ?? 'up';
  const trendStyle = trend ? trendStyleMap[trendDirection] : null;
  const TrendIcon = trendStyle?.icon;

  return (
    <article
      className={`flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-3.5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-primary-500">
        <ItemIcon className="h-5 w-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-label-2 leading-snug text-gray-500">{label}</p>

        <div className="mt-0.5 flex items-end gap-1">
          <span className="text-[1.375rem] font-bold leading-none tracking-[-0.03em] text-secondary-navy">
            {value}
          </span>
          {unit ? <span className="pb-px text-label-2 text-gray-500">{unit}</span> : null}
        </div>
      </div>

      {trend && trendStyle && TrendIcon ? (
        <div
          className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2 py-0.5 text-label-3 ${trendStyle.className}`}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trend.value}</span>
          {trend.label ? <span>{trend.label}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

export type { DashboardInfoCardProps, DashboardInfoCardTrend };
