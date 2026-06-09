import type { ReactNode } from 'react';

interface CircularProgressProps {
  /** 진행률 0~100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  className?: string;
}

/** 원형 진행 차트. 색상은 디자인 토큰(primary) 사용. 가운데에 children 표시. */
export function CircularProgress({
  value,
  size = 112,
  strokeWidth = 12,
  children,
  className = '',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          className="stroke-gray-200"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
