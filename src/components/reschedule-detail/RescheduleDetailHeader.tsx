export default function RescheduleRiskHeader() {
  return (
    <section className="border-b border-gray-300">
      <div className="flex items-start justify-between px-6 py-5">
        <div className="flex items-start gap-4">
          <div
            className="
              flex h-14 w-20 items-center justify-center
              bg-[#EA002C]
              text-xl font-black text-white
            "
          >
            HIGH
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-950">
              SCN-C-03 과부하 누적
            </h1>

            <div className="mt-6 grid grid-cols-4 gap-20">
              <div>
                <p className="text-sm font-semibold text-gray-400">
                  영향 단계
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-black text-gray-950">
                    UNIT-2451
                  </span>

                  <span
                    className="
                      bg-black px-2 py-1
                      text-xs font-black text-white
                    "
                  >
                    P1
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-400">
                  납기
                </p>

                <p className="mt-1 text-2xl font-black text-gray-950">
                  05/05 18:00
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-400">
                  예상 지연
                </p>

                <p className="mt-1 text-2xl font-black text-gray-950">
                  2.3시간
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-400">
                  위험 요인
                </p>

                <p className="mt-1 text-2xl font-black text-gray-950">
                  대기열 누적
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-gray-500">
            감지 14:01 | 지연 확률 78%
          </p>
        </div>
      </div>
    </section>
  );
}