# Frontend

반도체 공정 실시간 모니터링 + AI 재조정 관제 시스템의 프론트엔드.
React + TypeScript + Vite 기반.

## 주요 기능

- **실시간 공정 모니터링** — 구역별/전체 대시보드, 3D 장비 보드, 장비·대기열·생산 현황
- **AI 재조정** — 위험 감지 시 자동 생성된 재조정안을 전략별 정량 지표(위험 해소·완료 시간·대기·부하·순서 변동)로 비교
- **운영자 의사결정 지원** — 재조정안 검토/승인, fallback 안내, AI 상세 리포트
- **알림** — 위험 발생 / 재조정안 생성 완료 / 위험 해결 이벤트 토스트 + 기록창
- **주문·작업자·장비 관리**, 시뮬레이션 제어(시작/정지/다시 시작/배속)
- 데스크톱·모바일 반응형

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite 8 |
| 스타일 | Tailwind CSS v4 |
| 클라이언트 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| HTTP | Axios |
| 라우팅 | React Router v7 |
| 3D | Three.js + @react-three/fiber + drei |
| 아이콘 | lucide-react (단색 라인 아이콘) |
| 날짜 | react-datepicker |
| 코드 품질 | ESLint + Prettier |

## 요구 사항

- Node.js v20 이상
- npm v10 이상

## 시작하기

### 1. 저장소 클론

\```bash
git clone https://github.com/skala-chip-team/frontend.git
cd frontend
\```

### 2. 의존성 설치

\```bash
npm install
\```

### 3. 개발 서버 실행

\```bash
npm run dev
\```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속

## 환경 변수

API 베이스 주소는 `VITE_API_BASE_URL`로 주입합니다. (Vite는 빌드 시점에 값을 인라인하므로 변경 시 재빌드/재배포 필요)

| 변수 | 설명 |
|------|------|
| `VITE_API_BASE_URL` | 백엔드·시뮬레이션 API 베이스 URL (예: `https://...project.skala-ai.com`) |

- **로컬 개발**: 값을 비워 두면(`VITE_API_BASE_URL=`) `vite.config.ts`의 dev 프록시(`/api`→8080, `/sim`→8000)로 동작하여 CORS를 회피합니다.
- **프로덕션**: 절대 URL을 지정하면 프록시 없이 직접 호출합니다(백엔드 CORS 허용 필요).
- 미설정 시 기본값은 소스의 배포 백엔드 주소입니다.

> 참고: 인증 토큰은 `localStorage('auth.accessToken')`에 저장되어 모든 요청에 `Authorization: Bearer`로 첨부됩니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (localhost:5173) |
| `npm run build` | 타입체크 + 프로덕션 빌드 (`tsc -b && vite build` → `dist/`) |
| `npm run preview` | 프로덕션 빌드 로컬 미리보기 |
| `npm run lint` | ESLint 검사 (`eslint src`) |
| `npm run format` | Prettier 자동 포맷 |

## 배포 (Vercel)

- Framework: **Vite** / Build Command: `npm run build` / Output: `dist`
- SPA 라우팅을 위해 `vercel.json`이 모든 경로를 `index.html`로 rewrite합니다.
- 배포 전 `VITE_API_BASE_URL` 환경 변수 등록 후 빌드해야 합니다.

\```bash
# Vercel CLI 예시
npx vercel env add VITE_API_BASE_URL production
npx vercel --prod
\```

## 절대 경로 alias

`@` prefix로 `src/` 하위 경로를 절대 경로로 사용할 수 있습니다.

\```ts
import { useUIStore } from '@stores/useUIStore';
import { queryClient } from '@/reactQuery';
import { Modal } from '@components/common';
\```

| Alias | 경로 |
|-------|------|
| `@/*` | `src/*` |
| `@apis/*` | `src/apis/*` |
| `@assets/*` | `src/assets/*` |
| `@components/*` | `src/components/*` |
| `@hooks/*` | `src/hooks/*` |
| `@pages/*` | `src/pages/*` |
| `@routes/*` | `src/routes/*` |
| `@stores/*` | `src/stores/*` |
| `@customtypes/*` | `src/types/*` |
| `@utils/*` | `src/utils/*` |
| `@styles/*` | `src/styles/*` |

## 프로젝트 구조

\```
src/
├── apis/          # API 호출 함수 (axios 인스턴스, 도메인별 호출)
├── assets/        # 이미지(webp), 아이콘(svg)
├── components/    # 컴포넌트
│   ├── common/    #   공통 UI (헤더·사이드바·테이블·모달·차트 등)
│   └── three/     #   3D 장비 보드 (react-three-fiber)
├── hooks/         # 커스텀 훅 (React Query 래퍼 등)
├── pages/         # 페이지 컴포넌트
├── routes/        # 라우터 설정 + 접근 가드(RequireAuth/RequireAdmin)
├── stores/        # Zustand 스토어 (클라이언트 상태)
├── styles/        # 전역 스타일
├── types/         # TypeScript 타입 정의
├── utils/         # 유틸리티 함수 (어댑터·포맷터 등)
└── reactQuery.ts  # QueryClient 설정
\```

## 상태 관리 기준

- **Zustand** — 클라이언트 UI 상태 (모달, 토스트, 알림 로그, 선택 구역 등)
- **TanStack Query** — 서버 상태 (API 데이터·캐시·폴링). 서버 데이터는 Zustand에 두지 않습니다.
