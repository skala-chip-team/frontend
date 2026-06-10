import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { type MachineDatum } from './Machine';
import { FleetMachine } from './FleetMachine';
import MachineFleet3D, { type Triplet } from './MachineFleet3D';
import { MachineDetailPanel } from './MachineDetailPanel';
import { MachineQueueCard, type FleetQueue } from './MachineQueueCard';

const MACHINE_OFFSET: Triplet = [-1.85, -0.44, 0];
// 장비를 일정 간격의 대각선 라인에 배치. 개수만큼 위치를 생성한다.
const MACHINE_START: Triplet = [1.6, -0.42, -2.55];
const MACHINE_STEP: Triplet = [3.55, 0, 2.55];

function machinePositions(count: number): Triplet[] {
  return Array.from(
    { length: Math.max(0, count) },
    (_, i): Triplet => [
      MACHINE_START[0] + MACHINE_STEP[0] * i,
      MACHINE_START[1] + MACHINE_STEP[1] * i,
      MACHINE_START[2] + MACHINE_STEP[2] * i,
    ]
  );
}

const SLIDE_MS = 320;

// 카메라가 장비 라인을 바라보는 고정 3/4 측면 각도(방향 단위벡터)
const VIEW_DIRECTION = ((): Triplet => {
  const raw: Triplet = [-6.1, 5.4, 15.8];
  const length = Math.hypot(...raw);
  return [raw[0] / length, raw[1] / length, raw[2] / length];
})();

// 장비 개수에 따른 기본 줌 거리.
// 개수를 3개 단위 버킷(1~3, 4~6, …)으로 묶어 같은 버킷이면 같은 줌을 쓴다.
// 버킷 대표 개수 = 2, 5, 8 … → 1~3개는 "2대일 때" 줌으로 보인다.
const ZOOM_BASE_DISTANCE = 7.5;
const ZOOM_PER_MACHINE = 4.5;
const ZOOM_BUCKET_SIZE = 3;

function zoomDistanceForCount(machineCount: number) {
  const bucket = Math.max(1, Math.ceil(machineCount / ZOOM_BUCKET_SIZE));
  const representative = bucket * ZOOM_BUCKET_SIZE - 1;
  return ZOOM_BASE_DISTANCE + ZOOM_PER_MACHINE * (representative - 1);
}

function machineWorldPosition(pos: Triplet): Triplet {
  return [pos[0] + MACHINE_OFFSET[0], pos[1] + MACHINE_OFFSET[1], pos[2] + MACHINE_OFFSET[2]];
}

/** 장비 위치 목록으로 기본 카메라 뷰를 계산한다. (좌측 대기열 카드와 겹치지 않게 타깃을 약간 왼쪽으로) */
function defaultFleetView(localPositions: Triplet[]): { position: Triplet; target: Triplet } {
  const source = localPositions.length > 0 ? localPositions : machinePositions(1);
  const count = source.length;
  const positions = source.map(machineWorldPosition);

  const centroid = positions.reduce<Triplet>(
    (acc, [x, y, z]) => [acc[0] + x / count, acc[1] + y / count, acc[2] + z / count],
    [0, 0, 0]
  );

  const target: Triplet = [centroid[0] - 2.0, centroid[1] + 2.2, centroid[2]];
  const distance = zoomDistanceForCount(count);

  return {
    target,
    position: [
      target[0] + VIEW_DIRECTION[0] * distance,
      target[1] + VIEW_DIRECTION[1] * distance,
      target[2] + VIEW_DIRECTION[2] * distance,
    ],
  };
}

type SlidePhase = 'idle' | 'exit' | 'prep' | 'enter';

interface MachineFleetBoardProps {
  machines: MachineDatum[];
  queue?: FleetQueue;
  /** step 전환 슬라이드 방향: 1=새 화면이 오른쪽에서, -1=왼쪽에서 */
  slideDirection?: 1 | -1;
  /** 하단에 표시할 패널(예: 스케줄 간트) */
  bottomPanel?: ReactNode;
  className?: string;
}

/**
 * 장비 플릿 대시보드 보드.
 * 3D 씬 + 대기열 카드 + 상세 패널 + 하단 패널을 조합한다.
 * machines prop이 바뀌면(=step 전환) **3D 캔버스만** 가로로 슬라이드시키고,
 * 캔버스는 remount하지 않고 화면 밖에서 장비만 교체해 깜빡임을 없앤다.
 */
