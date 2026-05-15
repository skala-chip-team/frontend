## 📄 회의 내용

### 사용기술

- Vite
    - 빠른 개발 환경을 위한 모듈 번들러
- React
    - 개발 기간이 짧은 점을 고려하여 새 기술보다는 익숙한 프레임워크 선택
- TypeScript
    - 자동 완성이 주는 개발의 효율성과 안정성이 큰 프로젝트에서는 빛을 더더욱 발하기도 하고 코드에서 발생할 수 있는 잠재적인 많은 오류를 미리 잡아준다는 데에서 선택하지 않을 이유 없음
- npm
    - pnpm이나 yarn이 성능면에서 우수하지만 빠른 개발 환경 세팅을 위해 선택
- Axios
    - 서버 통신
- Zustand, React query
    - Zustand는 클라이언트 상태 관리 (e.g. UI 상태)
    - React query는 서버 상태 관리 (e.g. API 데이터)
- tailwind!
- Eslint, Prettier
    - 코드 스타일 일관성 유지

### 폴더 구조

-apis

-assets

-logo/icons

-components

-types

-styles 

-hooks

-pages

-routes

-utils

-stores

-reactQuery.ts

<aside>
💡

각  폴더마다 index.ts로 관리

공통은 common 폴더로 관리

hook은 ts, page는 tsx

아이콘은 svg로 통일 → svgr 설정 필요

img는 webp 통일 

글꼴은 Pretendard로 결정 → Regular, Medium, Semibold, Bold, ExtraBold 사용

</aside>

- 글꼴 굵기
    
    
    | 굵기 이름 | `font-weight` 값 |
    | --- | --- |
    | Thin | 100 |
    | ExtraLight | 200 |
    | Light | 300 |
    | **Regular** | **400** |
    | **Medium** | **500** |
    | **SemiBold** | **600** |
    | **Bold** | **700** |
    | ExtraBold | 800 |
    | Black | 900 |

### 파일명

| 구분 | 네이밍 규칙 | 예시 |
| --- | --- | --- |
| **디렉토리명** | `소문자-hyphen` `소문자` | `user-profile/`, `post-list/` |
| **컴포넌트 파일** | `PascalCase` | `UserCard.jsx`, `LoginForm.jsx` |
| **페이지 파일** | `PascalCase` | `HomePage.jsx`, `UserPage.jsx` |
| **일반 파일** | `camelCase` | `useAuth.js`, `apiService.js`, `dateUtil.js` |
| **변수명** | `camelCase` | `userList`, `isLoading`, `apiResult` |
| **함수명** | `camelCase` | `handleSubmit()`, `getUserData()` |
| **클래스명** | `PascalCase` | `UserService`, `AuthStore` |
| **컴포넌트명** | `PascalCase` | `UserCard`, `LoginForm`, `NavBar` |

### 코드 컨벤션

절대 경로 설정

- 많은 파일 경로로 인한 가독성이 떨어지는 것을 방지

### Eslint 설정

- **📁 파일 대상 & 제외**
    - **검사 대상**: **src/**/*.{js,jsx,ts,tsx}** - src 폴더 내 모든 JavaScript/TypeScript 파일
    - **제외 파일**: **eslint.config.js**, **dist/****, **node_modules/**** - 설정파일, 빌드결과물, 의존성 제외
- **🔧 언어 설정**
    - **파서**: TypeScript 파서 사용
    - **TSConfig**: **./tsconfig.json** 연결
    - **지원 기능**: 최신 ECMAScript + JSX 문법 지원
    - **환경**: 브라우저 + Node.js 전역 변수 사용 가능
- **🔌 플러그인 구성**
    - **React**: React 컴포넌트 검사
    - **TypeScript**: TypeScript 코드 검사
    - **React Hooks**: React Hooks 규칙 검사
- **📋 적용 규칙**
    
    기본 규칙
    
    - **JavaScript 추천 규칙** + **React 추천 규칙** + **TypeScript 추천 규칙** 적용
    - **Prettier 호환성** 보장
    
    커스텀 규칙
    
    - **react/react-in-jsx-scope: 'off'** → React 17+ 자동 import로 React import 불필요
    - **no-unused-vars: ['error', { argsIgnorePattern: '^_' }]** → **_**로 시작하는 매개변수는 미사용 허용
    - **react-hooks/rules-of-hooks: 'error'** → Hooks 규칙 위반 시 에러
    - **react-hooks/exhaustive-deps: 'warn'** → useEffect 의존성 배열 누락 시 경고

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

### Prettier 설정

- **📏 코드 길이 & 들여쓰기**
    - **printWidth: 100** → 한 줄 최대 100자, 초과시 자동 줄바꿈
    - **tabWidth: 2** → 들여쓰기 2칸 간격
    - **useTabs: false** → 탭 문자 대신 스페이스 사용
- **🔤 문자 & 기호 규칙**
    - **semi: true** → 모든 구문 끝에 세미콜론(**`;`**) 추가
    - **singleQuote: true** → 문자열을 작은따옴표(**`'`**) 사용
    - **trailingComma: "es5"** → 객체/배열 마지막 요소 뒤 쉼표 추가
- **🎨 공백 & 괄호 스타일**
    - **bracketSpacing: true** → 객체 괄호 안 공백 유지 **`{ name: 'John' }`**
    - **arrowParens: "always"** → 화살표 함수 매개변수 항상 괄호 사용 **`(x) => x` → 민재오빠랑 상의하기**
- **🔄 시스템 호환성**
    - **endOfLine: "auto"** → 운영체제별 줄바꿈 문자 자동 감지

- 사용 라이브러리
    
    npm install --save-dev eslint-plugin-import
    
    npm install --save-dev eslint-import-resolver-alias  //절대 경로 설정
    npm install -D -E prettier

### 사용 라이브러리

npm install

npm install tailwind

npm install react-router-dom
npm install --save-dev typescript @types/react @types/react-dom

npm install vite-plugin-svgr --save-dev

npm install react-datepicker @types/react-datepicker