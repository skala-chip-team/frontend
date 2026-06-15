import { RoundedBox, Text } from '@react-three/drei';

// 필드명은 docs/data.dbml 컬럼명을 따른다.
export interface MachineUnit {
  schedule_id: string; // schedule_master.schedule_id
  unit_id: string; // unit_master.unit_id
  priority: number; // schedule_master.priority (1 높음 ~ 5 낮음)
  status: '진행중' | '대기' | '완료'; // schedule_master.status
  start_time: number; // work_status.start_time (mock: 시 단위)
  end_time: number; // work_status.end_time
}

export interface MachineDatum {
  machine_id: string; // machine_master.machine_id
  machine_type: string; // machine_master.machine_type (표시용 장비명)
  machine_status: '점검중' | '가동중' | '대기중'; // machine_master.machine_status
  avg_utilization_rate: number; // 가동률(%)
  load_rate?: number; // 부하율(%) — machines API의 loadRate
  active_unit_id?: string | null; // 현재 투입 UNIT (machines API의 activeSchedule.unitId)
  units?: MachineUnit[];
}

interface MachineProps {
  data: MachineDatum;
  position: [number, number, number];
  active?: boolean;
}

const GRAY_0 = '#F4F8FB';
const GRAY_1 = '#E1E8F0';
const GRAY_2 = '#CAD4DE';
const GRAY_3 = '#A8B4C0';
const GRAY_4 = '#8592A0';
const GRAY_5 = '#616E7D';
const GRAY_6 = '#414C58';
const GRAY_7 = '#171E27';

const CYAN_0 = '#D9F8FF';
const CYAN_1 = '#80DDFF';
const CYAN_2 = '#45C9FF';
const SCREEN_BG = '#0A131C';
const SCREEN_LINE = '#96E4FF';
const ACCENT_RED = '#D14D45';
const ACCENT_AMBER = '#D9AA48';
const LABEL = '#56606B';

function GlowStrip({
  position,
  args,
  intensity,
}: {
  position: [number, number, number];
  args: [number, number, number];
  intensity: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={CYAN_1}
        emissive={CYAN_2}
        emissiveIntensity={intensity}
        roughness={0.18}
        metalness={0.16}
      />
    </mesh>
  );
}

function WindowGrid({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.84, 1.36, 0.04]} />
        <meshStandardMaterial color={GRAY_7} roughness={0.48} metalness={0.08} />
      </mesh>
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={`v-${x}`} position={[x, 0, 0.03]}>
          <boxGeometry args={[0.03, 1.24, 0.02]} />
          <meshStandardMaterial color={GRAY_2} roughness={0.24} metalness={0.34} />
        </mesh>
      ))}
      {[-0.34, 0, 0.34].map((y) => (
        <mesh key={`h-${y}`} position={[0, y, 0.03]}>
          <boxGeometry args={[0.74, 0.03, 0.02]} />
          <meshStandardMaterial color={GRAY_2} roughness={0.24} metalness={0.34} />
        </mesh>
      ))}
    </group>
  );
}

