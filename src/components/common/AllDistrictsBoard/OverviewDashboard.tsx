import { useState, type ReactNode } from 'react';

import { ArrowLeft, X } from 'lucide-react';

import { districtOverviews } from '@/mocks';
import type { DistrictOverview, OverviewMachine, OverviewMachineStatus } from '@/mocks/districtOverview';

import { Chip } from '../Chip';
import { FactoryMonitor3D } from './FactoryMonitor3D';

const STATUS_TEXT: Record<OverviewMachineStatus, string> = {
  가동중: 'text-emerald-600',
  점검중: 'text-amber-600',
  정지: 'text-gray-500',
  장애: 'text-rose-600',
};
const STATUS_DOT: Record<OverviewMachineStatus, string> = {
  가동중: 'bg-emerald-500',
  점검중: 'bg-amber-500',
  정지: 'bg-gray-400',
  장애: 'bg-rose-500',
};

type DistrictState = '정상' | '주의' | '위험';

function stateOf(d: DistrictOverview): DistrictState {
  const down = d.summary.down_machine_count;
  if (down >= 10) return '위험';
  if (down >= 5) return '주의';
  return '정상';
}

const STATE_STYLE: Record<DistrictState, { dot: string; text: string }> = {
  정상: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  주의: { dot: 'bg-amber-500', text: 'text-amber-600' },
  위험: { dot: 'bg-rose-500', text: 'text-rose-600' },
};

function riskChip(level: string): 'red' | 'orange' | 'emerald' {
  if (level === 'Critical' || level === 'High') return 'red';
  if (level === 'Medium') return 'orange';
  return 'emerald';
}

