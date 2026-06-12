// 작업자(사용자) 타입. 백엔드 UserSummary(GET /api/users) 기준.
export type WorkerRole = '관리자' | '운영자' | '작업자';

export interface Worker {
  user_id: string; // userId
  username: string;
  email: string;
  role: WorkerRole;
  districts: string[]; // 권한 구역 id 목록 (DST-01 등), 없으면 []
  active: boolean; // 계정 활성 여부
}
