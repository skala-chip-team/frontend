import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChevronRight } from 'lucide-react';

import { Pagination, RescheduleCard } from '@components/common';
import { districtLabels, useDistrictStore } from '@/stores';
import { useRescheduleGroups } from '@/hooks';
import { districtLabelOf, toRiskLevel } from '@/utils';
import type { GroupStatus } from '@/types';

const PAGE_SIZE = 5;

export default function ReschedulePage() {
  const navigate = useNavigate();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  const [page, setPage] = useState(1);
  const [prevDistrict, setPrevDistrict] = useState(selectedDistrict);

  // 구역 전환 시 첫 페이지로 (effect 대신 렌더 중 상태 조정)
  if (prevDistrict !== selectedDistrict) {
    setPrevDistrict(selectedDistrict);
    setPage(1);
  }

  const { data: groups, isLoading, isError } = useRescheduleGroups(selectedDistrict);

  const cards = useMemo(
    () =>
      (groups ?? []).map((g) => ({
        group_id: g.groupId,
        districtLabel: districtLabelOf(g.districtId),
        process_step: g.processStep,
        max_risk_score: Math.round(g.maxRiskScore * 100),
        risk_level: toRiskLevel(g.riskLevel, g.maxRiskScore),
        risk_factor: '',
        group_status: g.groupStatus as GroupStatus,
        affected_units: g.affectedUnits.map((u) => ({
          unit_id: u.unitId,
          estimated_delay_hr: u.estimatedDelayHr,
          risk_score: 0,
          delay_probability: 0,
        })),
      })),
    [groups]
  );

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = cards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const renderBody = () => {
    if (isLoading) return <Message>재조정안을 불러오는 중…</Message>;
    if (isError) return <Message>재조정안을 불러오지 못했습니다.</Message>;
    if (cards.length === 0) return <Message>재조정안이 없습니다.</Message>;
    return (
      <>
        <div className="flex flex-col gap-3">
          {pageItems.map((card) => (
            <RescheduleCard
              key={card.group_id}
              onOpenDetail={() => navigate(`/reschedule/${card.group_id}`)}
              data={card}
            />
          ))}
        </div>
        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} className="mt-2" />
      </>
    );
  };

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 — 큰 글씨 */}
        <div className="flex items-center gap-2 text-heading-2">
          <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>재조정안 관리</span>
          {!isAll ? (
            <>
              <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
              <span className="text-secondary-navy">{districtLabels[selectedDistrict]}</span>
            </>
          ) : null}
        </div>

        {renderBody()}
      </div>
    </section>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
      {children}
    </div>
  );
}
