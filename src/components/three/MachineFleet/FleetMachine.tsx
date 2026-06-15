import { Html } from '@react-three/drei';

import Machine, { type MachineDatum } from './Machine';
import { machineStatusBadgeClass } from './fleetStatus';
import type { Triplet } from './MachineFleet3D';

/** 장비 위에 떠있는 부하율/상태/현재 투입 UNIT 정보 카드 */
function MachineInfoCard({
  machine,
  position,
  hidden,
}: {
  machine: MachineDatum;
  position: Triplet;
  hidden: boolean;
}) {
  // 현재 투입 UNIT은 백엔드 activeSchedule 기준(머신 상태와 일관). 없으면 '없음'.
  const activeUnitId = machine.active_unit_id ?? null;

  return (
    <Html position={position} occlude={false} sprite>
      <article
        className={`min-w-[112px] rounded-xl border border-gray-200/85 bg-white/96 p-2.5 shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur transition-all duration-500 ${
          hidden ? 'pointer-events-none -translate-y-2 scale-95 opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-[11px] font-semibold tracking-[0.1em] text-secondary-navy">
          {machine.machine_id}
        </p>
        <span
          className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${machineStatusBadgeClass(machine.machine_status)}`}
        >
          {machine.machine_status}
        </span>
        <div className="mt-1.5 flex items-end gap-1">
          <span className="text-[1.5rem] font-bold leading-none tracking-[-0.05em] text-secondary-navy">
            {machine.load_rate ?? 0}
          </span>
          <span className="pb-0.5 text-[11px] font-semibold text-gray-400">%</span>
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-gray-400">부하율</p>

        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-1.5">
          <span className="text-[9px] font-medium text-gray-400">투입 UNIT</span>
          {activeUnitId ? (
            <span className="rounded-md bg-primary-50 px-1 py-0.5 text-[10px] font-bold text-primary-600">
              {activeUnitId}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-gray-300">없음</span>
          )}
        </div>
      </article>
    </Html>
  );
}

interface FleetMachineProps {
  data: MachineDatum;
  position: Triplet;
  cardPosition: Triplet;
  /** 선택 모드에서 정보 카드를 숨길지 여부 */
  cardHidden: boolean;
  onSelect: (machineCode: string) => void;
}

/** 클릭 가능한 장비 1대: 메시 + 떠있는 정보 카드 */
export function FleetMachine({ data, position, cardPosition, cardHidden, onSelect }: FleetMachineProps) {
  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(data.machine_id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <Machine data={data} position={position} active={data.machine_status === '가동중'} />
      <MachineInfoCard machine={data} position={cardPosition} hidden={cardHidden} />
    </group>
  );
}