function Card({
  title,
  action,
  children,
  className = '',
  bodyClassName = 'p-4',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_8px_28px_rgba(15,23,42,0.12)] backdrop-blur-md ${className}`}
    >
      {title ? (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100/80 px-4 py-2.5">
          <h3 className="text-label-1 font-bold text-secondary-navy">{title}</h3>
          {action}
        </div>
      ) : null}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

function Kpi({ label, value, danger = false }: { label: string; value: ReactNode; danger?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-gray-400">{label}</span>
      <span className={`text-body-2 font-bold ${danger ? 'text-rose-600' : 'text-secondary-navy'}`}>{value}</span>
    </div>
  );
}

export function OverviewDashboard() {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [machine, setMachine] = useState<OverviewMachine | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);

  const sel = focusedId ? (districtOverviews.find((d) => d.district_id === focusedId) ?? null) : null;
  const lr = sel?.latest_reschedule ?? null;
  const maxQ = sel ? Math.max(...sel.queue_by_step.map((q) => q.waiting), 1) : 1;
  const st = sel ? stateOf(sel) : null;
  const machineDown = machine ? machine.machine_status === '장애' || machine.machine_status === '정지' : false;
  const isCauseMachine = !!(
    machine && lr?.propagation.some((p) => p.role === 'cause' && p.machine_id === machine.machine_id)
  );
  const impactList = isCauseMachine
    ? (lr?.propagation.filter((p) => p.role === 'impact').map((p) => p.machine_id) ?? [])
    : [];
  const revealed = !!machine && reveal === machine.machine_id;

  const focusZone = (id: string) => {
    setFocusedId(id);
    setMachine(null);
    setUnit(null);
    setReveal(null);
  };
  const exitAll = () => {
    setFocusedId(null);
    setMachine(null);
    setUnit(null);
    setReveal(null);
  };
  const selectMachine = (m: OverviewMachine) => {
    setMachine(m);
    setUnit(null);
    setReveal(null);
  };
  const closeMachine = () => {
    setMachine(null);
    setUnit(null);
    setReveal(null);
  };

  return (
    <div className="relative min-h-[760px]">
      <FactoryMonitor3D
        focusedId={focusedId}
        selectedMachineId={machine?.machine_id ?? null}
        routeUnitId={unit}
        revealCauseId={reveal}
        onZoneClick={focusZone}
        onMachineClick={selectMachine}
      />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gap-4 p-4">
        {sel && st ? (
          <>
            {/* 상단: 구역 KPI 바 */}
            <Card bodyClassName="px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  type="button"
                  onClick={exitAll}
                  className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-label-3 font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  전체
                </button>
                <div className="flex items-center gap-2 pr-2">
                  <span className="text-body-1 font-extrabold text-secondary-navy">
                    구역 {String.fromCharCode(65 + districtOverviews.findIndex((d) => d.district_id === sel.district_id))}
                  </span>
                  <span className={`ml-1 flex items-center gap-1 text-label-3 font-bold ${STATE_STYLE[st].text}`}>
                    <span className={`h-2 w-2 rounded-full ${STATE_STYLE[st].dot}`} />
                    {st}
                  </span>
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-3">
                  <Kpi label="평균 가동률" value={`${sel.summary.avg_utilization_rate}%`} />
                  <Kpi
                    label="가용 / 전체"
                    value={
                      <>
                        {sel.summary.available_machine_count}/{sel.summary.total_machine_count}
                        {sel.summary.down_machine_count > 0 ? (
                          <span className="ml-1 text-rose-600">▼{sel.summary.down_machine_count}</span>
                        ) : null}
                      </>
                    }
                  />
                  <Kpi label="대기 유닛" value={sel.summary.total_waiting_unit_count} />
                  <Kpi label="평균 대기" value={`${sel.summary.avg_wait_time_min}분`} />
                  <Kpi label="일일 생산" value={sel.summary.daily_output_qty.toLocaleString()} />
                  <Kpi label="재조정" value={`${sel.reschedule_group_count} 건`} danger={sel.reschedule_group_count >= 4} />
                </div>
              </div>
            </Card>

            {/* 하단: 장비 선택 시 → 장비 상세 / 아니면 → 구역 인사이트 */}
            {machine ? (
              <div className="flex justify-center">
                <Card
                  className="w-full max-w-xl"
                  title="장비 상세"
                  action={
                    <button
                      type="button"
                      onClick={closeMachine}
                      className="pointer-events-auto grid h-7 w-7 place-content-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                      aria-label="장비 닫기"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-body-1 font-extrabold tracking-wide text-secondary-navy">
                        {machine.machine_id}
                      </span>
                      <Chip variant="outline" size="xs">
                        STEP {machine.step}
                      </Chip>
                      {machineDown ? (
                        <Chip variant="solid" color="red" size="xs" className="font-bold">
                          위험 장비
                        </Chip>
                      ) : null}
                    </div>
                    <span className={`flex items-center gap-1.5 text-label-2 font-bold ${STATUS_TEXT[machine.machine_status]}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[machine.machine_status]}`} />
                      {machine.machine_status}
                    </span>
                  </div>

                  {/* 장애 지속 시간 — 현장 영향도 */}
                  {machineDown ? (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                      <div>
                        <p className="text-[10px] font-semibold text-rose-500">{machine.machine_status} 지속</p>
                        <p className="text-body-1 font-extrabold text-rose-600">{machine.fault_elapsed_hr}시간째</p>
                      </div>
                      <div className="text-right text-label-3 text-rose-500">
                        <p>감지 {machine.fault_since}</p>
                        <p>
                          목표 복구 <b className="text-rose-600">{machine.recovery_eta}</b>
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* 영향 장비 확인하기 — 누르면 3D에 전파 표시 */}
                  {isCauseMachine ? (
                    <button
                      type="button"
                      onClick={() => setReveal((r) => (r === machine.machine_id ? null : machine.machine_id))}
                      className={`mt-3 w-full rounded-lg px-3 py-2 text-label-2 font-semibold transition ${
                        revealed
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {revealed ? '영향 장비 숨기기' : `영향 장비 확인하기 (${impactList.length}대)`}
                    </button>
                  ) : null}

                  <dl className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-surface-100/70 px-3 py-2.5">
                      <dt className="text-[10px] text-gray-400">가동률</dt>
                      <dd className="text-body-1 font-extrabold text-secondary-navy">{machine.utilization}%</dd>
                    </div>
                    <div className="rounded-xl bg-surface-100/70 px-3 py-2.5">
                      <dt className="text-[10px] text-gray-400">투입 UNIT</dt>
                      <dd className="text-body-2 font-bold text-secondary-navy">{machine.active_unit ?? '없음'}</dd>
                    </div>
                    <div className="rounded-xl bg-surface-100/70 px-3 py-2.5">
                      <dt className="text-[10px] text-gray-400">소속 구역</dt>
                      <dd className="text-body-2 font-bold text-secondary-navy">
                        구역 {String.fromCharCode(65 + districtOverviews.findIndex((d) => d.district_id === sel.district_id))}
                      </dd>
                    </div>
                  </dl>

                  {/* UNIT 공정 순서 시각화 토글 */}
                  {machine.active_unit ? (
                    <button
                      type="button"
                      onClick={() => setUnit((u) => (u === machine.active_unit ? null : machine.active_unit))}
                      className={`mt-3 w-full rounded-lg px-3 py-2 text-label-2 font-semibold transition ${
                        unit === machine.active_unit
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {unit === machine.active_unit
                        ? `${machine.active_unit} 공정 순서 숨기기`
                        : `${machine.active_unit} 공정 순서 보기`}
                    </button>
                  ) : null}
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4">
                {/* 최신 재조정안 */}
                <Card title="최신 재조정안" className="col-span-12 lg:col-span-7" bodyClassName="p-4">
                  {lr ? (
                    <div className="flex max-h-[210px] flex-col gap-2.5 overflow-y-auto text-label-3">
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                        <dt className="text-gray-400">Group ID</dt>
                        <dd className="text-right font-semibold text-secondary-navy">{lr.group_id}</dd>
                        <dt className="text-gray-400">Process Step</dt>
                        <dd className="text-right">
                          <Chip variant="outline" size="xs">
                            {lr.process_step}
                          </Chip>
                        </dd>
                        <dt className="text-gray-400">Max Risk Score</dt>
                        <dd className="text-right text-body-2 font-extrabold text-rose-600">{lr.max_risk_score.toFixed(2)}</dd>
                      </dl>
                      <div>
                        <p className="mb-1 font-semibold text-gray-400">관련 Delay Risks</p>
                        <table className="w-full text-[10px]">
                          <thead className="text-gray-400">
                            <tr>
                              <th className="py-1 pr-2 text-left font-semibold">Risk ID</th>
                              <th className="py-1 pr-2 text-left font-semibold">Level</th>
                              <th className="py-1 pr-2 text-left font-semibold">Detect</th>
                              <th className="py-1 pr-2 text-right font-semibold">Delay</th>
                              <th className="py-1 pr-2 text-right font-semibold">Prob.</th>
                              <th className="py-1 text-left font-semibold">Factor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lr.delay_risks.map((r) => (
                              <tr key={r.risk_id} className="border-t border-gray-100">
                                <td className="py-1 pr-2 font-medium text-gray-500">{r.risk_id}</td>
                                <td className="py-1 pr-2">
                                  <Chip variant="subtle" color={riskChip(r.risk_level)} size="xs">
                                    {r.risk_level}
                                  </Chip>
                                </td>
                                <td className="py-1 pr-2 text-gray-500">{r.detection_time}</td>
                                <td className="py-1 pr-2 text-right font-semibold text-primary-600">+{r.estimated_delay_hr}h</td>
                                <td className="py-1 pr-2 text-right text-gray-500">{Math.round(r.delay_probability * 100)}%</td>
                                <td className="py-1 text-gray-500">{r.risk_factor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-[11px]">
                        <span className="text-gray-400">발생시간</span>
                        <span className="text-right font-semibold text-secondary-navy">{lr.occurred_at}</span>
                        <span className="text-gray-400">영향 Unit</span>
                        <span className="text-right font-semibold text-secondary-navy">{lr.affected_units.join(', ')}</span>
                        <span className="text-gray-400">원인 Category</span>
                        <span className="text-right font-semibold text-secondary-navy">{lr.cause}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-label-3 text-gray-400">진행 중인 재조정안이 없습니다.</p>
                  )}
                </Card>

                {/* 대기 큐 */}
                <Card
                  title="대기 큐"
                  className="col-span-12 lg:col-span-5"
                  action={<span className="text-[11px] text-gray-400">3D에서 장비를 클릭하면 상세</span>}
                  bodyClassName="p-4"
                >
                  {sel.top_queue ? (
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-rose-50/80 px-3 py-2">
                      <div>
                        <p className="text-[10px] text-rose-500">최대 대기</p>
                        <p className="text-body-2 font-extrabold text-rose-600">{sel.top_queue.step}</p>
                      </div>
                      <p className="text-body-1 font-extrabold text-rose-600">{sel.top_queue.waiting_unit_count} EA</p>
                    </div>
                  ) : null}
                  <ul className="flex max-h-[130px] flex-col gap-2 overflow-y-auto">
                    {sel.queue_by_step.map((q, i) => (
                      <li key={q.step} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-label-3 font-medium text-gray-500">{q.step}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${i === 0 ? 'bg-rose-500' : 'bg-secondary-navy/40'}`}
                            style={{ width: `${(q.waiting / maxQ) * 100}%` }}
                          />
                        </div>
                        <span className="w-7 shrink-0 text-right text-label-3 font-bold text-secondary-navy">{q.waiting}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="rounded-full border border-white/70 bg-white/80 px-5 py-2.5 text-label-2 font-semibold text-gray-500 shadow-md backdrop-blur">
                공정 구역을 클릭하면 확대되어 상세 정보가 표시됩니다.
              </div>
            </div>
            <div aria-hidden />
          </>
        )}
      </div>
    </div>
  );
}
