const equipmentGroups = [
  {
    area: "구역 A",
    process: "Photo 공정",
    normalCount: 21,
    equipments: [
      { name: "Scanner-03", load: 92, status: "과부하" },
      { name: "Track-02", load: 85, status: "주의" },
      { name: "Inspect-01", load: 78, status: "주의" },
    ],
  },
  {
    area: "구역 B",
    process: "Etching 공정",
    normalCount: 18,
    equipments: [],
  },
  {
    area: "구역 C",
    process: "Inspection 공정",
    normalCount: 18,
    equipments: [
      { name: "Inspector-01", load: 91, status: "과부하" },
      { name: "Review-02", load: 83, status: "주의" },
      { name: "Sorter-01", load: 77, status: "주의" },
    ],
  },
];

function getStatusStyle(status: string) {
  if (status === "과부하") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (status === "주의") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  return "bg-gray-50 text-gray-600 border-gray-200";
}

export default function EquipmentStatusSection() {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-tight text-gray-950">
          구역별 장비 상태
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          현재 우선 확인이 필요한 장비 상태입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {equipmentGroups.map((group) => {
          const isAllNormal = group.equipments.length === 0;

          return (
            <article
              key={group.area}
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
                  {group.area}
                </h3>

                <p className="mt-1 text-xs font-medium text-gray-400">
                  {group.process}
                </p>
              </div>

              {/* NORMAL */}
              {isAllNormal ? (
                <div
                  className="
                    flex min-h-[172px] flex-col items-center justify-center
                    rounded-[20px]
                    border border-gray-100
                    bg-[#fcfcfa]
                    px-4 py-8
                    text-center
                  "
                >
                  <div className="mb-3 h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <p className="text-sm font-bold text-gray-900">
                    현재 이상 징후 없음
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    장비 {group.normalCount}대 정상 운영 중
                  </p>
                </div>
              ) : (
                <>
                  {/* EQUIPMENT LIST */}
                  <div className="space-y-2">
                    {group.equipments.map((equipment) => (
                      <div
                        key={equipment.name}
                        className="
                          flex items-center justify-between
                          rounded-2xl
                          border border-gray-100
                          bg-gray-50
                          px-3 py-2.5
                        "
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {equipment.name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            Load {equipment.load}%
                          </p>
                        </div>

                        <span
                          className={`
                            rounded-full border px-2 py-1
                            text-[11px] font-bold
                            ${getStatusStyle(equipment.status)}
                          `}
                        >
                          {equipment.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* BUTTON */}
                  <button
                    type="button"
                    className="
                      mt-3 w-full
                      rounded-2xl
                      border border-gray-200
                      bg-white
                      px-3 py-2.5
                      text-sm font-semibold text-gray-700
                      transition hover:bg-gray-50
                    "
                  >
                    전체 장비 보기
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}