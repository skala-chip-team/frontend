import { useEffect, useMemo, useRef, type ComponentRef, type ReactNode } from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import {
  CameraControls,
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  RoundedBox,
  Text,
} from '@react-three/drei';
import { Group, Mesh, Vector3 } from 'three';

import type { DistrictOverview, OverviewMachine, OverviewMachineStatus, ProcessStep } from '@/mocks/districtOverview';

const ZONE_TONE = '#ced2d9';
const ZONE_TONE_DIM = '#bcc0c7';
const ZONE_TONE_SELECTED = '#f7f8fa';
const CAUSE = '#ef4444'; // 원인(빨강)
const IMPACT = '#f59e0b'; // 영향 예상(주황)
const ROUTE = '#2563eb'; // 공정 순서(파랑)

const G0 = '#F4F8FB';
const G1 = '#E1E8F0';
const G2 = '#CAD4DE';
const G4 = '#8592A0';
const G5 = '#616E7D';
const SCREEN_BG = '#0A131C';
const SCREEN_LINE = '#96E4FF';
const GHOST = '#c7ccd3'; // inactive(경로 외) 기계 반투명 톤 (밝은 회색)

const STATUS_HEX: Record<OverviewMachineStatus, string> = {
  가동중: '#22c55e',
  점검중: '#f59e0b',
  정지: '#94a3b8',
  장애: '#ef4444',
};

const STATUS_LEGEND: OverviewMachineStatus[] = ['가동중', '점검중', '정지', '장애'];
const STEPS: ProcessStep[] = ['A', 'B', 'C', 'D'];

const ZONE_W = 6.0;
const ZONE_D = 4.8;
const GAP = 1.3;
const BASE_TOP = 0.16;
const PLAT_TOP = 0.34;
const LIFT = 0.16;
const CELL_X = 0.86;
const CELL_Z = 1.16;
const MACHINE_SCALE = 1.15;
// 흐름 높이: 기계 몸체 높이로 통과(불투명이라 기계가 가리면 가려지고, 앞이면 덮음).
const FLOW_Y = PLAT_TOP + 0.5;

const zoneXOf = (i: number, n: number) => {
  const totalW = n * ZONE_W + (n - 1) * GAP;
  return -totalW / 2 + ZONE_W / 2 + i * (ZONE_W + GAP);
};

const laneZ = (li: number) => (li - (STEPS.length - 1) / 2) * CELL_Z;
const machineX = (col: number, len: number) => (col - (len - 1) / 2) * CELL_X + 0.28;
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** UNIT 공정 흐름이 거쳐가는 스텝별 기계 (현재 그 UNIT이 있는 기계는 실제 그 기계를 사용 — 싱크) */
function routeMachines(d: DistrictOverview, unitId: string): OverviewMachine[] {
  const h = hashStr(unitId);
  const out: OverviewMachine[] = [];
  STEPS.forEach((s) => {
    const list = d.machines.filter((m) => m.step === s);
    if (!list.length) return;
    out.push(list.find((m) => m.active_unit === unitId) ?? list[h % list.length]);
  });
  return out;
}

function routeMachineIds(d: DistrictOverview, unitId: string): Set<string> {
  return new Set(routeMachines(d, unitId).map((m) => m.machine_id));
}

/** 특정 기계의 베이 바닥 좌표(구역 로컬) */
function machineFloorPos(d: DistrictOverview, id: string): [number, number, number] | null {
  for (let li = 0; li < STEPS.length; li += 1) {
    const list = d.machines.filter((m) => m.step === STEPS[li]);
    const idx = list.findIndex((m) => m.machine_id === id);
    if (idx >= 0) return [machineX(idx, list.length), FLOW_Y, laneZ(li)];
  }
  return null;
}

