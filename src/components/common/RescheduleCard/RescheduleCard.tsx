import { ChevronRight } from 'lucide-react';

import { formatDelayHours, riskChipColor, statusChipColor, statusLabel } from '@/utils';
import type { AffectedUnit, GroupStatus, RiskLevel } from '@/types';

import { Chip } from '../Chip';

export interface RescheduleCardData {
  group_id: string;
  districtLabel: string; // ex. '구역A'
  process_step: string; // ex. 'Step 4'
  max_risk_score: number;
  risk_level: RiskLevel;
  risk_factor: string; // ex. '납기 위험'
  affected_units: AffectedUnit[];
  group_status: GroupStatus;
}

const VISIBLE_UNITS = 3;

interface RescheduleCardProps {
  data: RescheduleCardData;
  /** 우측 상단 화살표/카드 클릭 시 상세로 이동 */
  onOpenDetail?: () => void;
}

/** 재조정안 리스트 항목. 대시보드 카드의 border/shadow 톤을 따른다. */
export function RescheduleCard({ data, onOpenDetail }: RescheduleCardProps) {
  const visibleUnits = data.affected_units.slice(0, VISIBLE_UNITS);
  const restUnits = data.affected_units.length - visibleUnits.length;

  return (
    <article
      onClick={onOpenDetail}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-gray-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
    >
      {/* 상단: (좌) 구역·step 칩 / (우) 상세 이동 화살표 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Chip variant="outline" size="sm">
            {data.districtLabel}
          </Chip>
          <Chip variant="outline" size="sm">
            {data.process_step}
          </Chip>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500" />
      </div>

      {/* Risk Level + 그룹 ID·위험 원인 / 상태 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Chip variant="solid" color={riskChipColor(data.risk_level)} size="lg" className="font-bold">
            {data.risk_level.toUpperCase()}
          </Chip>
          <div className="text-subtitle-1 font-bold text-secondary-navy">
            {data.group_id} {data.risk_factor}
          </div>
        </div>

        <Chip variant="soft" color={statusChipColor(data.group_status)} size="xl">
          {statusLabel(data.group_status)}
        </Chip>
      </div>

      {/* 영향 UNIT + 지연 예측 시간 */}
      <div className="rounded-xl border border-gray-100 bg-surface-100/70 p-3">
        <div className="flex items-center justify-between text-label-2">
          <span className="font-semibold text-gray-500">영향 UNIT</span>
          <span className="text-gray-400">{data.affected_units.length}개</span>
        </div>

        <ul className="mt-1 flex flex-col gap-1.5">
          {visibleUnits.map((unit) => (
            <li
              key={unit.unit_id}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-label-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              <span className="font-semibold text-secondary-navy">{unit.unit_id}</span>
              <span className="text-gray-500">
                지연{' '}
                <span className="font-semibold text-primary-600">
                  +{formatDelayHours(unit.estimated_delay_hr)}
                </span>
              </span>
            </li>
          ))}
          {restUnits > 0 ? (
            <li className="pt-0.5 text-center text-label-3 font-medium text-gray-400">
              외 {restUnits}개
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  );
}
