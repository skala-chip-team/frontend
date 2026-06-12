import { useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Chip, Modal, PentagonRadar } from '@components/common';
import { rescheduleGroups, riskReasonsByFactor } from '@/mocks';
import { pentagonData } from '@/mocks/reschedulePentagon';
import { districtLabels, useDistrictStore } from '@/stores';
import { formatDelayHours, riskChipColor, statusChipColor, statusLabel } from '@/utils';

export default function RescheduleDetailPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);

  // 퍼블리싱 단계: 목록은 실제 API라 실제 group_id로 진입한다. mock에서 못 찾으면
  // 첫 번째 샘플 그룹으로 폴백해 항상 화면이 렌더되게 한다. (API 재연결 시 이 줄만 교체)
  const group =
    rescheduleGroups.find((item) => item.group_id === groupId) ?? rescheduleGroups[0] ?? null;

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const reasons = group ? (riskReasonsByFactor[group.risk_factor] ?? []) : [];

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 뒤로 + 브레드크럼 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/reschedule')}
            aria-label="목록으로"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-secondary-navy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-heading-2">
            <button
              type="button"
              onClick={() => navigate('/reschedule')}
              className="text-gray-400 transition hover:text-gray-600"
            >
              재조정안 관리
            </button>
            {selectedDistrict !== 'all' ? (
              <>
                <span className="text-gray-300">›</span>
                <span className="text-gray-400">{districtLabels[selectedDistrict]}</span>
              </>
            ) : null}
            <span className="text-gray-300">›</span>
            <span className="text-secondary-navy">{groupId}</span>
          </div>
        </div>

        {group === null ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
            해당 재조정안을 찾을 수 없습니다.
          </div>
        ) : (
          <>
            {/* 상단: 위험 내용 / 원인 설명 / 영향 UNIT */}
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* 위험 내용 */}
              <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Chip variant="outline" size="sm">{`구역${group.district_id}`}</Chip>
                    <Chip variant="outline" size="sm">
                      {group.process_step}
                    </Chip>
                  </div>
                  <Chip variant="subtle" color={statusChipColor(group.group_status)} size="md">
                    {statusLabel(group.group_status)}
                  </Chip>
                </div>

                <div className="flex items-center gap-2.5">
                  <Chip
                    variant="solid"
                    color={riskChipColor(group.risk_level)}
                    size="md"
                    className="font-bold"
                  >
                    {group.risk_level.toUpperCase()}
                  </Chip>
                  <div className="text-subtitle-2 font-bold text-secondary-navy">
                    {group.group_id} {group.risk_factor}
                  </div>
                </div>
              </div>

              {/* 원인 설명 */}
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {reasons.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {reasons.map((reason) => (
                      <li key={reason} className="flex gap-1.5 text-label-3 leading-snug text-gray-600">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-label-3 text-gray-400">원인 정보가 없습니다.</p>
                )}
              </div>

              {/* 영향 UNIT */}
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:w-[200px] lg:shrink-0">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-label-1 font-bold text-secondary-navy">영향 UNIT</h3>
                  <span>
                    <span className="text-[1.5rem] font-bold leading-none text-secondary-navy">
                      {group.affected_units.length}
                    </span>
                    <span className="ml-0.5 text-label-3 text-gray-400">개</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(true)}
                  className="mt-auto rounded-lg border border-gray-200 px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
                >
                  자세히 보기
                </button>
              </div>
            </div>

            {/* 재조정안 비교 — 3D 시상대 기둥 */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:p-6">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-subtitle-1 font-bold text-secondary-navy">재조정안 비교</h2>
                <p className="text-label-3 text-gray-400">바깥으로 클수록 좋은 안입니다</p>
              </div>
              <PentagonRadar data={pentagonData} />
            </div>
          </>
        )}
      </div>

      {/* 영향 UNIT 상세 모달 */}
      {group ? (
        <Modal
          open={unitModalOpen}
          onClose={() => setUnitModalOpen(false)}
          title={`영향 UNIT (${group.affected_units.length}개)`}
        >
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-label-2">
              <thead className="bg-surface-100 text-label-3 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">UNIT</th>
                  <th className="px-3 py-2 text-right font-semibold">위험점수</th>
                  <th className="px-3 py-2 text-right font-semibold">지연확률</th>
                  <th className="px-3 py-2 text-right font-semibold">지연 예측</th>
                </tr>
              </thead>
              <tbody>
                {group.affected_units.map((unit) => (
                  <tr key={unit.unit_id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-semibold text-secondary-navy">{unit.unit_id}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{unit.risk_score}</td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {Math.round(unit.delay_probability * 100)}%
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-primary-600">
                      +{formatDelayHours(unit.estimated_delay_hr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
