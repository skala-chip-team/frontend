import { useState } from 'react';

import { ChevronRight } from 'lucide-react';

import {
  formatDelayHours,
  formatRelativeTime,
  processStepLabel,
  riskChipColor,
  riskLevelLabel,
  statusChipColor,
  statusLabel,
} from '@/utils';
import type { AffectedUnit, GroupStatus, RiskLevel } from '@/types';

import { Chip } from '../Chip';

export interface RescheduleCardData {
  group_id: string;
  districtLabel: string; // ex. '구역A'
  process_step: string; // ex. 'Step 4'
  max_risk_score: number;
  risk_level: RiskLevel;
  risk_factor: string; // ex. '납기 위험' — 제목으로 사용
  affected_units: AffectedUnit[];
  group_status: GroupStatus;
  created_at?: string; // 탐지 시각(ISO) — 상대시간 표시용
}

interface RescheduleCardProps {
  data: RescheduleCardData;
  /** 우측 상단 화살표/카드 클릭 시 상세로 이동 */
  onOpenDetail?: () => void;
}

/** 재조정안 리스트 항목. 대시보드 카드의 border/shadow 톤을 따른다. */
export function RescheduleCard({ data, onOpenDetail }: RescheduleCardProps) {
  const [unitsOpen, setUnitsOpen] = useState(false);

  return (
    <article
      onClick={onOpenDetail}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-gray-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
    >
      {/* 헤더: 위험레벨 + 구역·공정(제목) / 상태 + 화살표 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Chip variant="solid" color={riskChipColor(data.risk_level)} size="lg" className="font-bold">
            {riskLevelLabel(data.risk_level)}
          </Chip>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-subtitle-1 font-bold text-secondary-navy">
                {data.districtLabel} · {processStepLabel(data.process_step)}
              </span>
              <Chip
                variant="subtle"
                color={riskChipColor(data.risk_level)}
                size="xs"
                className="font-bold tabular-nums"
              >
                위험 {data.max_risk_score}
              </Chip>
              <Chip variant="subtle" color="gray" size="xs" className="tabular-nums">
                영향 {data.affected_units.length}유닛
              </Chip>
            </div>
            <span className="text-label-3 text-gray-400">
              {data.risk_factor || '지연 위험'}
              {data.created_at ? ` · ${formatRelativeTime(data.created_at)} 탐지` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Chip variant="subtle" color={statusChipColor(data.group_status)} size="xl">
            {statusLabel(data.group_status)}
          </Chip>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500" />
        </div>
      </div>

      {/* 영향 UNIT — 기본은 개수만, 클릭 시 펼쳐서 표시 */}
      <div className="rounded-xl border border-gray-100 bg-surface-100/70">
        <button
          type="button"
          aria-expanded={unitsOpen}
          onClick={(event) => {
            event.stopPropagation();
            setUnitsOpen((prev) => !prev);
          }}
          className="flex w-full items-center justify-between px-3 py-2 text-label-2"
        >
          <span className="font-semibold text-gray-500">
            영향 UNIT <span className="text-gray-400">{data.affected_units.length}개</span>
          </span>
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform ${unitsOpen ? 'rotate-90' : ''}`}
          />
        </button>

        {/* grid-rows 0fr→1fr 로 높이 부드럽게 펼침 */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            unitsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-col gap-1.5 px-3 pb-3">
              {data.affected_units.map((unit) => (
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
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
