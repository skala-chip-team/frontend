const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

const schedules = [
  {
    id: "LOT-2041",
    process: "Photo 공정",
    product: "HBM4",
    startColumn: 1,
    span: 2,
    status: "normal",
  },
  {
    id: "LOT-2042",
    process: "Etching 공정",
    product: "HBM4",
    startColumn: 3,
    span: 2,
    status: "warning",
  },
  {
    id: "LOT-2043",
    process: "Inspection 공정",
    product: "DDR5",
    startColumn: 5,
    span: 1,
    status: "normal",
  },
  {
    id: "LOT-2044",
    process: "Packaging 공정",
    product: "DDR5",
    startColumn: 6,
    span: 1,
    status: "danger",
  },
];

function getStatusStyle(status: string) {
  if (status === "danger") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  if (status === "warning") {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }

  return "bg-gray-900 text-white border-gray-900";
}

export default function ProductionScheduleSection() {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-tight text-gray-950">
          오늘 생산 스케줄
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          예측된 하루 단위 작업 스케줄을 공정별 간트 차트로 확인합니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
        {/* Time Header */}
        <div className="grid grid-cols-[160px_repeat(6,1fr)] border-b border-gray-100 bg-[#fcfcfa] px-5 py-3">
          <div className="text-xs font-bold text-gray-400">공정 / LOT</div>

          {timeSlots.map((time) => (
            <div
              key={time}
              className="text-center text-xs font-bold text-gray-400"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="grid grid-cols-[160px_repeat(6,1fr)] items-center px-5 py-4"
            >
              {/* Left label */}
              <div>
                <p className="text-sm font-black text-gray-900">
                  {schedule.process}
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-400">
                  {schedule.id} · {schedule.product}
                </p>
              </div>

              {/* Timeline */}
              <div className="col-span-6 grid grid-cols-6 gap-2">
                <div
                  className={`
                    h-9 rounded-xl border px-3
                    text-xs font-bold
                    flex items-center justify-center
                    ${getStatusStyle(schedule.status)}
                  `}
                  style={{
                    gridColumn: `${schedule.startColumn} / span ${schedule.span}`,
                  }}
                >
                  {schedule.id}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-3 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
            정상
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            지연 우려
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            납기 위험
          </div>
        </div>
      </div>
    </section>
  );
}