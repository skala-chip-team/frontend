import { useState } from 'react';

export default function SelectedCandidateDetail() {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <section className="px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-950">후보 A</h2>

        <div className="flex border border-gray-400">
          <div className="bg-black px-4 py-2 text-xs font-black text-white">
            설비 대체
          </div>

          <div className="px-4 py-2 text-lg font-black text-gray-950">
            SCN-C-03 → SCN-C-07
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="ml-[145px] grid grid-cols-5 text-sm font-bold text-gray-600">
  <span className="text-center">07:00</span>
  <span className="text-center">08:00</span>
  <span className="text-center">09:00</span>
  <span className="text-center">10:00</span>
  <span className="text-center">11:00</span>
</div>

        <div className="mt-3 space-y-5 border-t border-gray-300 pt-4">
          <ScheduleRow
            type="변경전"
            equipment="SCN-C-03"
            queue="대기 5건"
            color="bg-[#A92B2B]"
            textColor="text-[#A92B2B]"
            barLeft="left-[8%]"
            barWidth="w-[46%]"
            doneLeft="right-[6%]"
            doneTime="완료 09:48"
            processTime="처리 1.5h"
          />

          <ScheduleRow
            type="변경후"
            equipment="SCN-C-07"
            queue="대기 0건"
            color="bg-[#2F6B4F]"
            textColor="text-[#2F6B4F]"
            barLeft="left-[2%]"
            barWidth="w-[28%]"
            doneLeft="left-[33%]"
            doneTime="완료 08:05"
            processTime="처리 1.2h"
          />
        </div>
      </div>

      <div className="mt-5 bg-black px-4 py-3">
        <p className="text-base font-black text-white">
          완료 시간 1시간 43분 단축
        </p>
      </div>

      <div className="mt-5">
        <p className="text-xl font-black text-gray-950">예상 효과</p>

        <div className="mt-3 grid grid-cols-4 gap-3">
          <EffectCard title="납기 여유" value="3.2h" sub="+1.8h" green />
          <EffectCard title="최대 가동률" value="86%" sub="-12%p" />
          <EffectCard title="평균 대기" value="8분" sub="-34분" />
          <EffectCard title="영향 UNIT" value="1건" sub="UNIT-2451" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xl font-black text-gray-950">결론</p>

        <p className="mt-2 text-sm font-bold leading-6 text-gray-700">
          옵션 A 적용 시 UNIT-2451이 1시간 43분 일찍 완료되어 납기 여유가
          확보됩니다. SCN-C-03 부하는 12%p 감소합니다.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setIsReportOpen(true)}
        className="
          mt-6 w-full border border-black
          bg-white px-5 py-4
          text-lg font-black text-black
          transition-colors
          hover:bg-black hover:text-white
        "
      >
        AI 리포트 확인 & 재조정 승인하기
      </button>

      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/20">
          <button
            type="button"
            aria-label="AI 리포트 닫기"
            onClick={() => setIsReportOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <aside
            className="
              absolute right-0 top-0
              h-full w-[460px]
              bg-white p-6
              shadow-2xl
            "
          >
            <div className="flex items-start justify-between border-b border-gray-200 pb-5">
              <div>
                <p className="text-xs font-black text-[#EA002C]">
                  AI GENERATED REPORT
                </p>

                <h3 className="mt-2 text-2xl font-black text-gray-950">
                  AI 분석 리포트
                </h3>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  후보 A 재조정안 도출 근거
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="text-sm font-black text-gray-400 hover:text-gray-900"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 space-y-6 text-sm leading-7 text-gray-700">
              <ReportBlock title="위험 분석">
                SCN-C-03 장비의 Queue 적체가 증가하며 UNIT-2451의 납기 초과
                가능성이 78%로 분석되었습니다. 현재 대기열은 5건이며 평균 대기
                시간은 42분입니다.
              </ReportBlock>

              <ReportBlock title="적용 규칙">
                <ul className="list-disc space-y-1 pl-5">
                  <li>납기 임박 UNIT 우선 처리</li>
                  <li>Queue 30분 이상 적체 시 우회 권장</li>
                  <li>가동률 90% 이상 시 병목 위험 판단</li>
                </ul>
              </ReportBlock>

              <ReportBlock title="추천 사유">
                SCN-C-07 장비는 현재 대기 Queue가 없어 UNIT-2451을 즉시 처리
                가능하며, 전체 지연시간 감소 효과가 가장 높게 예측되었습니다.
              </ReportBlock>

              <ReportBlock title="예상 효과">
                UNIT-2451의 완료 시간은 09:48에서 08:05로 앞당겨지며, 예상
                지연시간은 1시간 43분 감소합니다. SCN-C-03의 최대 가동률은
                98%에서 86%로 완화됩니다.
              </ReportBlock>
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-6">
              <button
                type="button"
                className="
                  w-full bg-[#EA002C]
                  px-5 py-4
                  text-base font-black text-white
                  transition-colors
                  hover:bg-[#c40025]
                "
              >
                재조정안 승인하기
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function ScheduleRow({
  type,
  equipment,
  queue,
  color,
  textColor,
  barLeft,
  barWidth,
  doneLeft,
  doneTime,
  processTime,
}: {
  type: string;
  equipment: string;
  queue: string;
  color: string;
  textColor: string;
  barLeft: string;
  barWidth: string;
  doneLeft: string;
  doneTime: string;
  processTime: string;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-5">
      <div>
        <p className="text-sm font-bold text-gray-500">{type}</p>
        <p className="mt-1 text-2xl font-black text-gray-950">{equipment}</p>
        <p className="mt-1 text-sm font-bold text-gray-500">{queue}</p>
      </div>

      <div className="relative h-16">
        <div className="absolute left-0 top-0 h-full w-[2px] bg-gray-400" />

        <div
          className={`absolute ${barLeft} top-5 flex h-8 ${barWidth} items-center ${color} px-3`}
        >
          <span className="text-xs font-black text-white">{processTime}</span>
        </div>

        <div className={`absolute ${doneLeft} top-5 text-xs font-black ${textColor}`}>
          {doneTime}
        </div>
      </div>
    </div>
  );
}

function EffectCard({
  title,
  value,
  sub,
  green,
}: {
  title: string;
  value: string;
  sub: string;
  green?: boolean;
}) {
  return (
    <div
      className={`border px-3 py-3 ${
        green ? 'border-[#2F6B4F]' : 'border-gray-400'
      }`}
    >
      <p className="text-xs font-bold text-gray-500">{title}</p>

      <p
        className={`mt-2 text-2xl font-black ${
          green ? 'text-[#2F6B4F]' : 'text-gray-950'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-gray-500">{sub}</p>
    </div>
  );
}

function ReportBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-base font-black text-gray-950">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}