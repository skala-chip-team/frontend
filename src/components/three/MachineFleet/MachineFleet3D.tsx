import { useEffect, useRef, type ReactNode } from 'react';

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

import { Scene } from '../Scene';

export type Triplet = [number, number, number];

type OrbitLike = { target: Vector3; update: () => void };

interface MachineFleet3DProps {
  /** 초기 카메라 위치 */
  cameraPosition: Triplet;
  /** 카메라가 이동할 목표 위치 */
  focusPosition: Triplet;
  /** 카메라가 바라볼 지점 */
  focusTarget: Triplet;
  /** 값이 바뀌면 카메라 이동 애니메이션을 다시 시작한다 */
  focusKey: string;
  /** true면 애니메이션 없이 즉시 이동(스냅) — step 전환처럼 화면 밖에서 바꿀 때 사용 */
  focusInstant?: boolean;
  /** 씬에 배치할 3D 컴포넌트 */
  children: ReactNode;
  className?: string;
}

/** focusKey가 바뀔 때 카메라를 focusPosition/Target으로 이동시킨다. (instant면 즉시 스냅) */
function CameraRig({
  position,
  target,
  animKey,
  instant,
}: {
  position: Triplet;
  target: Triplet;
  animKey: string;
  instant: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  const animating = useRef(false);
  const desiredPosition = useRef(new Vector3(...position));
  const desiredTarget = useRef(new Vector3(...target));

  useEffect(() => {
    desiredPosition.current.set(...position);
    desiredTarget.current.set(...target);

    if (instant && controls) {
      camera.position.copy(desiredPosition.current);
      controls.target.copy(desiredTarget.current);
      controls.update();
      animating.current = false;
    } else {
      animating.current = true;
    }
    // focusKey(선택/해제/step 전환) 변경 시에만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  useFrame(() => {
    if (!controls || !animating.current) {
      return;
    }

    camera.position.lerp(desiredPosition.current, 0.1);
    controls.target.lerp(desiredTarget.current, 0.1);
    controls.update();

    if (camera.position.distanceTo(desiredPosition.current) < 0.05) {
      camera.position.copy(desiredPosition.current);
      controls.target.copy(desiredTarget.current);
      controls.update();
      animating.current = false;
    }
  });

  return null;
}

/**
 * 장비 플릿 3D 씬의 기본 세팅만 담당한다.
 * (캔버스 · 조명 · OrbitControls · 카메라 이동)
 * 실제 장비/오버레이 등은 children으로 주입한다. 배경은 투명.
 */
export default function MachineFleet3D({
  cameraPosition,
  focusPosition,
  focusTarget,
  focusKey,
  focusInstant = false,
  children,
  className,
}: MachineFleet3DProps) {
  return (
    <Scene className={className} controls={false} cameraPosition={cameraPosition}>
      {/* 배경은 투명 — 뒤의 대시보드 배경(surface-50)이 그대로 보이도록 한다. */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 12, 6]} intensity={1.5} castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.55} />

      {children}

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={6}
        maxDistance={30}
      />
      <CameraRig
        position={focusPosition}
        target={focusTarget}
        animKey={focusKey}
        instant={focusInstant}
      />
    </Scene>
  );
}