export default function MachineFleetBoard({
  machines,
  queue,
  slideDirection = 1,
  bottomPanel,
  className = '',
}: MachineFleetBoardProps) {
  // 실제로 그려지는 장비(버퍼). 슬라이드 도중 화면 밖에서 교체된다.
  const [displayedMachines, setDisplayedMachines] = useState(machines);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [slide, setSlide] = useState<{ phase: SlidePhase; dir: 1 | -1 }>({ phase: 'idle', dir: 1 });
  const [cameraSnap, setCameraSnap] = useState(false);
  // step 전환 판별은 "장비 구성(머신 id 집합)"으로 한다. 같은 step의 데이터 갱신(폴링)으로
  // machines 참조만 바뀌는 경우엔 슬라이드를 돌리지 않는다.
  const prevKeyRef = useRef(machines.map((m) => m.machine_id).join('|'));

  // machines 변경 감지 → step 전환이면 슬라이드, 같은 step 데이터 갱신이면 즉시 반영
  useEffect(() => {
    const key = machines.map((m) => m.machine_id).join('|');
    if (key === prevKeyRef.current) {
      // 같은 step: 슬라이드 없이 현재선/상태/큐만 갱신
      setDisplayedMachines(machines);
      return;
    }
    prevKeyRef.current = key;

    const dir = slideDirection;
    setSlide({ phase: 'exit', dir }); // 현재 캔버스를 화면 밖으로 밀어냄

    const swapTimer = window.setTimeout(() => {
      setDisplayedMachines(machines); // 화면 밖에서 장비 교체(캔버스는 유지)
      setSelectedCode(null);
      setCameraSnap(true); // 새 뷰로 카메라 즉시 스냅
      setSlide({ phase: 'prep', dir }); // 반대쪽 화면 밖으로 순간이동(transition 없음)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setSlide({ phase: 'enter', dir }))
      );
      window.setTimeout(() => {
        setSlide({ phase: 'idle', dir });
        setCameraSnap(false);
      }, SLIDE_MS + 40);
    }, SLIDE_MS);

    return () => window.clearTimeout(swapTimer);
  }, [machines, slideDirection]);

  // 장비 전부 표시(개수만큼 위치 생성)
  const displayedList = displayedMachines;
  const positions = useMemo(() => machinePositions(displayedList.length), [displayedList.length]);

  const selectedMachine = useMemo(
    () => displayedList.find((machine) => machine.machine_id === selectedCode) ?? null,
    [displayedList, selectedCode]
  );
  const isSelecting = selectedCode !== null;

  const cardPositions = useMemo(
    () => positions.map(([x, , z]) => [x, 4.2, z + 0.08] as Triplet),
    [positions]
  );
  const defaultView = useMemo(() => defaultFleetView(positions), [positions]);

  // 선택된 장비로 줌인 / 미선택 시 기본 뷰
  const camera = useMemo(() => {
    const index = displayedList.findIndex((machine) => machine.machine_id === selectedCode);

    if (index < 0 || !positions[index]) {
      const key = `default:${displayedList.map((machine) => machine.machine_id).join('|')}`;
      return { key, position: defaultView.position, target: defaultView.target };
    }

    const [px, py, pz] = positions[index];
    const mx = px + MACHINE_OFFSET[0];
    const my = py + MACHINE_OFFSET[1];
    const mz = pz + MACHINE_OFFSET[2];

    return {
      key: selectedCode ?? 'default',
      target: [mx + 2.2, my + 2.6, mz] as Triplet,
      position: [mx + 2.2, my + 4.4, mz + 9] as Triplet,
    };
  }, [displayedList, selectedCode, defaultView, positions]);

  const translateX =
    slide.phase === 'exit'
      ? `${-slide.dir * 100}%`
      : slide.phase === 'prep'
        ? `${slide.dir * 100}%`
        : '0%';

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* 3D 캔버스만 슬라이드 */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`h-full w-full ${
              slide.phase === 'prep' ? 'transition-none' : 'transition-transform duration-300 ease-out'
            }`}
            style={{ transform: `translateX(${translateX})` }}
          >
            <MachineFleet3D
              cameraPosition={defaultView.position}
              focusPosition={camera.position}
              focusTarget={camera.target}
              focusKey={camera.key}
              focusInstant={cameraSnap}
            >
              <group position={MACHINE_OFFSET}>
                {displayedList.map((machine, index) => (
                  <FleetMachine
                    key={machine.machine_id}
                    data={machine}
                    position={positions[index] ?? [index * 2.4, 0, 0]}
                    cardPosition={cardPositions[index] ?? [0, 0, 0]}
                    cardHidden={isSelecting}
                    onSelect={setSelectedCode}
                  />
                ))}
              </group>
            </MachineFleet3D>
          </div>
        </div>

        {/* 고정 오버레이 — 슬라이드되지 않음 */}
        {queue && queue.waiting_units.length > 0 ? (
          <div
            className={`pointer-events-none absolute left-5 top-14 z-10 transition-all duration-500 ease-out ${
              isSelecting ? '-translate-x-[130%] opacity-0' : 'translate-x-0 opacity-100'
            }`}
          >
            <MachineQueueCard queue={queue} />
          </div>
        ) : null}

        <MachineDetailPanel
          machine={selectedMachine}
          open={isSelecting}
          onClose={() => setSelectedCode(null)}
        />
      </div>

      {bottomPanel ? <div className="shrink-0 px-4 pb-4 pt-0">{bottomPanel}</div> : null}
    </div>
  );
}
