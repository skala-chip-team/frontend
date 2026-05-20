const QUEUE_ITEMS = [
  { priority: 'P1', lot: 'UNIT-2472' },
  { priority: 'P2', lot: 'UNIT-2483' },
  { priority: 'P3', lot: 'UNIT-2461' },
  { priority: 'P1', lot: 'UNIT-2451', danger: true },
  { priority: 'P3', lot: 'UNIT  -2495' },
];

export default function CurrentStatusSummary() {
  return (
    <section className="border-b border-gray-300 px-6 py-5">
      <div className="grid grid-cols-[260px_1fr_320px] gap-4">
        <div className="border border-gray-400 px-4 py-3">
          <p className="text-sm font-black text-gray-950">
            SCN-C-03 장비 가동률
          </p>

          <p className="mt-2 text-4xl font-black text-gray-950">
            98%
          </p>

          <p className="mt-1 text-xs font-bold text-gray-600">
            현재 장비 평균 대비 16%p 초과
          </p>
        </div>

        <div className="border border-gray-400 px-4 py-3">
          <div className="flex items-end gap-2">
            <p className="text-sm font-black text-gray-950">
              SCN-C-03 대기큐
            </p>

            <p className="text-xs font-bold text-gray-500">
              5건 대기 | 평균 대기 시간 42분
            </p>
          </div>

          <div className="mt-4 flex overflow-hidden">
            {QUEUE_ITEMS.map((item) => (
              <div
                key={item.lot}
                className={`flex h-12 flex-1 items-center gap-3 border-r-2 border-white px-3 last:border-r-0 ${
                  item.danger ? 'bg-[#F4CACA]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`
                    flex h-8 w-8 items-center justify-center
                    bg-black text-sm font-black text-white
                    ${item.lot === 'UNIT-2472' ? 'ring-4 ring-sky-500' : ''}
                  `}
                >
                  {item.priority}
                </span>

                <span className="whitespace-nowrap text-lg font-black text-gray-950">
                  {item.lot}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-400 px-4 py-3">
          <p className="text-sm font-black text-gray-950">
            UNIT-2451 납기 압박
          </p>

          <p className="mt-3 text-3xl font-black text-gray-950">
            1.4h
            <span className="ml-2 text-base font-bold">
              납기 여유
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}