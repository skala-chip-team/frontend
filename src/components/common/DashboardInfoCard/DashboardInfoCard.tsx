import { ArrowDownRight, ArrowUpRight, Gauge, Minus, type LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';

type DashboardInfoCardItem = {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    direction?: TrendDirection;
    label?: string;
  };
};

type DashboardInfoCardProps = {
  eyebrow?: string;
  title: string;
  items: DashboardInfoCardItem[];
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
  eyebrow = 'DASHBOARD CARD',
  title,
  items,
  className = '',
}: DashboardInfoCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur lg:p-7 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-18%] h-32 w-32 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-28 w-28 rounded-full bg-secondary-orange/6 blur-3xl" />
      </div>

      <div className="relative">
        <p className="text-label-2 font-semibold tracking-[0.2em] text-primary-500">{eyebrow}</p>

        <h2 className="mt-3 text-heading-3 text-gray-900">{title}</h2>

        <div className="mt-6 grid gap-3">
          {items.map((item) => {
            const ItemIcon = item.icon ?? Gauge;
            const trendDirection = item.trend?.direction ?? 'up';
            const trendStyle = item.trend ? trendStyleMap[trendDirection] : null;
            const TrendIcon = trendStyle?.icon;

            return (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-500 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
                      <ItemIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-label-1 text-gray-500">{item.label}</p>

                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-[1.75rem] font-bold tracking-[-0.04em] text-secondary-navy">
                          {item.value}
                        </span>

                        {item.unit ? (
                          <span className="pb-2 text-label-1 text-gray-500">{item.unit}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {item.trend && trendStyle && TrendIcon ? (
                    <div
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-label-3 ${trendStyle.className}`}
                    >
                      <TrendIcon className="h-3.5 w-3.5" />
                      <span>{item.trend.value}</span>
                      {item.trend.label ? <span>{item.trend.label}</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export type { DashboardInfoCardItem, DashboardInfoCardProps };
