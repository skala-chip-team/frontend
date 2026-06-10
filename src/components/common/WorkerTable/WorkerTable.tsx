import type { Worker, WorkerRole, WorkerStatus } from '@/types';

import { Chip, type ChipColor } from '../Chip';

function roleChipColor(role: WorkerRole): ChipColor {
  if (role === '운영자') return 'primary';
  if (role === '작업자') return 'emerald';
  return 'gray';
}

function statusChipColor(status: WorkerStatus): ChipColor {
  return status === '근무중' ? 'emerald' : 'gray';
}

interface WorkerTableProps {
  workers: Worker[];
  selectedId?: string | null;
  onSelect: (worker: Worker) => void;
}

/** 작업자 테이블 — 아이디 / 유저 이름 / 역할 / 권한 구역 / 현재 상태 / 마지막 로그인. 행은 스태거 등장 애니메이션. */
export function WorkerTable({ workers, selectedId, onSelect }: WorkerTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <table className="w-full text-left text-label-2">
        <thead className="border-b border-gray-200 bg-surface-100/70 text-label-3 text-gray-500">
          <tr>
            <th className="px-5 py-3 font-semibold">아이디</th>
            <th className="px-5 py-3 font-semibold">유저 이름</th>
            <th className="px-5 py-3 font-semibold">역할</th>
            <th className="px-5 py-3 font-semibold">권한 구역</th>
            <th className="px-5 py-3 font-semibold">현재 상태</th>
            <th className="px-5 py-3 font-semibold">마지막 로그인</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((worker, index) => (
            <tr
              key={worker.user_id}
              onClick={() => onSelect(worker)}
              style={{
                animationName: 'rowFadeUp',
                animationDuration: '0.4s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'both',
                animationDelay: `${index * 0.05}s`,
              }}
              className={`cursor-pointer border-b border-gray-100 transition last:border-none hover:bg-surface-100/70 ${
                selectedId === worker.user_id ? 'bg-primary-50/50' : ''
              }`}
            >
              <td className="px-5 py-3 font-medium text-gray-500">{worker.user_id}</td>
              <td className="px-5 py-3 font-semibold text-secondary-navy">{worker.username}</td>
              <td className="px-5 py-3">
                <Chip variant="soft" color={roleChipColor(worker.role)} size="sm">
                  {worker.role}
                </Chip>
              </td>
              <td className="px-5 py-3">
                {worker.districts.length > 0 ? (
                  <span className="text-label-1 font-bold tracking-wide text-secondary-navy">
                    구역 {worker.districts.join(' · ')}
                  </span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="px-5 py-3">
                <Chip variant="soft" color={statusChipColor(worker.status)} size="sm">
                  {worker.status}
                </Chip>
              </td>
              <td className="px-5 py-3 text-label-2 text-gray-500">{worker.last_login}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
