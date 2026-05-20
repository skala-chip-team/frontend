const queueSteps = [
  {
    step: "Photo 공정",
    waitingCount: 24,
    avgWaitTime: "18분",
    throughput: "320 Unit/h",
    priorityLots: [
      { lot: "LOT-2041", priority: "긴급" },
      { lot: "LOT-2038", priority: "긴급" },
      { lot: "LOT-2033", priority: "주의" },
    ],
  },
  {
    step: "Etching 공정",
    waitingCount: 12,
    avgWaitTime: "9분",
    throughput: "410 Unit/h",
    priorityLots: [
      { lot: "LOT-1988", priority: "주의" },
      { lot: "LOT-1981", priority: "일반" },
    ],
  },
  {
    step: "Inspection 공정",
    waitingCount: 31,
    avgWaitTime: "26분",
    throughput: "190 Unit/h",
    priorityLots: [
      { lot: "LOT-2104", priority: "긴급" },
      { lot: "LOT-2102", priority: "긴급" },
      { lot: "LOT-2098", priority: "주의" },
    ],
  },
];

function getPriorityStyle(priority: string) {
  if (priority === "긴급") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (priority === "주의") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  return "bg-gray-50 text-gray-600 border-gray-200";
}

export default function QueueStatusSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-tight text-gray-950">
          공정 단계별 대기 현황
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Step별 대기 상태와 우선 처리 대상 LOT를 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {queueSteps.map((step) => (
          <article
            key={step.step}
            className="
              rounded-[24px]
              border border-gray-200
              bg-white
              p-4
              shadow-sm
            "
          >
            {/* HEADER */}
            <div className="mb-4">
              <h3 className="text-base font-black text-gray-950">
                {step.step}
              </h3>

              <p className="mt-1 text-xs font-medium text-gray-400">
                실시간 공정 대기 현황
              </p>
            </div>

            {/* KPI */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-gray-100 bg-[#fcfcfa] p-3">
                <p className="text-[11px] font-semibold text-gray-400">
                  대기 수
                </p>

                <strong className="mt-1 block text-lg font-black text-gray-950">
                  {step.waitingCount}
                </strong>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#fcfcfa] p-3">
                <p className="text-[11px] font-semibold text-gray-400">
                  평균 대기
                </p>

                <strong className="mt-1 block text-lg font-black text-gray-950">
                  {step.avgWaitTime}
                </strong>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#fcfcfa] p-3">
                <p className="text-[11px] font-semibold text-gray-400">
                  처리량 전망
                </p>

                <strong className="mt-1 block text-lg font-black text-gray-950">
                  {step.throughput}
                </strong>
              </div>
            </div>

            {/* LOT LIST */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400">
                  우선 처리 대상
                </p>

                <p className="text-xs font-medium text-gray-400">
                  Priority LOT
                </p>
              </div>

              <div className="space-y-2">
                {step.priorityLots.map((lot) => (
                  <div
                    key={lot.lot}
                    className="
                      flex items-center justify-between
                      rounded-2xl
                      border border-gray-100
                      bg-[#fcfcfa]
                      px-3 py-2.5
                    "
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {lot.lot}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        대기 중
                      </p>
                    </div>

                    <span
                      className={`
                        rounded-full border px-2 py-1
                        text-[11px] font-bold
                        ${getPriorityStyle(lot.priority)}
                      `}
                    >
                      {lot.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}