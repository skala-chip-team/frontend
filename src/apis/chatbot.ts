import { apiClient } from './axios';
import type {
  ApiResponse,
  ChatHistoryMessage,
  ChatMessageRequest,
  ChatMessageResult,
  ChatSession,
} from './types';

// 챗봇 응답 대기 시간. 전역 axios timeout(10s)은 LLM+RAG(보통 수십 초)에 비해 짧아
// 답변 도착 전에 끊긴다("답변을 가져오지 못했습니다"). 백엔드 read-timeout(120s)에 맞춘다.
const CHAT_TIMEOUT_MS = 120000;

/**
 * 챗봇 메시지 전송. user_id는 JWT에서 추출되므로 본문에 넣지 않는다.
 * 첫 대화면 sessionId·refTime 생략 → 응답의 sessionId를 이후 메시지에 사용.
 */
export async function sendChatMessage(body: ChatMessageRequest): Promise<ChatMessageResult> {
  const { data } = await apiClient.post<ApiResponse<ChatMessageResult>>(
    '/api/chatbot/messages',
    body,
    { timeout: CHAT_TIMEOUT_MS } // LLM 응답 대기: 전역 10s → 120s 로 연장
  );
  return data.data;
}

/** 현재 로그인 사용자의 챗봇 세션 목록(최신순) */
export async function getChatSessions(): Promise<ChatSession[]> {
  const { data } = await apiClient.get<ApiResponse<ChatSession[]>>('/api/chatbot/sessions');
  return data.data;
}

/** 지정 세션의 대화 내역(시간순). 본인 세션이 아니면 403 */
export async function getChatSessionMessages(sessionId: string): Promise<ChatHistoryMessage[]> {
  const { data } = await apiClient.get<ApiResponse<ChatHistoryMessage[]>>(
    `/api/chatbot/sessions/${sessionId}/messages`
  );
  return data.data;
}
