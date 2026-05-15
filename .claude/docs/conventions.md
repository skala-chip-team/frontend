# Conventions

## 스택
- Vite + React + TypeScript + Tailwind + Zustand + React Query + Axios
- 패키지 매니저: npm

## 폴더 구조
```
src/
├── apis/
├── assets/
│   └── logo/icons/
├── components/
│   └── common/
├── types/
├── styles/
├── hooks/
├── pages/
├── routes/
├── utils/
├── stores/
└── reactQuery.ts
```
- 각 폴더마다 `index.ts`로 barrel export 관리
- 공통 요소는 `common/` 폴더

## 파일명 & 네이밍
| 구분 | 규칙 | 예시 |
|------|------|------|
| 디렉토리 | `소문자-hyphen` | `user-profile/` |
| 컴포넌트 파일 | `PascalCase.tsx` | `UserCard.tsx` |
| 페이지 파일 | `PascalCase.tsx` | `HomePage.tsx` |
| Hook 파일 | `camelCase.ts` | `useAuth.ts` |
| 일반 파일 | `camelCase.ts` | `apiService.ts` |
| 변수/함수명 | `camelCase` | `userList`, `handleSubmit` |
| 컴포넌트/클래스명 | `PascalCase` | `UserCard`, `AuthStore` |

- hook은 `.ts`, page/component는 `.tsx`
- 아이콘: SVG (vite-plugin-svgr 설정 필요)
- 이미지: webp 통일
- 폰트: Pretendard (Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800)

## 상태 관리 기준
- Zustand: 클라이언트 UI 상태 (e.g. 모달 열림 여부, 테마)
- React Query: 서버 상태 (e.g. API 데이터, 캐시)
- Zustand에 서버 데이터 절대 넣지 말 것

## Prettier
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "auto"
}
```

## ESLint 핵심 규칙
- `react/react-in-jsx-scope`: off (React 17+ 자동 import)
- `no-unused-vars`: error, `_` prefix 매개변수는 허용
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warn

## 기타
- 절대 경로 설정 필수 (eslint-import-resolver-alias)
- `react-router-dom` 으로 라우팅
