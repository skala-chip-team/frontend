import { useMemo, useState, type ReactNode } from 'react';

import { Plus } from 'lucide-react';

import { ConfirmModal, MachineFormModal, MachineTable } from '@components/common';
import { useMachineActions, useMachines, useProcessSteps } from '@/hooks';
import type { MachineConfig, MachineConfigInput } from '@/types';

const DISTRICT_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'DST-01', label: '구역 A' },
  { key: 'DST-02', label: '구역 B' },
];
const STEP_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'STEP_A', label: 'STEP A' },
  { key: 'STEP_B', label: 'STEP B' },
  { key: 'STEP_C', label: 'STEP C' },
  { key: 'STEP_D', label: 'STEP D' },
];

export default function MachinePage() {
  const { data: machines, isLoading, isError } = useMachines();
  const { data: steps } = useProcessSteps();
  const { create, update, remove } = useMachineActions();

  const [districtFilter, setDistrictFilter] = useState('all');
  const [stepFilter, setStepFilter] = useState('all');

  // 추가/수정 모달: editing=null & open → 추가, editing=machine → 수정
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MachineConfig | null>(null);
  const [deleting, setDeleting] = useState<MachineConfig | null>(null);

  const visible = useMemo(
    () =>
      (machines ?? [])
        .filter((m) => districtFilter === 'all' || m.district_id === districtFilter)
        .filter((m) => stepFilter === 'all' || m.process_step === stepFilter),
    [machines, districtFilter, stepFilter]
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (machine: MachineConfig) => {
    setEditing(machine);
    setFormOpen(true);
  };

  const saving = create.isPending || update.isPending;

  const handleSubmit = (input: MachineConfigInput) => {
    if (editing) {
      update.mutate(
        { machineId: editing.machine_id, input },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      create.mutate(input, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.machine_id, { onSuccess: () => setDeleting(null) });
  };

  const renderBody = () => {
    if (isLoading) return <Message>장비 목록을 불러오는 중…</Message>;
    if (isError) return <Message>장비 목록을 불러오지 못했습니다.</Message>;
    return (
      <>
        {/* 필터 + 총 대수 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <FilterGroup
              label="구역"
              options={DISTRICT_FILTERS}
              value={districtFilter}
              onChange={setDistrictFilter}
            />
            <FilterGroup
              label="STEP"
              options={STEP_FILTERS}
              value={stepFilter}
              onChange={setStepFilter}
            />
          </div>
          <span className="text-label-2 font-semibold text-gray-400">총 {visible.length}대</span>
        </div>

        {visible.length === 0 ? (
          <Message>해당 조건의 장비가 없습니다.</Message>
        ) : (
          <MachineTable machines={visible} onEdit={openEdit} onDelete={setDeleting} />
        )}
      </>
    );
  };

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-heading-2 text-secondary-navy">장비 설정</h1>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            장비 추가
          </button>
        </div>

        {renderBody()}
      </div>

      <MachineFormModal
        open={formOpen}
        machine={editing}
        steps={steps ?? []}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={deleting !== null}
        title={`${deleting?.machine_id ?? ''} 장비를 삭제할까요?`}
        description="삭제하면 해당 장비와 공정 매핑이 제거됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-label-3 font-semibold text-gray-400">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`rounded-lg border px-3 py-1.5 text-label-2 font-semibold transition ${
                active
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-body-2 text-gray-400">
      {children}
    </div>
  );
}
