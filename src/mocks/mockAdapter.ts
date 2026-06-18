// ─────────────────────────────────────────────────────────────────────────────
// 데모 모드 axios 어댑터.
//
// USE_MOCKS=true 이면 axios.ts 에서 apiClient(및 전역 axios)에 이 어댑터를 꽂아
// 실제 네트워크 호출을 모두 끊고 더미 데이터를 반환한다. 백엔드 없이 데모가 돌아간다.
//
// 시스템 흐름 재현:
//   1) 위험 탐지 → pending 그룹 노출 → "위험이 발생했습니다" 알림
//   2) 생성 지연(GEN_DELAY_MS) 후 옵션 등장 → "재조정안이 생성되었습니다" 알림
//   3) 전략 승인(select) → pending 에서 빠짐 → "위험이 해결되었습니다" 알림
//   4) 시뮬 재시작(/sim/restart, /sim/start) → 데모 리셋(반복 시연)
//
// 실제 API 로 되돌리려면 USE_MOCKS 를 false 로.
// ─────────────────────────────────────────────────────────────────────────────
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { RescheduleGroupSummary } from '@/apis/types';
import {
  buildChatAnswer,
  buildDistrictGantt,
  buildDistrictMachines,
  buildDistrictStepQueues,
  buildDistrictSummary,
  buildDistrictWorkStatus,
  buildOrders,
  buildPredictionStatus,
  buildProductionStatus,
} from './demoMisc';
import {
  DEMO_GROUP_ID,
  buildGroupDetail,
  buildGroupSummary,
} from './demoScenario';

/** 데모 모드 토글. false 로 두면 실제 백엔드로 호출. */
export const USE_MOCKS = true;

const RISK_DELAY_MS = 3000; // 데모 시작(로그인) 후 위험 탐지까지 — 약 3초 뒤 '위험 발생' 알림
const GEN_DELAY_MS = 8000; // 재조정안 생성 완료 — 위험 발생(3초) 기준 +5초 = 약 8초에 '생성됨' 알림
const DOWN_ROTATE_MS = 8000; // 고장 장비가 바뀌는 주기 (시간에 따라 회전)
const SIM_BASE_MIN = 9 * 60; // 시뮬 시작 시각 09:00
const SIM_DATE = '2025-05-12';

// ── 데모 런타임 상태 ─────────────────────────────────────────────────────────
let demoStartMs = Date.now(); // 이번 "런"이 시작된 실제 시각
let running = true; // 시뮬 실행 여부
let speedPreset: 'realtime' | 'fast' = 'fast';
let selectedStrategy: string | null = null; // 승인된 전략(없으면 pending)

function resetDemo() {
  demoStartMs = Date.now();
  running = true;
  selectedStrategy = null;
  // 알림 재현을 위해 '본 알림' 기록 초기화 (로그인/시뮬 재시작 시 처음부터 다시)
  try {
    localStorage.removeItem('riskAlerts.seen');
    localStorage.removeItem('riskAlerts.generated');
  } catch {
    /* localStorage 불가 시 무시 */
  }
}

const elapsedMs = () => Date.now() - demoStartMs;
const isRiskVisible = () => elapsedMs() >= RISK_DELAY_MS; // 위험 탐지 노출 시점
const isGenerated = () => elapsedMs() >= GEN_DELAY_MS;
/** 현재 고장(정지) 장비 슬롯 — 시간에 따라 0→1→2 회전 (STEP-PHOTO 머신 기준) */
const downSlot = () => Math.floor(elapsedMs() / DOWN_ROTATE_MS) % 3;

/** demoStartMs 를 UTC wall-clock(끝에 'Z' 없음)으로. 위험 알림의 isRecent 판정용. */
function createdAtIso(): string {
  return new Date(demoStartMs).toISOString().slice(0, 19);
}

