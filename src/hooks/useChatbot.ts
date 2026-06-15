import { useMutation, useQuery } from '@tanstack/react-query';

import { getChatSessionMessages, getChatSessions, sendChatMessage } from '@apis/index';
import type { ChatMessageRequest } from '@apis/index';

/** 챗봇 메시지 전송 (첫 메시지는 sessionId 없이 → 응답에서 sessionId 발급) */
export function useSendChatMessage() {
  return useMutation({
    mutationFn: (body: ChatMessageRequest) => sendChatMessage(body),
  });
}

/** 챗봇 세션 목록 */
export function useChatSessions(enabled = true) {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: getChatSessions,
    enabled,
  });
}

/** 특정 세션 대화 내역 */
export function useChatSessionMessages(sessionId?: string) {
  return useQuery({
    queryKey: ['chatSessionMessages', sessionId ?? ''],
    queryFn: () => getChatSessionMessages(sessionId as string),
    enabled: Boolean(sessionId),
  });
}
