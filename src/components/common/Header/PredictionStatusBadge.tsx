import { Activity, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';

import { usePredictionStatus } from '@/hooks';
import type { PredictionStatus } from '@apis/index';

type Style = { icon: typeof Activity; cls: string; dot: string; label: string };

const STYLE: Record<PredictionStatus['status'], Style> = {
  SUCCESS: {
    icon: CheckCircle2,
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: '예측 정상',
  },
  SKIPPED_INSUFFICIENT: {
    icon: MinusCircle,
    cls: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-400',
    label: '입력 부족',
  },
  FAILED: {
    icon: AlertTriangle,
    cls: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
    label: '예측 실패',
  },
  NONE: {
    icon: Activity,
    cls: 'border-gray-200 bg-white text-gray-400',
    dot: 'bg-gray-300',
    label: '예측 대기',
  },
};

/** 헤더의 지연 예측 시스템 상태 배지. 10초 폴링. 사유는 title(hover)로 노출. */
export function PredictionStatusBadge() {
  const { data, isError } = usePredictionStatus();

  // 조회 자체 실패(백엔드 미응답)면 회색 대기로 표시
  const status: PredictionStatus['status'] = isError ? 'NONE' : (data?.status ?? 'NONE');
  const s = STYLE[status];
  const Icon = s.icon;

  const tooltip =
    data?.message ??
    (status === 'SUCCESS' && data?.insertedCount != null
      ? `신규 위험 ${data.insertedCount}건 예측`
      : '지연 예측 시스템 상태');

  return (
    <div
      title={tooltip}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${s.cls}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-label-3 font-medium text-gray-400">예측</span>
      <span className="text-body-2 font-semibold">{s.label}</span>
      <span className={`ml-0.5 inline-flex h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
    </div>
  );
}
