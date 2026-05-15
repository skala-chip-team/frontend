# Frontend

React + TypeScript + Vite 기반 프론트엔드 프로젝트

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite 8 |
| 스타일 | Tailwind CSS v4 |
| 클라이언트 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| HTTP | Axios |
| 라우팅 | React Router v6 |
| 코드 품질 | ESLint + Prettier |

## 요구 사항

- Node.js v20 이상
- npm v10 이상

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/skala-chip-team/frontend.git
cd frontend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (localhost:5173) |
| `npm run build` | 프로덕션 빌드 (`dist/` 생성) |
| `npm run preview` | 프로덕션 빌드 로컬 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 자동 포맷 |

## 절대 경로 alias

`@` prefix로 `src/` 하위 경로를 절대 경로로 사용할 수 있습니다.

```ts
import { useUIStore } from '@stores/useUIStore';
import { queryClient } from '@/reactQuery';
import UserCard from '@components/UserCard';
```

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

```
src/
├── apis/          # API 호출 함수
├── assets/        # 이미지(webp), 아이콘(svg)
├── components/    # 공통 컴포넌트
│   └── common/
├── hooks/         # 커스텀 훅
├── pages/         # 페이지 컴포넌트
├── routes/        # 라우터 설정
├── stores/        # Zustand 스토어 (클라이언트 상태)
├── styles/        # 전역 스타일
├── types/         # TypeScript 타입 정의
├── utils/         # 유틸리티 함수
└── reactQuery.ts  # QueryClient 설정
```
