import axios from 'axios';

import { useToastStore } from '@/stores/toastStore';
import { useDistrictStore } from '@/stores/districtStore';

// 백엔드 주소. 기본값은 배포 백엔드(prod).
// 로컬에서 Vite 프록시(/api → localhost:8080)로 CORS를 회피하려면
// VITE_API_BASE_URL='' (빈 문자열)로 두면 상대경로로 동작한다.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://skala-chip-team10.skala25a.project.skala-ai.com';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 저장된 accessToken을 모든 요청에 Bearer로 첨부 (키는 authStore의 AUTH_TOKEN_KEY와 동일)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth.accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 구역 접근 권한 없음(403 DISTRICT_FORBIDDEN) → 안내 + 담당 구역만 보이는 전체(overview)로 복귀.
// 폴링 등으로 403이 연속될 수 있어 3초 디바운스.
let lastForbiddenAt = 0;
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 403) {
      const now = Date.now();
      if (now - lastForbiddenAt > 3000) {
        lastForbiddenAt = now;
        useToastStore.getState().addToast({
          tone: 'critical',
          title: '이 구역에 접근할 권한이 없습니다',
          description: '담당 구역이 아니어서 접근할 수 없습니다.',
        });
        const districtState = useDistrictStore.getState();
        if (districtState.selectedDistrict !== 'all') districtState.setDistrict('all');
      }
    }
    return Promise.reject(error);
  }
);
