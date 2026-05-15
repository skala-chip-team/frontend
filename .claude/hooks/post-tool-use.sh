#!/bin/bash
# TypeScript 파일 수정 후 타입 체크 자동 실행 (PostToolUse hook)

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$TOOL" =~ ^(Write|Edit)$ ]] && [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  PROJECT_ROOT="/Users/jisung/Documents/frontend"

  if [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
    echo "TypeScript 체크 실행 중..."
    cd "$PROJECT_ROOT"
    RESULT=$(npx tsc --noEmit 2>&1)
    if [ -n "$RESULT" ]; then
      echo "TypeScript 오류:"
      echo "$RESULT" | head -30
    fi
  fi
fi

exit 0
