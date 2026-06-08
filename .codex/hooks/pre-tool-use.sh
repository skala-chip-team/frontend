#!/bin/bash
# 위험한 명령어 차단 (PreToolUse hook)

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ "$TOOL" = "Bash" ]; then
  # rm -rf 차단
  if echo "$COMMAND" | grep -qE 'rm\s+-rf'; then
    echo '{"decision":"block","reason":"rm -rf는 차단됩니다. 삭제할 파일을 명시하세요."}'
    exit 2
  fi

  # git push --force 차단 (--force-with-lease는 허용)
  if echo "$COMMAND" | grep -qP 'git push.*(--force|-f)\b' && ! echo "$COMMAND" | grep -q 'force-with-lease'; then
    echo '{"decision":"block","reason":"git push --force는 차단됩니다. --force-with-lease를 사용하세요."}'
    exit 2
  fi

  # .env 직접 쓰기 차단
  if echo "$COMMAND" | grep -qE '(cat|echo|printf).+\.env|>\s*\.env'; then
    echo '{"decision":"block","reason":".env 파일 직접 수정은 차단됩니다."}'
    exit 2
  fi
fi

# .env 파일 Write 차단
if [[ "$TOOL" = "Write" ]] && echo "$FILE" | grep -qE '\.env$'; then
  echo '{"decision":"block","reason":".env 파일 직접 수정은 차단됩니다."}'
  exit 2
fi

exit 0
