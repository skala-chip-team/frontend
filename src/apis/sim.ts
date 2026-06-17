import axios from 'axios';

import type { SimStatus } from './types';

// /sim 호출 베이스.
// - dev: VITE_API_BASE_URL 미설정 → '' → 상대경로 → Vite 프록시(/sim → 8000)
// - prod(Vercel 등): VITE_API_BASE_URL 설정 → 절대경로 → 백엔드 ingress(/sim → AI, CORS 허용)
const SIM_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/** 시뮬레이션 현재 상태/시각 조회 */
export async function getSimStatus(): Promise<SimStatus> {
  const { data } = await axios.get<SimStatus>(`${SIM_BASE}/sim/status`);
  return data;
}
