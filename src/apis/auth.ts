import { apiClient } from './axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
} from './types';

/** 로그인. 성공 시 accessToken + username/role 반환 */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', body);
  return data.data;
}

/** 회원가입. 응답에 토큰은 없으므로 가입 후 로그인 필요 */
export async function signup(body: SignUpRequest): Promise<SignUpResponse> {
  const { data } = await apiClient.post<ApiResponse<SignUpResponse>>('/api/auth/signup', body);
  return data.data;
}
