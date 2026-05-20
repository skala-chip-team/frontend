interface RiskAlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const alerts = [
  {
    level: "HIGH",
    title: "Cluster A 장비 부하 증가",
    description: "Scanner-03 대기 LOT 급증",
    impact: "예상 지연 +2H",
    recommendation: "Cluster C로 일부 LOT 분산 권장",
    color: "red",
  },
  {
    level: "MEDIUM",
    title: "긴급 주문 우선 처리 필요",
    description: "HBM4 주문 납기 임박",
    impact: "18:00 이전 출하 필요",
    recommendation: "우선순위 HIGH로 조정 권장",
    color: "orange",
  },
  {
    level: "LOW",
    title: "불량률 상승 감지",
    description: "Inspection 공정 오차 증가",
    impact: "불량률 +0.4%",
    recommendation: "장비 Calibration 점검 필요",
    color: "emerald",
  },
];

const colorStyle = {
  red: {
    badge: "bg-red-100 text-red-700",
    border: "border-red-100",
    dot: "bg-red-500",
  },

  orange: {
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-100",
    dot: "bg-orange-500",
  },

  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
  },
};

export default function RiskAlertPanel({
  isOpen,
  onClose,
}: RiskAlertPanelProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/20 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      {/* Panel */}
      <aside
        className={`
          fixed right-0 top-0 z-50 flex h-screen w-[420px]
          flex-col border-l border-gray-200 bg-white shadow-2xl
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />

                <h2 className="text-xl font-bold text-gray-950">
                  실시간 위험 감지
                </h2>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                AI 기반 운영 위험 및 추천 조치를 제공합니다.
              </p>
            </div>

            <button
              onClick={onClose}
              className="
                rounded-xl p-2 text-gray-500
                transition hover:bg-gray-100 hover:text-gray-900
              "
            >
              ✕
            </button>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {alerts.map((alert, index) => {
            const style =
              colorStyle[alert.color as keyof typeof colorStyle];

            return (
              <div
                key={index}
                className={`
                  rounded-3xl border bg-white p-5 shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1 hover:shadow-md
                  ${style.border}
                `}
              >
                {/* Top */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${style.dot}`}
                    />

                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {alert.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`
                      rounded-full px-2.5 py-1 text-xs font-bold
                      ${style.badge}
                    `}
                  >
                    {alert.level}
                  </span>
                </div>

                {/* Impact */}
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    예상 영향
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {alert.impact}
                  </p>
                </div>

                {/* Recommendation */}
                <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-600">
                    AI 추천 조치
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {alert.recommendation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}