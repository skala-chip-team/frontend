import { useEffect, useState } from 'react';

/**
 * 무거운 컴포넌트(3D 캔버스 등)의 마운트를 새 화면이 페인트된 다음으로 미룬다.
 * 라우트 진입 커밋에는 가벼운 placeholder만 들어가므로 사이드바 등 다른 UI가
 * 먼저 즉시 반응하고, 무거운 마운트는 두 프레임 뒤(페인트 이후)에 일어난다.
 *
 * @returns 마운트해도 되는 시점이면 true
 */
export function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    // 한 프레임: 현재 화면 페인트 → 다음 프레임: 무거운 마운트 트리거
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return ready;
}
