import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

import { useSendChatMessage } from '@/hooks';
import { getApiErrorMessage } from '@/utils';
import type { RescheduleGroup } from '@/types';

import { RescheduleFaqChatHeader } from './RescheduleFaqChatHeader';
import { RescheduleFaqInput } from './RescheduleFaqInput';
import { RescheduleFaqMessage } from './RescheduleFaqMessage';
import { RescheduleFaqQuickQuestions } from './RescheduleFaqQuickQuestions';
import { RescheduleFaqTypingIndicator } from './RescheduleFaqTypingIndicator';
import type { ChatMessage } from './chatTypes';

interface RescheduleFaqChatProps {
  group: RescheduleGroup;
}

const QUICK_QUESTIONS = [
  '과거에 비슷한 위험 상황이 있었을 때 어떤 재조정안을 선택했나요?',
  'STEP4에서 가장 capa가 낮은 장비가 뭔가요?',
];

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '재조정안이나 공장 상황에 대해 궁금한 점을 질문해주세요.',
};

export function RescheduleFaqChat({ group }: RescheduleFaqChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = useSendChatMessage();
  const isTyping = sendMessage.isPending;

  // 그룹이 바뀌면 대화 초기화(세션도 새로) — 렌더 중 상태 조정 패턴
  const [prevGroupId, setPrevGroupId] = useState(group.group_id);
  if (prevGroupId !== group.group_id) {
    setPrevGroupId(group.group_id);
    setDraft('');
    setIsOpen(false);
    setSessionId(undefined);
    setMessages([WELCOME]);
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [isTyping, messages]);

  const submitQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sendMessage.isPending) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: trimmed }]);
    setDraft('');

    // 첫 메시지면 sessionId 없이 전송 → 응답의 sessionId를 이후 메시지에 사용
    sendMessage.mutate(
      { groupId: group.group_id, message: trimmed, sessionId },
      {
        onSuccess: (result) => {
          setSessionId(result.sessionId);
          setMessages((prev) => [
            ...prev,
            { id: `assistant-${Date.now()}`, role: 'assistant', content: result.answer },
          ]);
        },
        onError: (error) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: getApiErrorMessage(
                error,
                '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.'
              ),
            },
          ]);
        },
      }
    );
  };

  return (
    // 닫힌 패널 영역이 아래 UI 클릭을 가로채지 않도록 컨테이너는 이벤트를 통과시킨다
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <div
        className={`w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[28px] border border-gray-200/80 bg-white shadow-[0_20px_48px_rgba(8,16,40,0.18)] transition-all duration-300 ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-4 scale-95 opacity-0'
        }`}
      >
        <RescheduleFaqChatHeader onClose={() => setIsOpen(false)} />
        <RescheduleFaqQuickQuestions questions={QUICK_QUESTIONS} onSelect={submitQuestion} />

        <div className="flex h-[min(500px,calc(100vh-13rem))] flex-col">
          <div ref={viewportRef} className="flex-1 space-y-4 overflow-y-auto bg-white px-5 py-4">
            {messages.map((message) => (
              <RescheduleFaqMessage key={message.id} message={message} />
            ))}
            {isTyping ? <RescheduleFaqTypingIndicator /> : null}
          </div>
          <RescheduleFaqInput
            draft={draft}
            onChange={setDraft}
            onSubmit={() => submitQuestion(draft)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_18px_36px_rgba(8,16,40,0.22)] transition-all duration-300 ${
          isOpen
            ? 'rotate-90 bg-secondary-navy text-white'
            : 'bg-primary-500 text-white hover:-translate-y-0.5 hover:bg-primary-600'
        }`}
        aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
        aria-expanded={isOpen}
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-inherit opacity-25 blur-xl transition-opacity group-hover:opacity-40" />
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>
    </div>
  );
}
