# Project Initial Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React + TypeScript + Vite 기반 프론트엔드 프로젝트의 기본 환경 구성

**Architecture:** Vite CLI로 프로젝트 초기화 후 convention.md 기준의 패키지, 설정, 폴더 구조를 단계적으로 구성한다. 초기 세팅이므로 worktree 없이 main 브랜치에서 진행한다.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query v5, Axios, React Router v6, ESLint (Flat Config), Prettier

---

### Task 1: Vite 프로젝트 초기화

**Files:**
- Create: `package.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`

- [ ] **Step 1: Vite 초기화 (프롬프트 없이)**

```bash
cd /Users/jisung/Documents/frontend
npm create vite@latest . -- --template react-ts --force 2>/dev/null || \
npx create-vite@latest . --template react-ts
```

프롬프트가 뜨면 `2` (Ignore files and continue) 입력

- [ ] **Step 2: 초기 의존성 설치 및 서버 확인**

```bash
npm install
npm run dev
```

Expected: localhost:5173 에서 Vite + React 기본 화면 정상 출력
이후 Ctrl+C로 종료

- [ ] **Step 3: 커밋**

```bash
git add .
git commit -m "feat: initialize Vite React TypeScript project"
```

---

### Task 2: 추가 패키지 설치

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: 런타임 패키지 설치**

```bash
npm install zustand @tanstack/react-query axios react-router-dom react-datepicker
```

- [ ] **Step 2: 개발 도구 패키지 설치**

```bash
npm install --save-dev \
  @types/react-datepicker \
  vite-plugin-svgr \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-import \
  eslint-import-resolver-alias \
  prettier \
  eslint-config-prettier
```

- [ ] **Step 3: Tailwind CSS v4 설치**

```bash
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "feat: install project dependencies"
```

---

### Task 3: Vite 설정 (절대 경로 + 플러그인)

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: vite.config.ts 교체**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@apis': resolve(__dirname, './src/apis'),
      '@assets': resolve(__dirname, './src/assets'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@pages': resolve(__dirname, './src/pages'),
      '@routes': resolve(__dirname, './src/routes'),
      '@stores': resolve(__dirname, './src/stores'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
});
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add vite.config.ts
git commit -m "feat: configure Vite with path aliases, Tailwind v4, svgr"
```

---

### Task 4: TypeScript 절대 경로 설정

**Files:**
- Modify: `tsconfig.app.json`

- [ ] **Step 1: tsconfig.app.json에 paths 추가**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@apis/*": ["./src/apis/*"],
      "@assets/*": ["./src/assets/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@pages/*": ["./src/pages/*"],
      "@routes/*": ["./src/routes/*"],
      "@stores/*": ["./src/stores/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@styles/*": ["./src/styles/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add tsconfig.app.json
git commit -m "feat: configure TypeScript absolute paths"
```

---

### Task 5: Tailwind + Global CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: index.css를 Tailwind v4 방식으로 교체**

```css
@import "tailwindcss";

@layer base {
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Pretendard', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 2: 개발 서버에서 Tailwind 동작 확인**

`src/App.tsx` 에서 임시로 `<div className="text-blue-500 text-2xl">Tailwind works</div>` 추가 후 화면 확인

- [ ] **Step 3: App.tsx 정리 후 커밋**

```bash
git add src/index.css src/App.tsx
git commit -m "feat: configure Tailwind CSS v4 and global styles"
```

---

### Task 6: ESLint + Prettier 설정

**Files:**
- Modify: `eslint.config.js`
- Create: `.prettierrc`
- Modify: `package.json` (scripts)

- [ ] **Step 1: .prettierrc 생성**

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

- [ ] **Step 2: eslint.config.js 교체 (Flat Config)**

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@', './src'],
            ['@apis', './src/apis'],
            ['@components', './src/components'],
            ['@hooks', './src/hooks'],
            ['@pages', './src/pages'],
            ['@routes', './src/routes'],
            ['@stores', './src/stores'],
            ['@types', './src/types'],
            ['@utils', './src/utils'],
            ['@styles', './src/styles'],
          ],
          extensions: ['.ts', '.tsx'],
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
```

- [ ] **Step 3: package.json scripts 업데이트**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint src",
  "preview": "vite preview",
  "format": "prettier --write \"src/**/*.{ts,tsx}\""
}
```

- [ ] **Step 4: Lint 실행 확인**

```bash
npm run lint
```

Expected: 오류 없음 (또는 warning만)

- [ ] **Step 5: 커밋**

```bash
git add eslint.config.js .prettierrc package.json
git commit -m "feat: configure ESLint flat config and Prettier"
```

---

### Task 7: 폴더 구조 및 barrel exports 생성

**Files:**
- Create: `src/apis/index.ts`, `src/components/common/index.ts`, `src/types/index.ts`
- Create: `src/hooks/index.ts`, `src/pages/index.ts`, `src/utils/index.ts`, `src/stores/index.ts`
- Create: `src/routes/index.tsx`

- [ ] **Step 1: 폴더 및 index 파일 일괄 생성**

```bash
mkdir -p src/{apis,components/common,types,styles,hooks,pages,utils,stores,assets/logo,assets/icons}
for dir in apis components/common types hooks pages utils stores; do
  echo "// barrel export" > src/$dir/index.ts
done
touch src/assets/logo/.gitkeep
touch src/assets/icons/.gitkeep
```

- [ ] **Step 2: 커밋**

```bash
git add src/
git commit -m "feat: create project folder structure with barrel exports"
```

---

### Task 8: 기본 설정 파일 구성 (QueryClient, Router, Store)

**Files:**
- Create: `src/reactQuery.ts`
- Modify: `src/routes/index.tsx`
- Create: `src/stores/useUIStore.ts`
- Modify: `src/stores/index.ts`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: React Query 클라이언트 설정**

```ts
// src/reactQuery.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 2: 기본 라우터 설정**

```tsx
// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Home</div>,
  },
]);
```

- [ ] **Step 3: UI 전역 상태 스토어 생성**

```ts
// src/stores/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
```

```ts
// src/stores/index.ts
export { useUIStore } from './useUIStore';
```

- [ ] **Step 4: main.tsx 업데이트 (Provider 연결)**

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './reactQuery';
import { router } from '@routes/index';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 5: App.tsx 정리**

```tsx
// src/App.tsx
export default function App() {
  return <div>Frontend App</div>;
}
```

- [ ] **Step 6: 최종 검증**

```bash
npx tsc --noEmit
npm run lint
npm run dev
```

Expected: 타입 오류 없음, lint 통과, 개발 서버 정상 실행

- [ ] **Step 7: 최종 커밋**

```bash
git add .
git commit -m "feat: set up base configurations (QueryClient, Router, Zustand)"
```
