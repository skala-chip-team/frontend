import { useState } from 'react';

import { ChevronRight } from 'lucide-react';

import { WorkerDetailPanel, WorkerTable, type WorkerUpdate } from '@components/common';
import { workers } from '@/mocks';
import { useDistrictStore } from '@/stores';
import type { Worker, WorkerDistrict, WorkerRole } from '@/types';

const DISTRICTS: WorkerDistrict[] = ['A', 'B', 'C'];
const ROLE_FILTERS: Array<{ key: WorkerRole | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: '운영자', label: '운영자' },
  { key: '작업자', label: '작업자' },
  { key: '미배치', label: '미배치' },
];

export default function WorkerPage() {
  const selectedDistrict = useDistrictStore((state) => state.selectedDistrict);
  const isAll = selectedDistrict === 'all';

  const [workerList, setWorkerList] = useState<Worker[]>(workers);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [roleFilter, setRoleFilter] = useState<WorkerRole | 'all'>('all');

  const visibleWorkers = workerList
    .filter((worker) => isAll || worker.districts.includes(selectedDistrict as WorkerDistrict))
    .filter((worker) => roleFilter === 'all' || worker.role === roleFilter);

  // 전체 선택 시 구역별 운영자/작업자 요약
  const districtSummary = DISTRICTS.map((district) => ({
    district,
    operators: workerList
      .filter((worker) => worker.role === '운영자' && worker.districts.includes(district))
      .map((worker) => worker.username),
    workerCount: workerList.filter(
      (worker) => worker.role === '작업자' && worker.districts.includes(district)
    ).length,
  }));

  const handleSave = ({ user_id, role, districts }: WorkerUpdate) => {
    setWorkerList((prev) =>
      prev.map((worker) => (worker.user_id === user_id ? { ...worker, role, districts } : worker))
    );
    setSelectedWorker((prev) => (prev ? { ...prev, role, districts } : prev));
  };

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="flex w-full flex-col gap-4">
        {/* 위치 브레드크럼 — 큰 글씨 */}
        <div className="flex items-center gap-2 text-heading-2">
          <span className={isAll ? 'text-secondary-navy' : 'text-gray-400'}>작업자 관리</span>
          {!isAll ? (
            <>
              <ChevronRight className="h-6 w-6 text-gray-300" aria-hidden />
              <span className="text-secondary-navy">{`구역${selectedDistrict}`}</span>
            </>
          ) : null}
        </div>

        {/* 전체 선택 시: 구역별 운영자/작업자 요약 카드 */}
        {isAll ? (
          <div className="flex flex-wrap gap-3">
            {districtSummary.map((summary) => (
              <div
                key={summary.district}
                className="min-w-[220px] flex-1 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <p className="text-label-1 font-bold text-secondary-navy">{`구역${summary.district}`}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-label-2 text-gray-400">운영자</span>
                    <span className="text-right text-label-2 font-semibold text-secondary-navy">
                      {summary.operators.length > 0 ? summary.operators.join(', ') : '미배정'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-2 text-gray-400">작업자</span>
                    <span className="text-label-2 font-semibold text-secondary-navy">
                      {summary.workerCount}명
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 역할 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          {ROLE_FILTERS.map((filter) => {
            const active = roleFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setRoleFilter(filter.key)}
                className={`rounded-lg border px-3.5 py-1.5 text-label-2 font-semibold transition ${
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-secondary-navy'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <WorkerTable
          key={`${selectedDistrict}-${roleFilter}`}
          workers={visibleWorkers}
          selectedId={selectedWorker?.user_id ?? null}
          onSelect={setSelectedWorker}
        />
      </div>

      <WorkerDetailPanel
        worker={selectedWorker}
        open={selectedWorker !== null}
        onClose={() => setSelectedWorker(null)}
        onSave={handleSave}
      />
    </section>
  );
}
