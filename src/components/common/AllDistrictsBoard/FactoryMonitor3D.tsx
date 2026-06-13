import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef, type ReactNode } from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import {
  CameraControls,
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  RoundedBox,
} from '@react-three/drei';
import { Color, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';

import type { DistrictOverview, OverviewMachine, OverviewMachineStatus, ProcessStep } from '@/mocks/districtOverview';
import Machine, { type MachineDatum } from '@/components/three/MachineFleet/Machine';

const ZONE_TONE = '#ced2d9';
const ZONE_TONE_DIM = '#bcc0c7';
const ZONE_TONE_SELECTED = '#f7f8fa';
const CAUSE = '#ef4444'; // 원인(빨강)
const IMPACT = '#f59e0b'; // 영향 예상(주황)
const ROUTE = '#2563eb'; // 공정 순서(파랑)


const STATUS_HEX: Record<OverviewMachineStatus, string> = {
  가동중: '#22c55e',
  점검중: '#f59e0b',
  정지: '#94a3b8',
  장애: '#ef4444',
};

const STATUS_LEGEND: OverviewMachineStatus[] = ['가동중', '점검중', '정지', '장애'];
const STEPS: ProcessStep[] = ['A', 'B', 'C', 'D'];
const STEP_INFO: Record<ProcessStep, string> = {
  A: 'Input / Loading',
  B: 'Processing',
  C: 'Inspection',
  D: 'Output / Packing',
};

const ZONE_W = 6.0;
const ZONE_D = 8.4; // Step 간 거리 확대
const GAP = 1.3;
const BASE_TOP = 0.16;
const PLAT_TOP = 0.34;
const LIFT = 0.16;
const CELL_X = 0.86;
const CELL_Z = 1.95; // Step(레인) 간격 확대
const MACHINE_SCALE = 1.15;
// 흐름 높이: 기계 몸체 높이로 통과(불투명이라 기계가 가리면 가려지고, 앞이면 덮음).
const FLOW_Y = PLAT_TOP + 0.5;

const zoneXOf = (i: number, n: number) => {
  const totalW = n * ZONE_W + (n - 1) * GAP;
  return -totalW / 2 + ZONE_W / 2 + i * (ZONE_W + GAP);
};

const laneZ = (li: number) => (li - (STEPS.length - 1) / 2) * CELL_Z;
const machineX = (col: number, len: number) => (col - (len - 1) / 2) * CELL_X + 0.85;
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

/** OverviewMachine → 구역 상세 Machine 입력 */
function toDatum(m: OverviewMachine): MachineDatum {
  return {
    machine_id: m.machine_id,
    machine_type: '',
    machine_status:
      m.machine_status === '가동중' ? '가동중' : m.machine_status === '점검중' ? '점검중' : '대기중',
    avg_utilization_rate: m.utilization,
    active_unit_id: m.active_unit,
  };
}

const RED_TINT = new Color('#df8585');

/** 공정 장비 1대 — 구역 상세 Machine 그대로.
 *  정지/장애는 장비 자체를 연한 빨강으로, route dim 이면 흐리게(반투명). 머티리얼을 직접 조작. */
function MiniMachine({
  machine,
  down,
  dim,
  active,
}: {
  machine: OverviewMachine;
  down: boolean;
  dim: boolean;
  active: boolean;
}) {
  const ref = useRef<Group>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as MeshStandardMaterial;
      if (!mat || !mat.color) return;
      if (mat.userData.base === undefined) {
        mat.userData.base = mat.color.clone();
        mat.userData.baseOpacity = mat.opacity;
        mat.userData.baseTransparent = mat.transparent;
      }
      const base = mat.userData.base as Color;
      mat.color.copy(base);
      if (down) mat.color.lerp(RED_TINT, 0.5);
      if (dim) {
        mat.transparent = true;
        mat.opacity = 0.14;
        mat.depthWrite = false;
      } else {
        mat.transparent = mat.userData.baseTransparent as boolean;
        mat.opacity = mat.userData.baseOpacity as number;
        mat.depthWrite = true;
      }
      mat.needsUpdate = true;
    });
  }, [down, dim]);

  return (
    <group ref={ref} scale={0.16}>
      <Machine data={toDatum(machine)} position={[0, 0, 0]} active={active} />
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
  const routeDim = focused && !!routeUnitId; // 유닛 경로 볼 때 바닥/컨베이어 흐리게
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

        {/* 스텝별 독립 베이(패드) — 차콜 라벨판 제거 */}
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
                transparent={routeDim}
                opacity={routeDim ? 0.4 : 1}
              />
            </RoundedBox>
          </group>
        ))}
        {/* 스텝을 잇는 연속 롤러 컨베이어 (A→B→C→D) */}
        <ZoneConveyor dim={routeDim} />

        {lanes.map((lane, li) => (
          <group key={lane.step} position={[0, PLAT_TOP, laneZ(li)]}>
            {/* 구역 줌인 시 Step 카드 */}
            {focused ? (
              <Html position={[-ZONE_W / 2 - 0.55, 0.5, 0]} center distanceFactor={10} zIndexRange={[14, 0]}>
                <div
                  style={{ pointerEvents: 'none' }}
                  className="whitespace-nowrap rounded-lg border border-white/70 bg-white/90 px-2 py-1 text-center shadow-md backdrop-blur"
                >
                  <div className="text-[11px] font-extrabold leading-none text-secondary-navy">
                    Step {lane.step}
                  </div>
                  <div className="mt-0.5 text-[9px] font-medium text-gray-400">
                    {STEP_INFO[lane.step]}
                  </div>
                </div>
              </Html>
            ) : null}
            {lane.list.map((m, ci) => {
              const sel = selectedMachineId === m.machine_id;
              const isCause = causeId === m.machine_id;
              const isImpact = impactIds.has(m.machine_id);
              const onRoute = routeIds?.has(m.machine_id) ?? false;

              const down = m.machine_status === '정지' || m.machine_status === '장애';
              // 유닛 공정 흐름 볼 때: 경로 외 장비는 흐리게(숨기지 않음)
              const dim = !!routeUnitId && !onRoute && !sel;
              let tag: { text: string; cls: string } | null = null;
              if (isCause) tag = { text: '위험 장비', cls: 'bg-rose-500' };
              else if (isImpact) tag = { text: '영향 예상', cls: 'bg-amber-500' };
              const active = sel || onRoute || isCause || isImpact;
              // 흐름 볼 때는 선택 기계도 경로 높이(0.34)로 — 흐름이 몸통을 관통하지 않게
              const targetY = sel && !routeUnitId ? 0.62 : isCause || isImpact || onRoute || sel ? 0.34 : 0;

              return (
                <LiftMachine
                  key={m.machine_id}
                  x={machineX(ci, lane.list.length)}
                  targetY={targetY}
                  focused={focused}
                  onClick={() => (focused ? onMachineClick(m) : onZoneClick())}
                >
                  <MiniMachine machine={m} down={down} dim={dim} active={active} />
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

      {/* 구역 벽 (공장 룸) */}
      <ZoneWalls />

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

// 벽 높이/색
const WALL_H = 1.4;
const WALL_T = 0.16;
const DOOR_W = 1.7;

/** 구역 외곽 벽 (정면/후면 전체 + 좌/우 벽은 복도 쪽 출입구) */
function WallSeg({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#d4dae3" roughness={0.85} metalness={0.08} />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.02, 0]}>
        <boxGeometry args={[size[0] + 0.03, 0.05, size[2] + 0.03]} />
        <meshStandardMaterial color="#aebccd" emissive="#aebccd" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ZoneWalls() {
  const halfX = ZONE_W / 2 + 0.12;
  const halfZ = ZONE_D / 2 + 0.12;
  const sideSeg = (ZONE_D + 0.24 - DOOR_W) / 2; // 좌/우 벽 한 토막 길이(출입구 제외)
  const segOff = DOOR_W / 2 + sideSeg / 2;
  return (
    <group>
      {/* 후면 / 정면(Z 벽, 전체) */}
      <WallSeg position={[0, WALL_H / 2, -halfZ]} size={[ZONE_W + 0.24, WALL_H, WALL_T]} />
      <WallSeg position={[0, WALL_H / 2, halfZ]} size={[ZONE_W + 0.24, WALL_H, WALL_T]} />
      {/* 좌/우(X 벽) — 복도 쪽 출입구를 위해 2토막 */}
      {[-halfX, halfX].map((x) => (
        <group key={x}>
          <WallSeg position={[x, WALL_H / 2, -segOff]} size={[WALL_T, WALL_H, sideSeg]} />
          <WallSeg position={[x, WALL_H / 2, segOff]} size={[WALL_T, WALL_H, sideSeg]} />
        </group>
      ))}
    </group>
  );
}

/** 구역 사이 복도 — 사람이 지나가는 통로 (밝은 바닥 + 중앙 점선) */
function Corridor({ x }: { x: number }) {
  const dashCount = 5;
  return (
    <group position={[x, 0, 0]}>
      {/* 통로 바닥(살짝 밝게) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[GAP + 0.1, ZONE_D + 0.6]} />
        <meshStandardMaterial color="#f3f6fa" roughness={0.95} metalness={0.02} />
      </mesh>
      {/* 중앙 점선(보행 통로 표시) */}
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, (i - (dashCount - 1) / 2) * ((ZONE_D + 0.4) / dashCount)]}
        >
          <planeGeometry args={[0.1, 0.34]} />
          <meshStandardMaterial color="#c4ccd6" />
        </mesh>
      ))}
    </group>
  );
}

/** 스텝을 잇는 연속 롤러 컨베이어 — 구역 좌측에서 A→B→C→D(+Z)로 관통.
 *  프레임 + 가로 롤러 + 다리 (스크린샷 롤러 컨베이어 참고, 박스 없음, 정적) */
function ZoneConveyor({ dim }: { dim: boolean }) {
  const cx = -ZONE_W / 2 + 0.62;
  const len = ZONE_D - 0.3; // Z 길이(구역 거의 전체)
  const w = 0.66; // X 폭
  const topY = PLAT_TOP - 0.02;
  const rollerN = Math.round(len / 0.34);
  const o = (v: number) => (dim ? v * 0.4 : v); // route dim
  return (
    <group position={[cx, 0, 0]}>
      {/* 벨트 프레임 상판 */}
      <RoundedBox args={[w, 0.05, len]} radius={0.02} smoothness={2} position={[0, topY, 0]}>
        <meshStandardMaterial color="#c4ccd6" roughness={0.4} metalness={0.5} transparent={dim} opacity={o(1)} />
      </RoundedBox>
      {/* 좌우 사이드 레일 (Z 방향) */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.07, 0.16, len]}
          radius={0.02}
          smoothness={2}
          position={[s * (w / 2 + 0.02), topY + 0.06, 0]}
        >
          <meshStandardMaterial color="#8b95a1" roughness={0.35} metalness={0.55} transparent={dim} opacity={o(1)} />
        </RoundedBox>
      ))}
      {/* 가로 롤러 (축은 X) — Z를 따라 촘촘히 */}
      {Array.from({ length: rollerN }).map((_, i) => {
        const z = (i - (rollerN - 1) / 2) * (len / rollerN);
        return (
          <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[0, topY + 0.05, z]}>
            <cylinderGeometry args={[0.045, 0.045, w + 0.04, 12]} />
            <meshStandardMaterial color="#aab4c0" roughness={0.3} metalness={0.65} transparent={dim} opacity={o(1)} />
          </mesh>
        );
      })}
      {/* 다리 (지지대) */}
      {[-1, 1].map((s) =>
        [0, 1, 2, 3].map((j) => {
          const z = (j - 1.5) * (len / 4);
          return (
            <mesh key={`${s}-${j}`} position={[s * (w / 2 - 0.04), topY / 2, z]}>
              <cylinderGeometry args={[0.035, 0.035, topY, 10]} />
              <meshStandardMaterial color="#6b7280" roughness={0.45} metalness={0.5} transparent={dim} opacity={o(1)} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function Rig({ focusX }: { focusX: number | null }) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (focusX === null) c.setLookAt(0, 11, 22, 0, 0.4, 0, true);
    else c.setLookAt(focusX + 0.5, 7, 14, focusX, 0.9, 0, true);
  }, [focusX]);
  return (
    <CameraControls ref={controls} makeDefault minDistance={4} maxDistance={34} minPolarAngle={0.35} maxPolarAngle={1.35} />
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

        {/* 공장 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
          <planeGeometry args={[totalW + 14, ZONE_D + 10]} />
          <meshStandardMaterial color="#e9edf2" roughness={0.96} metalness={0.03} />
        </mesh>

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
          <Corridor key={`cv-${d.district_id}`} x={zoneX(i) + ZONE_W / 2 + GAP / 2} />
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
