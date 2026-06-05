import { Scene } from '@components/three';

import Machine, { type MachineDatum } from './Machine';

interface MachineFleet3DProps {
  machines: MachineDatum[];
  className?: string;
}

const SPACING = 3.4;

/**
 * 장비 목록을 3D로 나란히 렌더한다.
 * 장비 수에 맞춰 X축 중앙 정렬한다.
 */
export default function MachineFleet3D({ machines, className }: MachineFleet3DProps) {
  const offset = ((machines.length - 1) * SPACING) / 2;

  return (
    <Scene className={className}>
      {machines.map((machine, index) => (
        <Machine
          key={machine.machineCode}
          data={machine}
          position={[index * SPACING - offset, 0, 0]}
        />
      ))}
    </Scene>
  );
}
