import { useNavigate } from 'react-router-dom';

const PROPOSALS = [
  {
    id: 'RSC-001',
    level: 'HIGH',
    title: 'SCN-C-03 과부하 누적',
    lot: 'LOT-2451',
    delay: '2.3시간',
    effect: '1시간 43분 단축',
    status: '승인 대기',
  },
  {
    id: 'RSC-002',
    level: 'MEDIUM',
    title: 'ETCH-02 Queue 증가',
    lot: 'LOT-2472',
    delay: '1.1시간',
    effect: '48분 단축',
    status: '승인 대기',
  },
  {
    id: 'RSC-003',
    level: 'LOW',
    title: 'PHOTO-01 부하 증가',
    lot: 'LOT-2483',
    delay: '32분',
    effect: '18분 단축',
    status: '검토 완료',
  },
];

export default function ProposalListSection() {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      {PROPOSALS.map((proposal) => (
        <div
          key={proposal.id}
          className="
            rounded-2xl border border-gray-200
            bg-white p-5 shadow-sm
            transition-all duration-200
            hover:border-gray-300 hover:shadow-md
          "
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LevelBadge level={proposal.level} />

                <span className="text-xs font-semibold text-gray-500">
                  {proposal.status}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-black text-gray-950">
                {proposal.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/reschedule/${proposal.id}`)}
              className="
                rounded-xl border border-gray-200
                px-4 py-2
                text-sm font-bold text-gray-700
                transition-colors
                hover:bg-gray-50
              "
            >
              상세보기
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <InfoCard label="대상 LOT" value={proposal.lot} />
            <InfoCard label="예상 지연" value={proposal.delay} />
            <InfoCard label="예상 효과" value={proposal.effect} />
          </div>
        </div>
      ))}
    </section>
  );
}

function LevelBadge({ level }: { level: string }) {
  const styles = {
    HIGH: 'bg-[#EA002C] text-white',
    MEDIUM: 'bg-[#FFF1E6] text-[#FF9A3D]',
    LOW: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-black ${
        styles[level as keyof typeof styles]
      }`}
    >
      {level}
    </span>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-gray-950">
        {value}
      </p>
    </div>
  );
}