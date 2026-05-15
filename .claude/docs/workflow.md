# Workflow

## 스킬 체인 — 새 기능 개발

```
brainstorming
    ↓
using-git-worktrees
    ↓
writing-plans
    ↓
subagent-driven-development  (+test-driven-development)
    ↓
design-review                ← 커스텀 스킬
    ↓
requesting-code-review
    ↓
finishing-a-development-branch
```

## 브랜치 컨벤션
- `feat/기능명` — 새 기능
- `fix/버그명` — 버그 수정
- `refactor/대상명` — 리팩터링

브랜치는 로컬 worktree에서 생성 (`.worktrees/` 폴더, gitignore됨)
push 전까지 GitHub에 올라가지 않음

## 언제 전체 체인을 타는가
| 작업 유형 | 체인 |
|-----------|------|
| 새 컴포넌트/페이지/기능 | 전체 체인 |
| 버그 수정 | brainstorming 제외, fix/ 브랜치부터 |
| 리팩터링 | brainstorming → writing-plans → subagent |
| 질문/설명/탐색 | 체인 불필요 |

## 커밋 기준
- **단위**: 설정 파일 하나, 스텝 하나 = 커밋 X. 의미 있는 기능 영역 단위로 묶을 것
- **예시 (좋음)**: `feat: install deps and configure Vite, TS, Tailwind`
- **예시 (나쁨)**: 패키지 설치 커밋 → vite 설정 커밋 → tsconfig 커밋 → ... (10개)
- **기준**: "이 커밋 하나로 무엇이 동작하는가?"가 설명될 수 있으면 적절한 단위

## 스킬 호출 규칙
- 각 단계 진입 전 반드시 해당 superpowers 스킬 invoke
- design-review는 UI 변경이 있는 모든 작업에 적용
- 완료 주장 전: `verification-before-completion` 스킬 필수
