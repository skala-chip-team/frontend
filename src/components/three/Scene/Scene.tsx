import { Suspense, type ReactNode } from 'react';

import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

interface SceneProps {
  children: ReactNode;
  /** 카메라 초기 위치 */
  cameraPosition?: [number, number, number];
  /** OrbitControls 사용 여부 */
  controls?: boolean;
  className?: string;
}

/**
 * 3D 씬 공통 래퍼.
 * - DPR 상한으로 고해상도 디스플레이 과부하 방지
 * - 기본 ambient + directional 조명
 * - 바닥 ContactShadows
 * 색상은 직접 지정하지 않고 자식 메시가 디자인 토큰 색을 사용한다.
 */
export default function Scene({
  children,
  cameraPosition = [6, 4, 8],
  controls = true,
  className,
}: SceneProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      shadows
      gl={{ preserveDrawingBuffer: true, alpha: true }}
      camera={{ position: cameraPosition, fov: 45 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} castShadow />
      <Suspense fallback={null}>{children}</Suspense>
      <ContactShadows position={[0, -0.01, 0]} opacity={0.35} scale={20} blur={2.4} far={6} />
      {controls && (
        <OrbitControls
          enablePan={false}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={16}
        />
      )}
    </Canvas>
  );
}
