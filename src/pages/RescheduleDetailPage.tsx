import RescheduleDetailHeader from '@/components/reschedule-detail/RescheduleDetailHeader';
import CurrentStatusSummary from '@/components/reschedule-detail/CurrentStatusSummary';
import RescheduleCandidateList from '@/components/reschedule-detail/RescheduleCandidateList';
import SelectedCandidateDetail from '@/components/reschedule-detail/SelectedCandidateDetail';

export default function RescheduleDetailPage() {
  return (
    <div className="min-h-screen bg-[#fcfaf6] p-6">
      <div className="overflow-hidden border border-gray-300 bg-white">
        <RescheduleDetailHeader proposalId="RSC-001" />

        <CurrentStatusSummary />

        <div className="grid grid-cols-[360px_1fr]">
          <RescheduleCandidateList />

          <div className="border-l border-gray-300">
            <SelectedCandidateDetail />
          </div>
        </div>
      </div>
    </div>
  );
}