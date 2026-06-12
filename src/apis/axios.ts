import axios from 'axios';

// 백엔드 주소. 기본값은 로컬 백엔드(http://localhost:8080).
// 주의: 절대주소를 쓰면 Vite 프록시를 우회하므로 백엔드 CORS 허용이 필요하다.
// 프록시(/api → 8080)로 CORS를 회피하려면 VITE_API_BASE_URL=''(빈 문자열)로 두면 된다.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

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
