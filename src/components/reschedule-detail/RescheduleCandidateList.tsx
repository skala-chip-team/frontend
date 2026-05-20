const CANDIDATES = [
  {
    id: 'A',
    title: '후보 A',
    badge: '납기 우선',
    description:
      '위험한 UNIT-2451을 가용 장비 SCN-C-07로 이전하여 납기 여유를 확보합니다.',
    effect: '납기여유 +1.8h 확보',
    subEffect: '최대 가동률 -12%p 감소',
    selected: true,
  },
  {
    id: 'B',
    title: '후보 B',
    badge: '병목 최소화',
    description:
      'SCN-C-03 큐 4건을 가용 장비 3대로 분산하여 부하를 균등화합니다.',
    effect: '납기여유 +1.2h 확보',
    subEffect: '최대 가동률 -24%p 감소',
  },
];

export default function RescheduleCandidateList() {
  return (
    <section className="border-r border-gray-300 px-4 py-5">
      <h2 className="text-2xl font-black text-gray-950">
        스케줄링 재조정 후보안
      </h2>

      <div className="mt-5 space-y-4">
        {CANDIDATES.map((candidate) => (
          <div
            key={candidate.id}
            className={`
              border p-5
              ${
                candidate.selected
                  ? 'border-[#1E3A8A] border-[3px]'
                  : 'border-gray-400'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-3xl font-black text-gray-950">
                {candidate.title}
              </h3>

              <span
                className={`
                  px-3 py-1 text-sm font-black text-white
                  ${
                    candidate.id === 'A'
                      ? 'bg-[#1E3A8A]'
                      : 'bg-[#2F6B4F]'
                  }
                `}
              >
                {candidate.badge}
              </span>
            </div>

            <p className="mt-6 text-lg font-bold leading-8 text-gray-950">
              {candidate.description}
            </p>

            <div className="mt-16">
              <p
                className={`
                  text-2xl font-black
                  ${
                    candidate.id === 'A'
                      ? 'text-[#1E3A8A]'
                      : 'text-[#2F6B4F]'
                  }
                `}
              >
                {candidate.effect}
              </p>

              <p className="mt-2 text-xl font-bold text-gray-950">
                {candidate.subEffect}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}