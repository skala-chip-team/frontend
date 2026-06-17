import axios from 'axios';

import type { SimStatus } from './types';

// /sim 호출 베이스. 기본값은 배포 백엔드(prod).
// 로컬에서 Vite 프록시(/sim → 8000)를 쓰려면 VITE_API_BASE_URL='' 로 두면 상대경로로 동작.
const SIM_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'https://skala-chip-team10.skala25a.project.skala-ai.com';

/** 시뮬레이션 현재 상태/시각 조회 */
export async function getSimStatus(): Promise<SimStatus> {
  const { data } = await axios.get<SimStatus>(`${SIM_BASE}/sim/status`);
  return data;
}
