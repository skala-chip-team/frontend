// 작업자(사용자) 타입. 필드명은 docs/data.dbml 컬럼명을 따른다.
export type WorkerRole = '운영자' | '작업자' | '미배치'; // user_role.role_name
export type WorkerDistrict = 'A' | 'B' | 'C';
export type WorkerStatus = '근무중' | '자리비움';

export interface Worker {
  user_id: string; // user.user_id
  username: string; // user.username
  role: WorkerRole;
  districts: WorkerDistrict[]; // user_district_map → district (권한 구역, N개 가능)
  status: WorkerStatus; // 현재 상태
  last_login: string; // user.last_login
}
