import { useEffect, useMemo, useState } from 'react';

import { Html, RoundedBox, Text } from '@react-three/drei';

import { Scene } from '@components/three';

import Machine, { type MachineDatum } from './Machine';

interface MachineFleet3DProps {
  machines: MachineDatum[];
  queuedUnits?: string[];
  className?: string;
}

type QueueBoxProps = {
  label: string;
  position: [number, number, number];
  scale?: number;
  opacity?: number;
};

const CARD_BOX = '#48515C';
const CARD_BOX_DARK = '#252D36';
const CARD_BOX_LABEL = '#798391';
const CONVEYOR_FRAME = '#9DA8B4';
const CONVEYOR_EDGE = '#727C89';
const CONVEYOR_TOP = '#C8D1DB';
const CONVEYOR_GROOVE = '#A8B3BE';
const GATE_SHELL = '#DEE5EC';
const GATE_DARK = '#171C22';
const GATE_PANEL = '#243140';
const GATE_SCREEN = '#8FD2FF';
const GATE_FRAME = '#C3CED9';
const FLOOR = '#E7EBEF';
const MACHINE_OFFSET: [number, number, number] = [-1.85, -0.44, 0];
const CONVEYOR_OFFSET: [number, number, number] = [-1.5, -0.44, 7.4];

function statusStyles(status: MachineDatum['status']) {
  if (status === '가동중') {
    return 'border-emerald-200/80 bg-emerald-50 text-emerald-600';
  }

  if (status === '점검중') {
    return 'border-amber-200/80 bg-amber-50 text-amber-600';
  }

  return 'border-slate-200/80 bg-slate-100 text-slate-600';
}

