import { motion, useReducedMotion } from "framer-motion";

interface ClusterStatusCardProps {
  name: string;
  process: string;
  utilization: number;
  activeLots: number;
  equipmentIssueCount: number;
  productionCount: number;
  defectCount: number;
  status: "normal" | "warning" | "danger";
}

const statusStyle = {
  normal: {
    label: "정상",
    color: "#4B7A63",
    badge: "bg-emerald-100 text-emerald-700",
  },

  warning: {
    label: "주의",
    color: "#D97706",
    badge: "bg-orange-100 text-orange-700",
  },

  danger: {
    label: "위험",
    color: "#DC2626",
    badge: "bg-red-100 text-red-700",
  },
};

export default function ClusterStatusCard({
  name,
  process,
  utilization,
  activeLots,
  equipmentIssueCount,
  productionCount,
  defectCount,
  status,
}: ClusterStatusCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const style = statusStyle[status];

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - utilization / 100);

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-[28px]
        border border-gray-200
        bg-white
        p-5
        shadow-sm
        transition-all duration-300
        hover:shadow-md
      "
    >
      <div className="flex items-center gap-6">
        {/* LEFT GAUGE */}
        <div className="relative flex h-[120px] w-[120px] items-center justify-center">
          <svg className="h-[120px] w-[120px] -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />

            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke={style.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      strokeDashoffset: circumference,
                    }
              }
              animate={{
                strokeDashoffset: progressOffset,
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <strong className="text-2xl font-black text-gray-950">
              {utilization}%
            </strong>

            <p className="text-[10px] font-semibold tracking-wide text-gray-500">
              LOAD
            </p>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-950">
                {name}
              </h3>

              <p className="mt-1 text-sm font-medium text-gray-500">
                {process}
              </p>
            </div>

            <span
              className={`
                rounded-full px-3 py-1 text-xs font-bold
                ${style.badge}
              `}
            >
              {style.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500">
                진행 LOT
              </p>

              <strong className="mt-1 block text-lg font-black text-gray-950">
                {activeLots}
              </strong>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500">
                장비 이슈
              </p>

              <strong className="mt-1 block text-lg font-black text-gray-950">
                {equipmentIssueCount}
              </strong>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500">
                생산 수량
              </p>

              <strong className="mt-1 block text-lg font-black text-gray-950">
                {productionCount.toLocaleString()}
              </strong>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500">
                불량 수량
              </p>

              <strong className="mt-1 block text-lg font-black text-gray-950">
                {defectCount.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}