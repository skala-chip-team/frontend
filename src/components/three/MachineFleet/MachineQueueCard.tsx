export interface FleetQueue {
  waiting_units: string[]; // process_queue.unit_id 목록(queue_position 순)
  avg_wait_time_min: number; // district_status.avg_wait_time_min
}

const QUEUE_VISIBLE_LIMIT = 5;

interface MachineQueueCardProps {
  queue: FleetQueue;
  className?: string;
}

/** 장비 플릿 대기열 카드: 대기 수 · 평균 대기시간 + 대기 UNIT 순서 */
export function MachineQueueCard({ queue, className = '' }: MachineQueueCardProps) {
  const { waiting_units: waitingUnits, avg_wait_time_min: avgWaitTimeMin } = queue;
  const visibleUnits = waitingUnits.slice(0, QUEUE_VISIBLE_LIMIT);
  const remaining = waitingUnits.length - visibleUnits.length;

  return (
    <div
      className={`w-[208px] rounded-[1.5rem] border border-gray-200/85 bg-white/96 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">대기열</p>

      <div className="mt-3 flex gap-2">
        <div className="flex-1 rounded-xl bg-surface-100 px-3 py-2.5">
          <p className="text-[10px] font-medium text-gray-400">대기 UNIT</p>
          <p className="mt-1 text-[20px] font-bold leading-none text-secondary-navy">
            {waitingUnits.length}
            <span className="ml-0.5 text-[12px] font-semibold text-gray-400">개</span>
          </p>
        </div>
        <div className="flex-1 rounded-xl bg-surface-100 px-3 py-2.5">
          <p className="text-[10px] font-medium text-gray-400">평균 대기</p>
          <p className="mt-1 text-[20px] font-bold leading-none text-secondary-navy">
            {avgWaitTimeMin}
            <span className="ml-0.5 text-[12px] font-semibold text-gray-400">분</span>
          </p>
        </div>
      </div>

      <div className="relative mt-4 pl-[10px]">
        <span
          className="pointer-events-none absolute bottom-3 left-[10px] top-3 w-px bg-gray-200"
          aria-hidden
        />
        <ul className="flex flex-col gap-2">
          {visibleUnits.map((unit, index) => (
            <li key={unit} className="relative flex items-center gap-2.5">
              <span className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <span className="flex-1 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-secondary-navy shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                {unit}
              </span>
            </li>
          ))}

          {remaining > 0 ? (
            <li className="relative flex items-center gap-2.5">
              <span className="z-10 flex h-5 w-5 shrink-0 flex-col items-center justify-center gap-[2px] rounded-full bg-gray-100">
                <span className="h-[2px] w-[2px] rounded-full bg-gray-400" />
                <span className="h-[2px] w-[2px] rounded-full bg-gray-400" />
                <span className="h-[2px] w-[2px] rounded-full bg-gray-400" />
              </span>
              <span className="text-[11px] font-medium text-gray-400">외 {remaining}개 대기 중</span>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