/** 장비 1대 래퍼 — 선택/강조 시 위로 솟는 액션(애니메이션) */
function LiftMachine({
  x,
  targetY,
  focused,
  onClick,
  children,
}: {
  x: number;
  targetY: number;
  focused: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (g) g.position.y += (targetY - g.position.y) * 0.16;
  });
  return (
    <group
      ref={ref}
      position={[x, 0, 0]}
      scale={MACHINE_SCALE}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (focused) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {children}
    </group>
  );
}

/** 미니 공정 장비 1대 */
function MiniMachine({
  status,
  bodyColor,
  bodyEmissive,
  bodyEmissiveI,
  inactive = false,
}: {
  status: OverviewMachineStatus;
  bodyColor: string;
  bodyEmissive: string;
  bodyEmissiveI: number;
  inactive?: boolean;
}) {
  const sig = STATUS_HEX[status];
  const on = status === '가동중' || status === '점검중';

  // 경로 외 기기: 겹침으로 색이 뭉치지 않게 주요 실루엣(받침·본체·캐비닛)만 반투명으로
  if (inactive) {
    return (
      <group>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.46]} />
          <meshStandardMaterial color={GHOST} transparent opacity={0.28} depthWrite={false} roughness={0.9} metalness={0} />
        </mesh>
        <RoundedBox args={[0.42, 0.26, 0.4]} radius={0.04} smoothness={3} position={[0, 0.18, 0]}>
          <meshStandardMaterial color={GHOST} transparent opacity={0.28} depthWrite={false} roughness={0.9} metalness={0} />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.42, 0.32]} radius={0.04} smoothness={3} position={[-0.15, 0.26, 0]}>
          <meshStandardMaterial color={GHOST} transparent opacity={0.28} depthWrite={false} roughness={0.9} metalness={0} />
        </RoundedBox>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[0.5, 0.05, 0.46]} />
        <meshStandardMaterial color={G5} roughness={0.7} metalness={0.12} />
      </mesh>
      <RoundedBox args={[0.42, 0.26, 0.4]} radius={0.04} smoothness={3} position={[0, 0.18, 0]} castShadow>
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.4} emissive={bodyEmissive} emissiveIntensity={bodyEmissiveI} />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.18, 0.3]} radius={0.03} smoothness={3} position={[0.16, 0.14, 0.04]} castShadow>
        <meshStandardMaterial color={G0} roughness={0.2} metalness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.42, 0.32]} radius={0.04} smoothness={3} position={[-0.15, 0.26, 0]} castShadow>
        <meshStandardMaterial color={G1} roughness={0.24} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.2, 0.205]}>
        <boxGeometry args={[0.22, 0.15, 0.02]} />
        <meshStandardMaterial color={SCREEN_BG} roughness={0.28} metalness={0.08} />
      </mesh>
      {[-0.03, 0.01, 0.05].map((y) => (
        <mesh key={y} position={[0, 0.2 + y, 0.216]}>
          <boxGeometry args={[0.16, 0.012, 0.006]} />
          <meshStandardMaterial color={SCREEN_LINE} emissive={SCREEN_LINE} emissiveIntensity={on ? 0.9 : 0.06} />
        </mesh>
      ))}
      <mesh position={[-0.15, 0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.1, 10]} />
        <meshStandardMaterial color={G4} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.13, 16]} />
        <meshStandardMaterial color={sig} emissive={sig} emissiveIntensity={1.6} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** 바닥 트랙 + 방향으로 흐르는 빛 (3D 화살표 대신) */
