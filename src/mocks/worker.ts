import type { Worker } from '@/types';

export const workers: Worker[] = [
  { user_id: 'U-1001', username: '김현수', role: '운영자', districts: ['A', 'B', 'C'], status: '근무중', last_login: '2026.06.09 08:12' },
  { user_id: 'U-1002', username: '이지은', role: '운영자', districts: ['A'], status: '근무중', last_login: '2026.06.09 07:54' },
  { user_id: 'U-1003', username: '박민재', role: '작업자', districts: ['A', 'B'], status: '자리비움', last_login: '2026.06.08 18:30' },
  { user_id: 'U-1004', username: '정유라', role: '작업자', districts: ['A'], status: '근무중', last_login: '2026.06.09 09:01' },
  { user_id: 'U-1005', username: '최도윤', role: '작업자', districts: ['B'], status: '근무중', last_login: '2026.06.09 08:47' },
  { user_id: 'U-1006', username: '한서연', role: '작업자', districts: ['B', 'C'], status: '자리비움', last_login: '2026.06.09 06:20' },
  { user_id: 'U-1007', username: '오세훈', role: '운영자', districts: ['C'], status: '근무중', last_login: '2026.06.09 08:05' },
  { user_id: 'U-1008', username: '윤지호', role: '작업자', districts: ['C'], status: '자리비움', last_login: '2026.06.08 22:11' },
  { user_id: 'U-1009', username: '강나윤', role: '작업자', districts: ['A', 'C'], status: '근무중', last_login: '2026.06.09 08:33' },
  { user_id: 'U-1010', username: '임채원', role: '미배치', districts: [], status: '자리비움', last_login: '2026.06.05 14:02' },
  { user_id: 'U-1011', username: '신동건', role: '작업자', districts: ['B'], status: '근무중', last_login: '2026.06.09 07:48' },
  { user_id: 'U-1012', username: '문가영', role: '미배치', districts: [], status: '자리비움', last_login: '2026.06.06 11:25' },
];
