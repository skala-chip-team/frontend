#!/bin/bash
# 작업 완료 전 verification 체크포인트 (Stop hook)

INPUT=$(cat)
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // empty')

# 일반 작업 완료 시에만 리마인드 (에러 종료 제외)
if [ "$STOP_REASON" != "error" ]; then
  echo "verification-before-completion 스킬을 사용했나요?"
  echo "UI 변경이 있었다면 design-review 스킬을 적용했나요?"
fi

exit 0