/** 시뮬 현재 분/ISO. 재시작 시 SIM_BASE_MIN 으로 되돌아가 알림 기록 초기화를 유발한다. */
function simNow() {
  const min = SIM_BASE_MIN + Math.floor(elapsedMs() / 1000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return {
    sim_now_min: min,
    sim_now_iso: `${SIM_DATE}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
  };
}

// ── 응답 헬퍼 ────────────────────────────────────────────────────────────────
function makeResponse<T>(
  config: InternalAxiosRequestConfig,
  payload: T,
  wrapped: boolean
): AxiosResponse {
  return {
    data: wrapped ? { success: true, code: 200, message: 'OK', data: payload } : payload,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  };
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  try {
    if (typeof config.data === 'string') return JSON.parse(config.data);
    if (config.data && typeof config.data === 'object') return config.data as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return {};
}

/**
 * pending(위험 탐지) 그룹 summary.
 * 생성 완료(isGenerated) 시 maxRiskScore 를 0.90→0.91 로 미세 갱신한다.
 * → riskAlerts 폴링 데이터가 1회 바뀌어야 useRiskAlerts effect 가 재실행되며
 *   상세를 재조회해 '재조정안이 생성되었습니다' 를 감지한다.
 *   (react-query 구조적 공유: 데이터가 완전히 동일하면 같은 참조를 반환해 effect 미실행)
 */
function pendingSummary(): RescheduleGroupSummary {
  const s = buildGroupSummary(createdAtIso());
  s.maxRiskScore = isGenerated() ? 0.91 : 0.9;
  return s;
}

function approvedSummary(): RescheduleGroupSummary {
  return { ...buildGroupSummary(createdAtIso()), groupStatus: 'approved' };
}

// ── 라우팅: (path, method) → payload ─────────────────────────────────────────
// 반환 null = 매칭 실패(미정의 엔드포인트). 그 외는 [payload, wrapped] 튜플.
function route(config: InternalAxiosRequestConfig): [unknown, boolean] | null {
  const url = config.url ?? '';
  const method = (config.method ?? 'get').toLowerCase();
  const path = url.split('?')[0];

  // ── 시뮬레이션 (래퍼 없음, 평면 객체) ──
  if (path.includes('/sim/status')) {
    return [{ status: running ? 'running' : 'idle', is_running: running, error: null, ...simNow() }, false];
  }
  if (path.includes('/sim/start')) {
    resetDemo();
    return [{ status: 'running', is_running: true, error: null, sim_factor: 0.1, preset: speedPreset, ...simNow() }, false];
  }
  if (path.includes('/sim/restart')) {
    resetDemo();
    return [{ status: 'running', is_running: true, error: null, sim_factor: 0.1, preset: speedPreset, ...simNow() }, false];
  }
  if (path.includes('/sim/stop')) {
    running = false;
    // 정지해도 sim_now_iso 는 유지한다(null 이면 대시보드 simDate 가 비어 간트 '계획'이
    // 활성 막대만 남는 문제 방지). 현재 시각에서 멈춘 것으로 본다.
    return [{ status: 'idle', is_running: false, error: null, ...simNow() }, false];
  }
  if (path.includes('/sim/speed/toggle')) {
    speedPreset = speedPreset === 'fast' ? 'realtime' : 'fast';
    return [
      {
        status: running ? 'running' : 'idle',
        is_running: running,
        error: null,
        sim_factor: speedPreset === 'fast' ? 0.1 : 60,
        preset: speedPreset,
        ...simNow(),
      },
      false,
    ];
  }

  // ── 인증 ──
  if (path.includes('/api/auth/login')) {
    resetDemo(); // 로그인 = 데모 시작 시점. 이후 약 3초 뒤 위험 알림이 뜬다.
    return [{ accessToken: 'demo-token', tokenType: 'Bearer', username: '데모 운영자', role: 'ADMIN' }, true];
  }
  if (path.includes('/api/auth/signup')) {
    const body = parseBody(config);
    return [{ userId: 'demo-user', username: String(body.username ?? '데모'), email: String(body.email ?? '') }, true];
  }

  // ── 재조정 / 위험 ──
  if (path.includes('/api/reschedule/prediction-status')) {
    return [buildPredictionStatus(simNow().sim_now_iso), true];
  }
  if (path.includes('/api/reschedule/groups/history')) {
    const content = selectedStrategy ? [approvedSummary()] : [];
    return [{ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0 }, true];
  }
  // /api/reschedule/groups/{id}/generate | /select
  const actionMatch = /\/api\/reschedule\/groups\/([^/]+)\/(generate|select)$/.exec(path);
  if (actionMatch) {
    const action = actionMatch[2];
    if (action === 'generate') {
      // 재생성: 즉시 완료된 상세 반환
      return [buildGroupDetail({ generated: true, selectedStrategy, actedAtIso: createdAtIso() }), true];
    }
    // select: 전략 확정 → approved
    const body = parseBody(config);
    selectedStrategy = String(body.strategy ?? 'due_date_first');
    return [
      {
        selectionId: 'SEL-DEMO-0001',
        groupId: DEMO_GROUP_ID,
        strategy: selectedStrategy,
        status: 'applied',
        selectedAt: createdAtIso(),
        groupStatus: 'approved',
      },
      true,
    ];
  }
  // /api/reschedule/groups/{id}
  const detailMatch = /\/api\/reschedule\/groups\/([^/]+)$/.exec(path);
  if (detailMatch) {
    return [
      buildGroupDetail({ generated: isGenerated(), selectedStrategy, actedAtIso: createdAtIso() }),
      true,
    ];
  }
  // /api/reschedule/groups (목록/폴링)
  if (path.includes('/api/reschedule/groups')) {
    const status = (config.params?.status as string | undefined) ?? 'all';
    // 위험은 데모 시작 약 3초 뒤부터 노출(그 전엔 pending 없음 → 알림 안 뜸)
    const pending = selectedStrategy || !isRiskVisible() ? [] : [pendingSummary()];
    const approved = selectedStrategy ? [approvedSummary()] : [];
    let list: RescheduleGroupSummary[];
    if (status === 'pending') list = pending;
    else if (status === 'approved') list = approved;
    else if (status === 'active') list = [...pending, ...approved];
    else list = [...pending, ...approved];
    return [list, true];
  }

  // ── 모니터링 ──
  if (path.includes('/api/monitoring/production-status')) return [buildProductionStatus(132), true];
  if (path.includes('/api/monitoring/overview')) return [[], true]; // 빈 배열 → OverviewDashboard mock 폴백
  const distMatch = /\/api\/monitoring\/districts\/([^/]+)\/(.+)$/.exec(path);
  if (distMatch) {
    const districtId = distMatch[1];
    const sub = distMatch[2];
    if (sub.startsWith('summary')) return [buildDistrictSummary(districtId), true];
    if (sub.startsWith('machines')) return [buildDistrictMachines(districtId, downSlot()), true];
    if (sub.startsWith('schedules/gantt')) return [buildDistrictGantt(districtId), true];
    if (sub.startsWith('queues/by-step')) return [buildDistrictStepQueues(districtId), true];
    if (sub.startsWith('work-status'))
      return [buildDistrictWorkStatus(districtId, simNow().sim_now_min / 60), true];
  }

  // ── 주문 ──
  if (/\/api\/orders\/[^/]+$/.test(path)) {
    const orderId = path.split('/').pop() ?? '';
    const item = buildOrders().orders.find((o) => o.orderId === orderId) ?? buildOrders().orders[0];
    return [
      {
        ...item,
        units: Array.from({ length: item.totalUnits }, (_, i) => ({
          unitId: `${orderId}-U${String(i + 1).padStart(2, '0')}`,
          unitSizeQty: 10,
          unitStatus: i < item.completedUnits ? '완료' : '대기',
          actualStartTime: i < item.completedUnits ? `${SIM_DATE}T10:30:00` : null,
          actualCompleteTime: i < item.completedUnits ? `${SIM_DATE}T12:00:00` : null,
          currentStepId: 'STEP-PHOTO-A1',
          currentMachineId: 'MACHINE-PA-01',
          estimatedCompleteTime: `${SIM_DATE}T13:30:00`,
          steps: [{ stepId: 'STEP-PHOTO-A1', processStep: 'STEP_PHOTO', stepOrder: 1, stepStatus: '진행' }],
        })),
      },
      true,
    ];
  }
  if (path.includes('/api/orders')) return [buildOrders(), true];

  // ── 챗봇 ──
  if (path.includes('/api/chatbot/messages')) {
    const body = parseBody(config);
    return [buildChatAnswer(String(body.message ?? '')), true];
  }
  if (/\/api\/chatbot\/sessions\/[^/]+\/messages$/.test(path)) return [[], true];
  if (path.includes('/api/chatbot/sessions')) return [[], true];

  // ── 설정성(관리자) — 데모에선 비움 ──
  if (path.includes('/api/machines')) return [method === 'get' ? [] : { machineId: 'demo' }, true];
  if (path.includes('/api/process-steps')) return [[], true];
  if (path.includes('/api/users')) return [[], true];

  return null;
}

/** axios 어댑터 본체. 약간의 지연(120ms)을 두어 실제 호출 느낌을 준다. */
export function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  return new Promise((resolve, reject) => {
    const matched = route(config);
    setTimeout(() => {
      if (!matched) {
        // 미정의 엔드포인트: 데모에선 호출되지 않아야 함. 빈 응답 + 경고.
        console.warn('[demo mock] 미정의 엔드포인트:', config.method, config.url);
        resolve(makeResponse(config, null, true));
        return;
      }
      const [payload, wrapped] = matched;
      resolve(makeResponse(config, payload, wrapped));
    }, 120);
    // reject 는 사용하지 않음(데모는 항상 성공). 시그니처 일치를 위해 참조만.
    void reject;
  });
}
