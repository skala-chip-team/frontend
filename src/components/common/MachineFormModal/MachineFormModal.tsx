import { useState } from 'react';

import { DISTRICT_OPTIONS } from '@/stores';
import type {
  MachineConfig,
  MachineConfigInput,
  MachineConfigStatus,
  MachineType,
  StepOption,
} from '@/types';

import { Modal } from '../Modal';

const TYPE_OPTIONS: MachineType[] = ['TYPE_A', 'TYPE_B', 'TYPE_C', 'TYPE_D'];
const STATUS_OPTIONS: MachineConfigStatus[] = ['가동', '대기', '정지', '점검중'];
// 'all' 제외한 실제 구역만
const DISTRICTS = DISTRICT_OPTIONS.filter((d) => d.value !== 'all');

interface MachineFormModalProps {
  open: boolean;
  /** 수정 대상(없으면 추가 모드) */
  machine?: MachineConfig | null;
  steps: StepOption[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: MachineConfigInput) => void;
}

/** 공용 라벨 셀렉트 */
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-2 font-semibold text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-label-1 text-secondary-navy outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
      >
        {children}
      </select>
    </label>
  );
}

/** 모달 본문 — open 시 새로 마운트되므로 useState 초기값으로 폼이 세팅된다(effect 불필요). */
function MachineForm({
  machine,
  steps,
  saving,
  onClose,
  onSubmit,
}: Omit<MachineFormModalProps, 'open'>) {
  const isEdit = !!machine;
  const defaultDistrict = DISTRICTS[0]?.value ?? '';
  const firstStepOf = (district: string) =>
    steps.find((s) => s.district_id === district)?.step_id ?? '';

  const [type, setType] = useState<MachineType>(machine?.machine_type ?? 'TYPE_A');
  const [district, setDistrict] = useState<string>(machine?.district_id ?? defaultDistrict);
  const [stepId, setStepId] = useState<string>(machine?.step_id ?? firstStepOf(defaultDistrict));
  const [status, setStatus] = useState<MachineConfigStatus>(machine?.machine_status ?? '가동');

  const districtSteps = steps.filter((s) => s.district_id === district);

  // 구역 변경 시 STEP을 그 구역의 첫 STEP으로 보정 (effect 없이 핸들러에서 처리)
  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setStepId(firstStepOf(d));
  };

  const valid = type && district && stepId && status;
  const handleSubmit = () => {
    if (!valid || saving) return;
    onSubmit({ machine_type: type, district_id: district, step_id: stepId, machine_status: status });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 장비 ID — 추가 시 자동 생성, 수정 시 식별자(읽기 전용) */}
      <div className="rounded-xl bg-surface-100 px-4 py-3">
        <span className="text-label-3 text-gray-400">장비 ID</span>
        <p className="text-body-1 font-bold text-secondary-navy">
          {isEdit ? machine!.machine_id : '저장 시 자동 생성 (MACHINE-NN)'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="장비 타입" value={type} onChange={(v) => setType(v as MachineType)}>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Select label="상태" value={status} onChange={(v) => setStatus(v as MachineConfigStatus)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Select label="구역" value={district} onChange={handleDistrictChange}>
          {DISTRICTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>

        <Select label="담당 STEP" value={stepId} onChange={setStepId}>
          {districtSteps.length === 0 ? (
            <option value="">STEP 없음</option>
          ) : (
            districtSteps.map((s) => (
              <option key={s.step_id} value={s.step_id}>
                {s.process_step.replace('STEP_', 'STEP ')}
              </option>
            ))
          )}
        </Select>
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-label-1 font-semibold text-secondary-navy transition hover:bg-surface-100"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!valid || saving}
          className="rounded-lg bg-primary-500 px-4 py-2.5 text-label-1 font-semibold text-white shadow-[0_8px_20px_rgba(234,0,44,0.18)] transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? '저장 중…' : isEdit ? '저장' : '추가'}
        </button>
      </div>
    </div>
  );
}

export function MachineFormModal({ open, ...rest }: MachineFormModalProps) {
  return (
    <Modal open={open} onClose={rest.onClose} title={rest.machine ? '장비 수정' : '장비 추가'}>
      <MachineForm {...rest} />
    </Modal>
  );
}
