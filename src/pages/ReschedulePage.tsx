import RescheduleSummarySection from '@/components/reschedule/RescheduleSummarySection';
import ProposalListSection from '@/components/reschedule/ProposalListSection';

export default function ReschedulePage() {
  return (
    <div className="min-h-screen bg-[#fcfaf6] p-6">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-gray-950">
            재조정 제안 관리
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            현재 공정 상태를 분석해 생성된 자동 재조정안을 확인하고 승인합니다.
          </p>
        </header>

        <RescheduleSummarySection />
        <ProposalListSection />
      </div>
    </div>
  );
}