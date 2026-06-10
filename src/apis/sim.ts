import axios from 'axios';

import type { SimStatus } from './types';

// 시뮬레이션 서버는 8080(apiClient)과 다른 오리진(8000)이라 Vite 프록시(/sim)로 상대경로 요청.
/** 시뮬레이션 현재 상태/시각 조회 */
export async function getSimStatus(): Promise<SimStatus> {
  const { data } = await axios.get<SimStatus>('/sim/status');
  return data;
}
