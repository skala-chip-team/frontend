import type { ReactNode } from 'react';

export type ChipVariant = 'soft' | 'solid' | 'subtle' | 'outline';
export type ChipColor = 'gray' | 'red' | 'orange' | 'amber' | 'emerald' | 'primary' | 'navy';
export type ChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 크기 프리셋 — 디자인이 같아도 크기는 자유롭게
const sizeMap: Record<ChipSize, string> = {
  xs: 'px-2 py-0.5 text-label-3',
  sm: 'px-2.5 py-0.5 text-label-3',
  md: 'px-3 py-1 text-label-3',
  lg: 'px-3.5 py-1.5 text-label-2',
  xl: 'px-4 py-2 text-label-2',
};

// soft: 연한 틴트 (장비 상태 배지와 동일 디자인) — bg-100 / text-800 / border-600·10
const softMap: Record<ChipColor, string> = {
  gray: 'border border-gray-300/70 bg-gray-100 text-gray-700',
  red: 'border border-red-600/10 bg-red-100 text-red-800',
  orange: 'border border-orange-600/10 bg-orange-100 text-orange-800',
  amber: 'border border-amber-600/10 bg-amber-100 text-amber-800',
  emerald: 'border border-emerald-600/10 bg-emerald-100 text-emerald-800',
  primary: 'border border-primary-200/60 bg-primary-100 text-primary-700',
  navy: 'border border-secondary-navy/15 bg-secondary-navy/10 text-secondary-navy',
};

// solid: 채움
const solidMap: Record<ChipColor, string> = {
  gray: 'bg-gray-500 text-white',
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  amber: 'bg-amber-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  primary: 'bg-primary-500 text-white',
  navy: 'bg-secondary-navy text-white',
};

// subtle: 더 연한 톤 (bg-50 / text-600)
const subtleMap: Record<ChipColor, string> = {
  gray: 'border border-gray-200 bg-gray-50 text-gray-500',
  red: 'border border-red-100 bg-red-50 text-red-600',
  orange: 'border border-orange-100 bg-orange-50 text-orange-600',
  amber: 'border border-amber-100 bg-amber-50 text-amber-600',
  emerald: 'border border-emerald-100 bg-emerald-50 text-emerald-600',
  primary: 'border border-primary-100 bg-primary-50 text-primary-600',
  navy: 'border border-secondary-navy/10 bg-secondary-navy/5 text-secondary-navy',
};

// outline: 중립(색상 무관)
const outlineClass = 'border border-gray-200 bg-surface-100 text-gray-600';

function toneClass(variant: ChipVariant, color: ChipColor) {
  if (variant === 'solid') return solidMap[color];
  if (variant === 'subtle') return subtleMap[color];
  if (variant === 'outline') return outlineClass;
  return softMap[color];
}

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  color?: ChipColor;
  size?: ChipSize;
  className?: string;
}

/** 공용 칩. variant·color로 디자인, size로 크기를 정한다. */
export function Chip({
  children,
  variant = 'soft',
  color = 'gray',
  size = 'md',
  className = '',
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeMap[size]} ${toneClass(variant, color)} ${className}`}
    >
      {children}
    </span>
  );
}
