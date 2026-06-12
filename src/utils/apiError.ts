/** 공통 래퍼(ApiResponse) 에러에서 message를 꺼낸다. 없으면 fallback */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const msg = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : fallback;
}