function MonitorPanel({
  position,
  active,
}: {
  position: [number, number, number];
  active: boolean;
}) {
  const glow = active ? 1.15 : 0.5;

  return (
    <group position={position}>
      <RoundedBox args={[1.14, 1.68, 0.12]} radius={0.04} castShadow receiveShadow>
        <meshStandardMaterial color={GRAY_6} roughness={0.34} metalness={0.18} />
      </RoundedBox>
      <mesh castShadow receiveShadow position={[0, 0.26, 0.08]}>
        <boxGeometry args={[0.92, 0.74, 0.02]} />
        <meshStandardMaterial color={SCREEN_BG} roughness={0.28} metalness={0.08} />
      </mesh>
      {[-0.28, -0.12, 0.04, 0.2].map((y, index) => (
        <mesh key={y} position={[0, 0.46 - index * 0.14, 0.1]}>
          <boxGeometry args={[0.72, 0.014, 0.008]} />
          <meshStandardMaterial color={SCREEN_LINE} emissive={SCREEN_LINE} emissiveIntensity={glow} />
        </mesh>
      ))}
      {[-0.28, -0.14, 0, 0.14, 0.28].map((x, index) => (
        <mesh key={x} position={[x, -0.46, 0.09]}>
          <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} />
          <meshStandardMaterial
            color={index === 0 ? ACCENT_AMBER : index === 4 ? ACCENT_RED : GRAY_2}
            roughness={0.32}
            metalness={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Machine({
  data,
  position,
  active = false,
}: MachineProps) {
  const glow = active ? 1.55 : 0.36;

  return (
    <group position={position} scale={0.76}>
      <group rotation={[0, 3.12, 0]}>
        <mesh receiveShadow position={[0.14, 0.08, 0.04]}>
          <boxGeometry args={[4.7, 0.18, 4.08]} />
          <meshStandardMaterial color={GRAY_5} roughness={0.74} metalness={0.12} />
        </mesh>

        <RoundedBox args={[3.92, 0.82, 3.46]} radius={0.04} castShadow receiveShadow position={[-0.14, 0.48, 0]}>
          <meshStandardMaterial color={GRAY_2} roughness={0.28} metalness={0.42} />
        </RoundedBox>
        <mesh castShadow receiveShadow position={[-0.58, 0.54, 1.54]}>
          <boxGeometry args={[2.34, 0.56, 0.1]} />
          <meshStandardMaterial color={GRAY_7} roughness={0.46} metalness={0.1} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.84, 0.7, 0.72]}>
          <boxGeometry args={[1.06, 1.02, 1.24]} />
          <meshStandardMaterial color={GRAY_7} roughness={0.46} metalness={0.1} />
        </mesh>

        <RoundedBox args={[1.18, 3.66, 3.02]} radius={0.05} castShadow receiveShadow position={[-1.72, 2.12, 0]}>
          <meshStandardMaterial color={GRAY_1} roughness={0.24} metalness={0.52} />
        </RoundedBox>
        <RoundedBox args={[0.94, 3.18, 2.78]} radius={0.04} castShadow receiveShadow position={[-1.86, 2.06, 0]}>
          <meshStandardMaterial color={GRAY_7} roughness={0.42} metalness={0.12} />
        </RoundedBox>
        <WindowGrid position={[-1.86, 2.08, 1.34]} />

        <RoundedBox args={[1.18, 4.02, 0.52]} radius={0.05} castShadow receiveShadow position={[0.68, 2.34, 1.46]}>
          <meshStandardMaterial color={GRAY_1} roughness={0.22} metalness={0.56} />
        </RoundedBox>
        <RoundedBox args={[0.82, 4.22, 0.62]} radius={0.05} castShadow receiveShadow position={[1.56, 2.42, 1.42]}>
          <meshStandardMaterial color={GRAY_2} roughness={0.22} metalness={0.54} />
        </RoundedBox>

        <RoundedBox args={[3.38, 0.74, 2.96]} radius={0.05} castShadow receiveShadow position={[-0.28, 4.02, 0]}>
          <meshStandardMaterial color={GRAY_1} roughness={0.22} metalness={0.54} />
        </RoundedBox>
        <mesh castShadow receiveShadow position={[-0.22, 4.52, 0]}>
          <boxGeometry args={[2.24, 0.48, 2.12]} />
          <meshStandardMaterial color={GRAY_7} roughness={0.42} metalness={0.16} />
        </mesh>

        <mesh castShadow receiveShadow position={[-0.42, 2.72, -0.02]}>
          <boxGeometry args={[2.28, 1.72, 2.42]} />
          <meshStandardMaterial color={GRAY_3} roughness={0.24} metalness={0.42} />
        </mesh>
        {[0.98, 0.56, 0.14].map((y) => (
          <mesh key={y} castShadow receiveShadow position={[-0.42, y + 2.04, 1.08]}>
            <boxGeometry args={[2.08, 0.08, 0.05]} />
            <meshStandardMaterial color={GRAY_5} roughness={0.34} metalness={0.26} />
          </mesh>
        ))}
        <mesh castShadow receiveShadow position={[0.22, 2.82, 1.12]}>
          <boxGeometry args={[0.05, 0.42, 0.08]} />
          <meshStandardMaterial color={GRAY_7} roughness={0.42} metalness={0.16} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.44, 2.82, 1.12]}>
          <boxGeometry args={[0.05, 0.42, 0.08]} />
          <meshStandardMaterial color={GRAY_7} roughness={0.42} metalness={0.16} />
        </mesh>

        <mesh castShadow receiveShadow position={[0.18, 2.34, -0.82]}>
          <boxGeometry args={[2.06, 2.3, 0.07]} />
          <meshStandardMaterial color={GRAY_1} roughness={0.18} metalness={0.6} />
        </mesh>
        {[-0.64, -0.2, 0.24, 0.68].map((y) => (
          <mesh key={y} castShadow receiveShadow position={[0.18, 2.34 + y, -0.78]}>
            <boxGeometry args={[1.82, 0.05, 0.02]} />
            <meshStandardMaterial color={CYAN_0} emissive={CYAN_1} emissiveIntensity={0.32} />
          </mesh>
        ))}

        <mesh castShadow receiveShadow position={[1.02, 2.86, 0.2]}>
          <boxGeometry args={[1.02, 1.62, 1.18]} />
          <meshStandardMaterial color={GRAY_1} roughness={0.18} metalness={0.58} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.14, 2.88, 0.72]}>
          <boxGeometry args={[0.62, 0.28, 0.06]} />
          <meshStandardMaterial color={GRAY_6} roughness={0.32} metalness={0.2} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.02, 2.28, 0.2]}>
          <boxGeometry args={[0.38, 0.66, 0.38]} />
          <meshStandardMaterial color={GRAY_0} roughness={0.18} metalness={0.58} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.02, 1.8, 0.2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.58, 24]} />
          <meshStandardMaterial color={GRAY_4} roughness={0.24} metalness={0.56} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.02, 1.34, 0.2]}>
          <cylinderGeometry args={[0.12, 0.14, 0.4, 24]} />
          <meshStandardMaterial color={GRAY_2} roughness={0.2} metalness={0.58} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.02, 1.04, 0.2]}>
          <cylinderGeometry args={[0.28, 0.24, 0.16, 22]} />
          <meshStandardMaterial color={GRAY_6} roughness={0.3} metalness={0.22} />
        </mesh>

        <RoundedBox args={[1.9, 0.18, 1.66]} radius={0.03} castShadow receiveShadow position={[1.56, 1.08, 0.42]}>
          <meshStandardMaterial color={GRAY_1} roughness={0.18} metalness={0.58} />
        </RoundedBox>
        <RoundedBox args={[1.04, 0.14, 0.98]} radius={0.03} castShadow receiveShadow position={[1.68, 1.24, 0.34]}>
          <meshStandardMaterial color={GRAY_0} roughness={0.16} metalness={0.62} />
        </RoundedBox>
        <mesh castShadow receiveShadow position={[2.12, 1.38, 0.46]}>
          <boxGeometry args={[0.72, 0.2, 0.56]} />
          <meshStandardMaterial color={GRAY_5} roughness={0.3} metalness={0.26} />
        </mesh>
        <mesh castShadow receiveShadow position={[2.36, 1.52, 0.52]}>
          <boxGeometry args={[0.3, 0.1, 0.22]} />
          <meshStandardMaterial color={GRAY_7} roughness={0.42} metalness={0.16} />
        </mesh>

        <mesh castShadow receiveShadow position={[1.98, 3.42, 1.26]}>
          <cylinderGeometry args={[0.09, 0.09, 0.94, 18]} />
          <meshStandardMaterial color={GRAY_1} roughness={0.22} metalness={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[2.54, 3.42, 1.26]}>
          <boxGeometry args={[1.08, 0.16, 0.16]} />
          <meshStandardMaterial color={GRAY_2} roughness={0.22} metalness={0.5} />
        </mesh>
        <MonitorPanel position={[3.34, 2.6, 1.32]} active={active} />

        <GlowStrip position={[-2.28, 2.16, 1.56]} args={[0.05, 3.78, 0.04]} intensity={glow} />
        <GlowStrip position={[-1.26, 0.12, 1.56]} args={[2.12, 0.05, 0.04]} intensity={glow} />
        <GlowStrip position={[0.52, 2.72, 1.16]} args={[1.46, 0.04, 0.03]} intensity={glow * 0.9} />
        <GlowStrip position={[-2.04, 2.16, -1.54]} args={[0.05, 3.74, 0.04]} intensity={glow * 0.92} />
        <GlowStrip position={[-1.18, 0.12, -1.54]} args={[2.02, 0.05, 0.04]} intensity={glow * 0.92} />
        <GlowStrip position={[0.16, 2.3, -1]} args={[1.58, 0.04, 0.02]} intensity={glow * 0.78} />

        <Text
          position={[0.28, -0.1, 1.3]}
          fontSize={0.11}
          color={LABEL}
          anchorX="center"
          anchorY="middle"
        >
          {data.machine_id}
        </Text>
      </group>
    </group>
  );
}
