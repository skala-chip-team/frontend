import { useState } from 'react';

import { X } from 'lucide-react';

import { ASSIGNABLE_ROLES, districtShort, WORKER_DISTRICT_IDS } from '@/utils';
import type { Worker, WorkerRole } from '@/types';

import { Chip, type ChipColor } from '../Chip';
import { ConfirmModal } from '../ConfirmModal';

function roleChipColor(role: WorkerRole): ChipColor {
  if (role === '운영자') return 'primary';
  if (role === '작업자') return 'emerald';
  return 'gray'; // 관리자
}

export interface WorkerUpdate {
  user_id: string;
  role: WorkerRole;
  districts: string[];
}

interface WorkerDetailPanelProps {
  worker: Worker | null;
  open: boolean;
  onClose: () => void;
  onSave: (update: WorkerUpdate) => void;
  saving?: boolean;
}

/** 작업자 클릭 시 우측에서 슬라이드되는 상세 패널 */
export function WorkerDetailPanel({ worker, open, onClose, onSave, saving }: WorkerDetailPanelProps) {
  return (
    <div
      className={`fixed bottom-0 right-0 top-16 z-40 flex w-[360px] max-w-[85%] flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      {worker ? (
        <WorkerDetailBody
          key={worker.user_id}
          worker={worker}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      ) : null}
    </div>
  );
}

/** 패널 본문 — worker.user_id 로 key 를 주어 작업자 변경 시 편집 상태를 초기화한다. */
function WorkerDetailBody({
  worker,
  onClose,
  onSave,
  saving,
}: {
  worker: Worker;
  onClose: () => void;
  onSave: (update: WorkerUpdate) => void;
  saving?: boolean;
}) {
  const [role, setRole] = useState<WorkerRole>(worker.role);
  const [districts, setDistricts] = useState<string[]>(worker.districts);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleDistrict = (district: string) => {
    setDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district].sort()
    );
  };

  const isDirty =
    role !== worker.role ||
    districts.length !== worker.districts.length ||
    districts.some((d) => !worker.districts.includes(d));

  const handleConfirm = () => {
    onSave({ user_id: worker.user_id, role, districts });
    setConfirmOpen(false);
  };

  return (
    <>
      {/* 헤더 — 아이디 / 이름 / 역할 */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
        <div className="min-w-0">
          <p className="text-label-3 font-semibold uppercase tracking-[0.18em] text-gray-400">
            작업자 상세
          </p>
          <p className="mt-3 truncate text-label-2 font-medium text-gray-400">{worker.email}</p>
          <h3 className="mt-0.5 truncate text-heading-3 text-secondary-navy">{worker.username}</h3>
          <div className="mt-2">
            <Chip variant="soft" color={roleChipColor(role)} size="sm">
              {role}
            </Chip>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="패널 닫기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-secondary-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        {/* 계정 상태 */}
        <div>
          <p className="mb-2 text-label-3 font-semibold text-gray-400">계정 상태</p>
          <Chip variant="soft" color={worker.active ? 'emerald' : 'gray'} size="sm">
            {worker.active ? '활성' : '비활성'}
          </Chip>
        </div>

        {/* 역할 변경 */}
        <div>
          <p className="mb-2 text-label-3 font-semibold text-gray-400">역할 변경</p>
          <div className="flex flex-wrap gap-2">
            {ASSIGNABLE_ROLES.map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-1.5 text-label-2 font-semibold transition ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {worker.role === '관리자' ? (
            <p className="mt-2 text-label-3 text-gray-300">현재 관리자 계정입니다.</p>
          ) : null}
        </div>

        {/* 권한 구역 */}
        <div>
          <p className="mb-2 text-label-3 font-semibold text-gray-400">권한 구역</p>
          <div className="flex flex-wrap gap-2">
            {WORKER_DISTRICT_IDS.map((district) => {
              const active = districts.includes(district);
              return (
                <button
                  key={district}
                  type="button"
                  onClick={() => toggleDistrict(district)}
                  className={`rounded-lg border px-3 py-1.5 text-label-2 font-semibold transition ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
                  }`}
                >
                  {`구역 ${districtShort(district)}`}
                </button>
              );
            })}
          </div>
          {districts.length === 0 ? (
            <p className="mt-2 text-label-3 text-gray-300">선택된 권한 구역이 없습니다.</p>
          ) : null}
        </div>
      </div>

      {/* 저장 */}
      <div className="border-t border-gray-100 p-5">
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={() => setConfirmOpen(true)}
          className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="작업자의 역할 및 권한을 수정하시겠습니까?"
        description={`${worker.username}(${worker.email}) 작업자의 역할 및 권한 구역이 변경됩니다.`}
        confirmLabel="저장"
        onConfirm={handleConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
