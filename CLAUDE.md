# Frontend

React + TypeScript + Vite + Tailwind + Zustand + React Query / npm

@.claude/docs/conventions.md
@.claude/docs/commit-convention.md
@.claude/docs/failure-log.md
@.claude/docs/workflow.md

## 핵심 규칙
- 새 기능/컴포넌트/페이지 작업 시작 전: workflow.md의 스킬 체인 먼저 확인
- Claude가 의도와 다른 행동을 했을 때: 즉시 failure-log.md에 날짜와 함께 추가
- tsc --noEmit, eslint는 hooks가 자동 실행 — 별도 실행 불필요

## 컨텍스트 압축 시 반드시 보존
- 현재 구현 중인 기능명과 worktree 브랜치명
- 수정된 파일 목록
- failure-log.md의 최신 규칙
