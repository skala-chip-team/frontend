import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Loader2, RefreshCw } from 'lucide-react';

import { Chip, Pagination } from '@components/common';
import { useRescheduleHistory } from '@/hooks';
import { districtLabels, type DistrictId } from '@/stores';
import {
  getApiErrorMessage,
  getApiErrorStatus,
  processStepLabel,
  riskFactorLabel,
  riskLevelLabel,
  statusChipColor,
  statusLabel,
  toRiskLevel,
} from '@/utils';
import type { GroupStatus, RiskLevel } from '@/types';

const PAGE_SIZE = 20;
const MAX_RANGE_DAYS = 92;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 서버 시각(UTC 무접미사) → KST 'YYYY-MM-DD HH:mm'. 없으면 '정보 없음' */
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '정보 없음';
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(iso);
  const d = new Date(hasZone ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return '정보 없음';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function diffDays(from: string, to: string): number {
  return (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000;
}

const districtLabel = (id: string) => districtLabels[id as DistrictId] ?? `구역 ${id}`;

export default function RescheduleHistoryPage() {
  const navigate = useNavigate();

  // 기본값은 마운트 시 1회 계산(렌더 중 Date.now 호출 금지)
  const [today] = useState(() => ymd(new Date()));
  const [from, setFrom] = useState(() => ymd(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => ymd(new Date()));
  const [page, setPage] = useState(0); // 0-based

  // 기간 검증(클라이언트): from>to 또는 92일 초과면 호출 보류
  const range = diffDays(from, to);
  const rangeError =
    range < 0 ? '시작일이 종료일보다 늦습니다.' : range > MAX_RANGE_DAYS ? `조회 기간은 최대 ${MAX_RANGE_DAYS}일까지 가능합니다.` : null;

  const { data, isLoading, isError, error, refetch, isFetching } = useRescheduleHistory(
    { from, to, page, size: PAGE_SIZE },
    rangeError === null
  );

  const rows = data?.content ?? [];

  // 기간/필터 변경 시 첫 페이지로
  const key = `${from}|${to}`;
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setPage(0);
  }

  const exportCsv = () => {
    if (rows.length === 0) return;
    const header = ['그룹ID', '생성일시', '구역', '공정', '위험레벨', '위험원인', '상태', '영향유닛수', '최대위험점수'];
    const lines = rows.map((g) =>
      [
        g.groupId,
        fmtDateTime(g.createdAt),
        districtLabel(g.districtId),
        processStepLabel(g.processStep),
        g.riskLevel ? riskLevelLabel(toRiskLevel(g.riskLevel)) : '정보 없음',
        g.riskFactor ? riskFactorLabel(g.riskFactor) : '정보 없음',
        statusLabel(g.groupStatus as GroupStatus),
        String(g.affectedUnits?.length ?? 0),
        g.maxRiskScore != null ? String(Math.round(g.maxRiskScore * 100)) : '정보 없음',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = '﻿' + [header.join(','), ...lines].join('\n'); // BOM(엑셀 한글)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reschedule-history_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const serverRangeExceeded = getApiErrorStatus(error) === 400;

  return (
    <section className="min-h-full bg-surface-50 px-6 pb-6 pt-4 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        {/* 헤더 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/reschedule')}
            aria-label="목록으로"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-secondary-navy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-heading-2">
            <button type="button" onClick={() => navigate('/reschedule')} className="text-gray-400 transition hover:text-gray-600">
              재조정안 관리
            </button>
            <span className="text-gray-300">›</span>
            <span className="text-secondary-navy">기간별 이력</span>
          </div>
        </div>

        {/* 기간 선택 + 내보내기 */}
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-label-3 font-semibold text-gray-400">
              시작일
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-label-1 text-secondary-navy"
              />
            </label>
            <label className="flex flex-col gap-1 text-label-3 font-semibold text-gray-400">
              종료일
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-label-1 text-secondary-navy"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-label-1 font-semibold text-secondary-navy transition hover:bg-surface-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            CSV 내보내기
          </button>
        </div>

        {/* 본문 */}
        {rangeError ? (
          <Message tone="warn">{rangeError}</Message>
        ) : isLoading ? (
          <Message>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            이력을 불러오는 중…
          </Message>
        ) : isError ? (
          <Message tone="error">
            <span>
              {serverRangeExceeded
                ? `조회 기간은 최대 ${MAX_RANGE_DAYS}일까지 가능합니다.`
                : getApiErrorMessage(error, '이력을 불러오지 못했습니다.')}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-label-2 font-semibold text-secondary-navy transition hover:bg-surface-100"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              재시도
            </button>
          </Message>
        ) : rows.length === 0 ? (
          <Message>해당 기간의 재조정 이력이 없습니다.</Message>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <table className="w-full min-w-[640px] text-left text-label-2">
                <thead className="border-b border-gray-200 bg-surface-100/70 text-label-3 text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">생성일시</th>
                    <th className="px-5 py-3 font-semibold">구역</th>
                    <th className="px-5 py-3 font-semibold">공정</th>
                    <th className="px-5 py-3 font-semibold">위험</th>
                    <th className="px-5 py-3 font-semibold">위험 원인</th>
                    <th className="px-5 py-3 font-semibold">상태</th>
                    <th className="px-5 py-3 text-right font-semibold">영향 유닛</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g) => {
                    const level: RiskLevel = toRiskLevel(g.riskLevel);
                    return (
                      <tr key={g.groupId} className="border-b border-gray-100 last:border-none hover:bg-surface-100/60">
                        <td className="px-5 py-3 tabular-nums text-gray-600">{fmtDateTime(g.createdAt)}</td>
                        <td className="px-5 py-3 text-gray-500">{districtLabel(g.districtId)}</td>
                        <td className="px-5 py-3 font-semibold text-secondary-navy">{processStepLabel(g.processStep)}</td>
                        <td className="px-5 py-3">
                          <Chip variant="subtle" color={level === 'Low' ? 'emerald' : level === 'Medium' ? 'orange' : 'red'} size="xs" className="font-bold">
                            {g.riskLevel ? riskLevelLabel(level) : '정보 없음'}
                          </Chip>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{g.riskFactor ? riskFactorLabel(g.riskFactor) : '정보 없음'}</td>
                        <td className="px-5 py-3">
                          <Chip variant="subtle" color={statusChipColor(g.groupStatus as GroupStatus)} size="sm">
                            {statusLabel(g.groupStatus as GroupStatus)}
                          </Chip>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-gray-600">{g.affectedUnits?.length ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-label-3 text-gray-400">
                총 {data?.totalElements ?? rows.length}건{isFetching ? ' · 갱신 중…' : ''}
              </span>
              {data && data.totalPages > 1 ? (
                <Pagination page={page + 1} totalPages={data.totalPages} onChange={(p) => setPage(p - 1)} />
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Message({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'warn' | 'error' }) {
  const toneClass =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-500'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-gray-200 bg-white text-gray-400';
  return (
    <div className={`flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-body-2 ${toneClass}`}>
      {children}
    </div>
  );
}