function FlowTrack({ nodes, color = ROUTE }: { nodes: [number, number, number][]; color?: string }) {
  const COUNT = 4;
  const refs = useRef<(Mesh | null)[]>([]);
  const tmp = useMemo(() => new Vector3(), []);
  const phase = useRef(0);

  const arc = useMemo(() => {
    const pts = nodes.map((n) => new Vector3(n[0], n[1], n[2]));
    const segs: { mid: [number, number, number]; len: number; angle: number }[] = [];
    const lens = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i += 1) {
      const dx = pts[i].x - pts[i - 1].x;
      const dz = pts[i].z - pts[i - 1].z;
      const len = Math.hypot(dx, dz) || 0.001;
      segs.push({
        mid: [(pts[i].x + pts[i - 1].x) / 2, (pts[i].y + pts[i - 1].y) / 2, (pts[i].z + pts[i - 1].z) / 2],
        len,
        angle: Math.atan2(-dz, dx),
      });
      total += len;
      lens.push(total);
    }
    return { pts, segs, lens, total };
  }, [nodes]);

  useFrame((_, delta) => {
    if (arc.total === 0) return;
    phase.current = (phase.current + delta * 0.12) % 1;
    for (let i = 0; i < COUNT; i += 1) {
      const m = refs.current[i];
      if (!m) continue;
      const t = (phase.current + i / COUNT) % 1;
      const target = t * arc.total;
      let s = 1;
      while (s < arc.lens.length - 1 && arc.lens[s] < target) s += 1;
      const segLen = arc.lens[s] - arc.lens[s - 1] || 1;
      const f = (target - arc.lens[s - 1]) / segLen;
      tmp.copy(arc.pts[s - 1]).lerp(arc.pts[s], f);
      m.position.set(tmp.x, tmp.y + 0.015, tmp.z);
      m.rotation.y = arc.segs[s - 1].angle;
    }
  });

  return (
    <>
      {/* 바닥 트랙 베이스 */}
      {arc.segs.map((seg, i) => (
        <mesh key={i} position={seg.mid} rotation={[0, seg.angle, 0]}>
          <boxGeometry args={[seg.len + 0.2, 0.05, 0.12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      {/* 흐르는 빛 */}
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <boxGeometry args={[0.62, 0.02, 0.24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

/** 포커스 구역 위 "문제 전파"(기계→기계) + UNIT 공정 흐름 */
function FocusOverlays({
  d,
  routeUnitId,
  showProblem,
}: {
  d: DistrictOverview;
  routeUnitId: string | null;
  showProblem: boolean;
}) {
  const lr = d.latest_reschedule;

  // UNIT 공정 흐름 노드 (실제 경로 기계 좌표)
  const nodes: [number, number, number][] = [];
  if (routeUnitId) {
    routeMachines(d, routeUnitId).forEach((m) => {
      const p = machineFloorPos(d, m.machine_id);
      if (p) nodes.push(p);
    });
  }

  // 원인 기계 → 영향 기계 전파 흐름 (실제 기계 좌표)
  const propNodes: [number, number, number][] =
    showProblem && lr
      ? lr.propagation
          .map((p) => machineFloorPos(d, p.machine_id))
          .filter((p): p is [number, number, number] => p !== null)
      : [];

  return (
    <group>
      {/* 원인 → 영향 전파 흐름(주황 빛) */}
      {propNodes.length >= 2 ? <FlowTrack nodes={propNodes} color={IMPACT} /> : null}

      {/* UNIT 공정 흐름 */}
      {nodes.length >= 2 ? (
        <group>
          <FlowTrack nodes={nodes} />
          <Html position={[nodes[0][0], PLAT_TOP + 0.9, nodes[0][2]]} center distanceFactor={11}>
            <div className="pointer-events-none whitespace-nowrap rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              {routeUnitId} 공정 흐름
            </div>
          </Html>
        </group>
      ) : null}
    </group>
  );
}

function Zone({
  d,
  x,
  areaLabel,
  focused,
  anyFocus,
  selectedMachineId,
  routeUnitId,
  revealCauseId,
  onZoneClick,
  onMachineClick,
}: {
  d: DistrictOverview;
  x: number;
  areaLabel: string;
  focused: boolean;
  anyFocus: boolean;
  selectedMachineId: string | null;
  routeUnitId: string | null;
  revealCauseId: string | null;
  onZoneClick: () => void;
  onMachineClick: (m: OverviewMachine) => void;
}) {
  const dimmed = anyFocus && !focused;
  const tone = focused ? ZONE_TONE_SELECTED : dimmed ? ZONE_TONE_DIM : ZONE_TONE;
  const lanes = STEPS.map((step) => ({ step, list: d.machines.filter((m) => m.step === step) }));
  const routeIds = focused && routeUnitId ? routeMachineIds(d, routeUnitId) : null;
  // 영향 장비 확인하기를 눌러 revealCauseId가 이 구역의 원인 기계와 일치할 때만 전파 표시
  const problem =
    focused && !routeUnitId && revealCauseId &&
    d.latest_reschedule?.propagation.some((p) => p.role === 'cause' && p.machine_id === revealCauseId)
      ? d.latest_reschedule
      : null;
  const causeId = problem ? revealCauseId : null;
  const impactIds = new Set((problem?.propagation ?? []).filter((p) => p.role === 'impact').map((p) => p.machine_id));

  return (
    <group
      position={[x, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onZoneClick();
      }}
      onPointerOver={(e) => e.stopPropagation()}
    >
      <group position={[0, focused ? LIFT : 0, 0]}>
        <RoundedBox args={[ZONE_W + 0.24, BASE_TOP, ZONE_D + 0.24]} radius={0.05} smoothness={3} position={[0, BASE_TOP / 2, 0]}>
          <meshStandardMaterial color={focused ? '#dfe2e7' : '#b9bdc4'} roughness={0.7} metalness={0.05} />
        </RoundedBox>

        {/* 스텝별 독립 베이(패드) */}
        {STEPS.map((s, li) => (
          <group key={`pad-${s}`} position={[0, 0, laneZ(li)]}>
            <RoundedBox
              args={[ZONE_W - 0.3, PLAT_TOP - BASE_TOP, CELL_Z - 0.34]}
              radius={0.05}
              smoothness={3}
              position={[0, (PLAT_TOP + BASE_TOP) / 2, 0]}
            >
              <meshStandardMaterial
                color={tone}
                roughness={0.5}
                metalness={0.1}
                envMapIntensity={focused ? 1.1 : 0.7}
                emissive={focused ? '#ffffff' : '#000000'}
                emissiveIntensity={focused ? 0.26 : 0}
              />
            </RoundedBox>
            <RoundedBox args={[0.5, 0.06, 0.6]} radius={0.03} smoothness={3} position={[-ZONE_W / 2 + 0.42, PLAT_TOP + 0.03, 0]}>
              <meshStandardMaterial color="#5f646d" roughness={0.6} metalness={0.15} />
            </RoundedBox>
          </group>
        ))}
        {/* 스텝 사이 컨베이어 (A→B→C→D) */}
        {[0, 1, 2].map((b) => (
          <StepConveyor key={`scv-${b}`} z={laneZ(b) + CELL_Z / 2} />
        ))}

        {lanes.map((lane, li) => (
          <group key={lane.step} position={[0, PLAT_TOP, laneZ(li)]}>
            <Text
              position={[-ZONE_W / 2 + 0.42, 0.064, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.34}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {lane.step}
            </Text>
            {lane.list.map((m, ci) => {
              const sel = selectedMachineId === m.machine_id;
              const isCause = causeId === m.machine_id;
              const isImpact = impactIds.has(m.machine_id);
              const onRoute = routeIds?.has(m.machine_id) ?? false;

              let bodyColor = G2;
              let bodyEmissive = '#000000';
              let bodyEmissiveI = 0;
              let tag: { text: string; cls: string } | null = null;
              if (isCause) {
                bodyColor = '#ffdede';
                bodyEmissive = CAUSE;
                bodyEmissiveI = 0.42;
                tag = { text: '위험 장비', cls: 'bg-rose-500' };
              } else if (isImpact) {
                bodyColor = '#ffe9c9';
                bodyEmissive = IMPACT;
                bodyEmissiveI = 0.34;
                tag = { text: '영향 예상', cls: 'bg-amber-500' };
              } else if (sel) {
                bodyColor = '#ffffff';
                bodyEmissive = '#ffffff';
                bodyEmissiveI = 0.2;
              } else if (onRoute) {
                bodyColor = '#dbe4ff';
                bodyEmissive = ROUTE;
                bodyEmissiveI = 0.3;
              }
              // 흐름 볼 때는 선택 기계도 경로 높이(0.34)로 — 흐름이 몸통을 관통하지 않게
              const targetY = sel && !routeUnitId ? 0.62 : isCause || isImpact || onRoute || sel ? 0.34 : 0;
              // UNIT 흐름 볼 때 경로 외 기기는 흐리게(inactive)
              const inactive = !!routeUnitId && !onRoute && !sel;

              return (
                <LiftMachine
                  key={m.machine_id}
                  x={machineX(ci, lane.list.length)}
                  targetY={targetY}
                  focused={focused}
                  onClick={() => (focused ? onMachineClick(m) : onZoneClick())}
                >
                  <MiniMachine
                    status={m.machine_status}
                    bodyColor={bodyColor}
                    bodyEmissive={bodyEmissive}
                    bodyEmissiveI={bodyEmissiveI}
                    inactive={inactive}
                  />
                  {tag ? (
                    <Html position={[0, 1, 0]} center distanceFactor={9}>
                      <div className={`pointer-events-none flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow ${tag.cls}`}>
                        {tag.text} · {m.machine_id}
                      </div>
                    </Html>
                  ) : sel ? (
                    <Html position={[0, 1, 0]} center distanceFactor={9}>
                      <div className="pointer-events-none whitespace-nowrap rounded bg-secondary-navy px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        {m.machine_id}
                      </div>
                    </Html>
                  ) : null}
                </LiftMachine>
              );
            })}
          </group>
        ))}

        {focused ? <FocusOverlays d={d} routeUnitId={routeUnitId} showProblem={!!problem} /> : null}
      </group>

      <Html position={[0, focused ? 2.7 : 2.15, 0]} center distanceFactor={13}>
        <div
          className={`pointer-events-none whitespace-nowrap rounded-md border px-2 py-1 text-center backdrop-blur-sm transition ${
            focused
              ? 'border-secondary-navy bg-secondary-navy text-white shadow-[0_10px_26px_rgba(8,16,40,0.35)]'
              : dimmed
                ? 'border-white/40 bg-white/55 opacity-70'
                : 'border-white/50 bg-white/70'
          }`}
        >
          <div className={`text-[12px] font-extrabold leading-none ${focused ? 'text-white' : 'text-secondary-navy'}`}>
            {areaLabel}
          </div>
        </div>
      </Html>
    </group>
  );
}

function Conveyor({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[GAP + 0.2, 0.1, ZONE_D - 0.6]} radius={0.04} smoothness={3} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#828892" roughness={0.45} metalness={0.35} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[GAP + 0.2, 0.12, 0.08]} radius={0.03} smoothness={2} position={[0, 0.1, s * ((ZONE_D - 0.6) / 2)]}>
          <meshStandardMaterial color="#5f646d" roughness={0.4} metalness={0.4} />
        </RoundedBox>
      ))}
      {[-0.24, 0.18].map((dx) => (
        <mesh key={dx} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[dx, 0.11, 0]}>
          <coneGeometry args={[0.16, 0.28, 3]} />
          <meshStandardMaterial color="#d7dadf" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** 구역 안 스텝 사이 컨베이어 (A→B→C→D, +Z 방향) */
function StepConveyor({ z }: { z: number }) {
  const beltY = PLAT_TOP - 0.05;
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[1.15, 0.1, 0.55]} radius={0.03} smoothness={3} position={[0, beltY, 0]}>
        <meshStandardMaterial color="#828892" roughness={0.45} metalness={0.35} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.08, 0.12, 0.55]} radius={0.02} smoothness={2} position={[s * 0.57, beltY + 0.02, 0]}>
          <meshStandardMaterial color="#5f646d" roughness={0.4} metalness={0.4} />
        </RoundedBox>
      ))}
      {[-0.13, 0.13].map((dz) => (
        <mesh key={dz} rotation={[Math.PI / 2, 0, 0]} position={[0, beltY + 0.07, dz]}>
          <coneGeometry args={[0.13, 0.22, 3]} />
          <meshStandardMaterial color="#d7dadf" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function Rig({ focusX }: { focusX: number | null }) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (focusX === null) c.setLookAt(0, 8, 17, 0, 0.4, 0, true);
    else c.setLookAt(focusX + 0.4, 4.4, 8.5, focusX, 0.7, 0, true);
  }, [focusX]);
  return (
    <CameraControls ref={controls} makeDefault minDistance={4} maxDistance={28} minPolarAngle={0.35} maxPolarAngle={1.35} />
  );
}

/** 공정 파이프라인 — 줌인 드릴다운 + 문제 위치/공정 순서 시각화 */
export function FactoryMonitor3D({
  districts,
  focusedId,
  selectedMachineId,
  routeUnitId,
  revealCauseId,
  onZoneClick,
  onMachineClick,
}: {
  districts: DistrictOverview[];
  focusedId: string | null;
  selectedMachineId: string | null;
  routeUnitId: string | null;
  revealCauseId: string | null;
  onZoneClick: (id: string) => void;
  onMachineClick: (m: OverviewMachine) => void;
}) {
  const n = districts.length;
  const totalW = n * ZONE_W + (n - 1) * GAP;
  const zoneX = (i: number) => zoneXOf(i, n);
  const focusIdx = focusedId ? districts.findIndex((d) => d.district_id === focusedId) : -1;
  const focusX = focusIdx >= 0 ? zoneX(focusIdx) : null;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#eceef1] via-[#f4f5f7] to-[#dde0e5]">
      <Canvas camera={{ position: [0, 8, 17], fov: 36 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.62} />
        <directionalLight position={[6, 11, 6]} intensity={0.5} />
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 6, 4]} scale={[18, 12, 1]} color="#ffffff" />
          <Lightformer intensity={0.6} position={[-9, 3, -4]} scale={[8, 8, 1]} color="#ffffff" />
          <Lightformer intensity={0.5} position={[9, 3, -4]} scale={[8, 8, 1]} color="#ffffff" />
        </Environment>

        {districts.map((d, i) => (
          <Zone
            key={d.district_id}
            d={d}
            x={zoneX(i)}
            areaLabel={`구역 ${String.fromCharCode(65 + i)}`}
            focused={focusedId === d.district_id}
            anyFocus={focusedId !== null}
            selectedMachineId={selectedMachineId}
            routeUnitId={routeUnitId}
            revealCauseId={revealCauseId}
            onZoneClick={() => onZoneClick(d.district_id)}
            onMachineClick={onMachineClick}
          />
        ))}

        {districts.slice(0, -1).map((d, i) => (
          <Conveyor key={`cv-${d.district_id}`} x={zoneX(i) + ZONE_W / 2 + GAP / 2} />
        ))}

        <ContactShadows position={[0, 0, 0]} scale={totalW + 6} blur={2.4} opacity={0.3} far={9} color="#1f2937" />
        <Rig focusX={focusX} />
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex max-w-[60%] flex-wrap items-center justify-end gap-x-3 gap-y-1 rounded-2xl border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-gray-500 shadow-sm backdrop-blur">
        <span className="text-gray-400">가동</span>
        {STATUS_LEGEND.map((status) => (
          <span key={status} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_HEX[status] }} />
            {status}
          </span>
        ))}
        {focusedId ? (
          <>
            <span className="mx-1 h-3 w-px bg-gray-300" />
            {routeUnitId ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-3.5 rounded-sm" style={{ backgroundColor: ROUTE }} />
                  공정 흐름
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: ROUTE }} />
                  경로 기계
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAUSE }} />
                  원인 발생 기계
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: IMPACT }} />
                  영향 예상 기계
                </span>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
