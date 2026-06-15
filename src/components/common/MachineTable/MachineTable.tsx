import { Trash2 } from 'lucide-react';

import { districtLabels, type DistrictId } from '@/stores';
import type { MachineConfig, MachineConfigStatus } from '@/types';

import { Chip, type ChipColor } from '../Chip';

function statusChipColor(status: MachineConfigStatus): ChipColor {
  switch (status) {
    case '가동':
      return 'emerald';
    case '점검중':
      return 'amber';
    case '정지':
      return 'red';
    default:
      return 'gray'; // 대기
  }
}

function districtLabel(id: string): string {
  return districtLabels[id as DistrictId] ?? id;
}

/** STEP_A → 'STEP A' */
function stepLabel(processStep: string): string {
  return processStep.replace('STEP_', 'STEP ');
}

interface MachineTableProps {
  machines: MachineConfig[];
  onDelete: (machine: MachineConfig) => void;
}

/** 장비 설정 테이블 — ID / 타입 / 구역 / STEP / 상태 + 삭제 액션 */
export function MachineTable({ machines, onDelete }: MachineTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <table className="w-full text-left text-label-2">
        <thead className="border-b border-gray-200 bg-surface-100/70 text-label-3 text-gray-500">
          <tr>
            <th className="px-5 py-3 font-semibold">장비 ID</th>
            <th className="px-5 py-3 font-semibold">타입</th>
            <th className="px-5 py-3 font-semibold">구역</th>
            <th className="px-5 py-3 font-semibold">담당 STEP</th>
            <th className="px-5 py-3 font-semibold">상태</th>
            <th className="px-5 py-3 text-right font-semibold">관리</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine, index) => (
            <tr
              key={machine.machine_id}
              style={{
                animationName: 'rowFadeUp',
                animationDuration: '0.4s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'both',
                animationDelay: `${index * 0.04}s`,
              }}
              className="border-b border-gray-100 transition last:border-none hover:bg-surface-100/70"
            >
              <td className="px-5 py-3 font-semibold text-secondary-navy">{machine.machine_id}</td>
              <td className="px-5 py-3">
                <Chip variant="outline" size="sm">
                  {machine.machine_type}
                </Chip>
              </td>
              <td className="px-5 py-3 font-medium text-gray-500">
                {districtLabel(machine.district_id)}
              </td>
              <td className="px-5 py-3 font-semibold tracking-wide text-secondary-navy">
                {stepLabel(machine.process_step)}
              </td>
              <td className="px-5 py-3">
                <Chip variant="soft" color={statusChipColor(machine.machine_status)} size="sm">
                  {machine.machine_status}
                </Chip>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onDelete(machine)}
                    aria-label={`${machine.machine_id} 삭제`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