function MachineInfoCard({
  machine,
  position,
}: {
  machine: MachineDatum;
  position: [number, number, number];
}) {
  return (
    <Html position={position} occlude={false} sprite>
      <article className="min-w-[154px] rounded-[1.25rem] border border-gray-200/85 bg-white/96 p-3.5 shadow-[0_16px_32px_rgba(15,23,42,0.14)] backdrop-blur">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-secondary-navy">
          {machine.machineCode}
        </p>
        <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles(machine.status)}`}>
          {machine.status}
        </span>
        <div className="mt-3 flex items-end gap-1">
          <span className="text-[2.3rem] font-bold leading-none tracking-[-0.05em] text-secondary-navy">
            {machine.utilization}
          </span>
          <span className="pb-1 text-[13px] font-semibold text-gray-400">%</span>
        </div>
        <p className="mt-1 text-[12px] font-medium text-gray-400">가동률</p>
      </article>
    </Html>
  );
}

function QueueBox({ label, position, scale = 1, opacity = 1 }: QueueBoxProps) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.86, 0.56, 0.7]} radius={0.04} castShadow receiveShadow>
        <meshStandardMaterial color={CARD_BOX} roughness={0.42} metalness={0.56} transparent opacity={opacity} />
      </RoundedBox>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[0.46, 0.03, 0.08]} />
        <meshStandardMaterial color={CARD_BOX_DARK} roughness={0.34} metalness={0.64} transparent opacity={opacity} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.26, -0.08, 0.36]}>
        <boxGeometry args={[0.16, 0.08, 0.01]} />
        <meshStandardMaterial color={CARD_BOX_LABEL} roughness={0.44} metalness={0.3} transparent opacity={opacity} />
      </mesh>
      <Text
        position={[0, -0.36, 0]}
        fontSize={0.09}
        color="#E7EEF6"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function ConveyorLane() {
  const grooves = Array.from({ length: 22 }, (_, index) => -3.1 + index * 0.29);

  return (
    <group position={[-3.6, 0, 0.1]}>
      <mesh receiveShadow position={[0, -0.28, 0]}>
        <boxGeometry args={[7.2, 0.08, 1.2]} />
        <meshStandardMaterial color={CONVEYOR_FRAME} roughness={0.68} metalness={0.18} />
      </mesh>
      <mesh receiveShadow position={[0, -0.16, 0]}>
        <boxGeometry args={[7.18, 0.12, 1.04]} />
        <meshStandardMaterial color={CONVEYOR_EDGE} roughness={0.62} metalness={0.22} />
      </mesh>
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[7.08, 0.08, 0.94]} />
        <meshStandardMaterial color={CONVEYOR_TOP} roughness={0.56} metalness={0.18} />
      </mesh>
      {grooves.map((x) => (
        <mesh key={x} position={[x, -0.005, 0]}>
          <boxGeometry args={[0.1, 0.01, 0.9]} />
          <meshStandardMaterial color={CONVEYOR_GROOVE} roughness={0.58} metalness={0.14} />
        </mesh>
      ))}
    </group>
  );
}

function DispatchGate() {
  return (
    <group position={[0.1, 0.92, 0.06]}>
      <RoundedBox args={[1.16, 1.86, 1.44]} radius={0.06} castShadow receiveShadow>
        <meshStandardMaterial color={GATE_SHELL} roughness={0.34} metalness={0.38} />
      </RoundedBox>

      <mesh castShadow receiveShadow position={[0.1, -0.04, 0]}>
        <boxGeometry args={[0.72, 1.16, 0.96]} />
        <meshStandardMaterial color={GATE_DARK} roughness={0.58} metalness={0.08} />
      </mesh>
      <RoundedBox args={[0.88, 1.34, 1.08]} radius={0.04} castShadow receiveShadow position={[0.08, 0.02, 0]}>
        <meshStandardMaterial color={GATE_FRAME} roughness={0.3} metalness={0.34} />
      </RoundedBox>
      <mesh castShadow receiveShadow position={[0.12, 0.02, 0]}>
        <boxGeometry args={[0.52, 0.96, 0.72]} />
        <meshStandardMaterial color={GATE_DARK} roughness={0.56} metalness={0.08} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.12, 0.02, -0.34]}>
        <boxGeometry args={[0.5, 0.88, 0.06]} />
        <meshStandardMaterial color="#202B36" roughness={0.54} metalness={0.08} />
      </mesh>
      {[-0.24, 0, 0.24].map((x) => (
        <mesh key={`frame-${x}`} castShadow receiveShadow position={[x, 0.86, 0.5]}>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshStandardMaterial color={GATE_FRAME} roughness={0.34} metalness={0.26} />
        </mesh>
      ))}

      <mesh castShadow receiveShadow position={[-0.5, 0.28, -0.38]}>
        <boxGeometry args={[0.08, 0.96, 0.2]} />
        <meshStandardMaterial color={GATE_PANEL} roughness={0.38} metalness={0.24} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.5, 0.28, -0.38]}>
        <boxGeometry args={[0.05, 0.66, 0.16]} />
        <meshStandardMaterial color="#18212B" roughness={0.34} metalness={0.18} />
      </mesh>
      {[-0.18, 0, 0.18].map((y) => (
        <mesh key={y} position={[-0.47, 0.28 + y, -0.28]}>
          <boxGeometry args={[0.01, 0.1, 0.01]} />
          <meshStandardMaterial color={GATE_SCREEN} emissive={GATE_SCREEN} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function MachineFleet3D({
  machines,
  queuedUnits,
  className,
}: MachineFleet3DProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 80);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const machineList = useMemo(() => machines.slice(0, 3), [machines]);
  const queueList = useMemo(() => {
    if (queuedUnits && queuedUnits.length > 0) {
      return queuedUnits.slice(0, 6);
    }

    return machineList.flatMap((machine) => [
      `${machine.machineCode}-A`,
      `${machine.machineCode}-B`,
    ]);
  }, [machineList, queuedUnits]);

  const queueSlots = [-0.15, -1.35, -2.55, -3.75, -4.95];
  const elapsed = tick * 0.08;
  const cycleDuration = 4.8;
  const cycleIndex = Math.floor(elapsed / cycleDuration);
  const cycleProgress = (elapsed % cycleDuration) / cycleDuration;
  const shiftAmount = cycleProgress * 0.34;
  const dispatchProgress = cycleProgress < 0.55 ? 0 : (cycleProgress - 0.55) / 0.45;

  const displayedUnits = queueSlots.map((slot, index) => {
    const label = queueList.length > 0 ? queueList[(cycleIndex + index) % queueList.length] : `UNIT-${index + 1}`;
    const isFront = index === 0;

    if (isFront) {
      const vanishProgress = Math.min(dispatchProgress / 0.42, 1);
      const x = slot + shiftAmount + dispatchProgress * 0.3;
      const scale = 1 - vanishProgress * 0.28;
      const opacity = 1 - vanishProgress;

      return {
        key: `${label}-${cycleIndex}`,
        label,
        position: [x, 0.16, 0.1] as [number, number, number],
        scale,
        opacity,
      };
    }

    return {
      key: `${label}-${cycleIndex}-${index}`,
      label,
      position: [slot + shiftAmount, 0.16, 0.1] as [number, number, number],
      scale: 1,
      opacity: 1,
    };
  });

  const machinePositions: [number, number, number][] = [
    [1.6, -0.42, -2.55],
    [5.15, -0.42, 0],
    [8.7, -0.42, 2.55],
  ];
  const cardPositions = machinePositions.map(([x, , z]) => [x, 4.2, z + 0.08] as [number, number, number]);

  return (
    <Scene className={className} cameraPosition={[0, 5.4, 18.8]}>
      <color attach="background" args={[FLOOR]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 12, 6]} intensity={1.5} castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.55} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[1.4, -0.7, 0.2]}>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color={FLOOR} roughness={0.96} metalness={0.02} />
      </mesh>

      <group position={CONVEYOR_OFFSET}>
        <ConveyorLane />
        <DispatchGate />

        {displayedUnits.map((unit) => (
          <QueueBox
            key={unit.key}
            label={unit.label}
            position={unit.position}
            scale={unit.scale}
            opacity={unit.opacity}
          />
        ))}
      </group>

      <group position={MACHINE_OFFSET}>
        {machineList.map((machine, index) => (
          <group key={machine.machineCode}>
            <Machine
              data={machine}
              position={machinePositions[index] ?? [index * 2.4, 0, 0]}
              active={machine.status === '가동중'}
            />
            <MachineInfoCard
              machine={machine}
              position={cardPositions[index] ?? [0, 0, 0]}
            />
          </group>
        ))}
      </group>
    </Scene>
  );
}
