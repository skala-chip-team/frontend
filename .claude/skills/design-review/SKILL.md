---
name: design-review
description: Use when a UI component or page has been implemented and needs visual and UX evaluation before moving to code review
---

# Design Review

Anthropic의 3개 평가 축을 기준으로 구현된 UI를 평가한다.

## 평가 축

### 1. 디자인 품질 (Design Quality)
- **일관성**: Tailwind 클래스, spacing, color가 프로젝트 전체와 통일되는가
- **타이포그래피**: Pretendard 폰트만 사용, 허용 굵기(400/500/600/700/800)만 사용하는가
- **시각적 완성도**: 레이아웃이 의도된 구조를 가지는가, 어색한 여백/정렬은 없는가
- **반응형**: 모바일 / 데스크탑 뷰 모두 깨지는 곳이 없는가

### 2. 기술적 완성도 (Technical Completeness)
- **에셋 규칙**: 이미지는 webp, 아이콘은 SVG인가
- **컴포넌트 구조**: PascalCase 파일명, index.ts barrel export 존재하는가
- **상태 관리**: 서버 데이터는 React Query, UI 상태는 Zustand를 쓰는가
- **타입 안전성**: tsc --noEmit 통과하는가

### 3. 기능성 (Functionality)
- **사용성**: 사용자가 주요 액션을 바로 찾을 수 있는가
- **인터랙션**: 버튼/링크/폼이 의도대로 동작하는가
- **엣지케이스**: 로딩 상태, 빈 상태, 에러 상태가 처리되었는가

## 평가 결과

각 축을 Pass / Needs Work 로 판정:

```
디자인 품질:      [ Pass | Needs Work ]
기술적 완성도:    [ Pass | Needs Work ]
기능성:           [ Pass | Needs Work ]
```

- **전체 Pass** → requesting-code-review 스킬로 이동
- **Needs Work 항목 있음** → 구체적 항목 명시 후 재구현, 재평가
