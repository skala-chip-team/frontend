import { useMemo } from 'react';

import { Text } from '@react-three/drei';

export interface MachineDatum {
  machineName: string;
  machineCode: string;
  utilization: number;
}

interface MachineProps {
  data: MachineDatum;
  position: [number, number, number];
}

// 디자인 토큰 색상 (index.css와 동일 값)
const STATUS_HIGH = '#EA002C'; // primary-500
const STATUS_MID = '#F97316'; // secondary-orange
const STATUS_LOW = '#15203D'; // secondary-navy-soft
const BODY_COLOR = '#E9EEF3'; // surface-200
const PORT_COLOR = '#081028'; // secondary-navy
const LABEL_COLOR = '#475569'; // gray-600

function statusColor(utilization: number): string {
  if (utilization >= 75) return STATUS_HIGH;
  if (utilization >= 60) return STATUS_MID;
  return STATUS_LOW;
}

/**
 * 반도체 툴 캐비닛 형태의 장비 1대.
 * 본체 박스 + 전면 로드포트 + 상단 상태등으로 구성.
 */
export default function Machine({ data, position }: MachineProps) {
  const light = useMemo(() => statusColor(data.utilization), [data.utilization]);

  return (
    <group position={position}>
      {/* 본체 */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 1.4]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* 전면 로드포트 */}
      <mesh castShadow position={[0, 0.6, 0.75]}>
        <boxGeometry args={[1.4, 0.8, 0.2]} />
        <meshStandardMaterial color={PORT_COLOR} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* 상단 상태등 */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} />
      </mesh>

      {/* 라벨 */}
      <Text position={[0, 2.9, 0]} fontSize={0.32} color={PORT_COLOR} anchorX="center">
        {data.machineCode}
      </Text>
      <Text position={[0, -0.35, 0.75]} fontSize={0.22} color={LABEL_COLOR} anchorX="center">
        {data.machineName}
      </Text>
    </group>
  );
}
