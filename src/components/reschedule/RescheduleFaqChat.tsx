import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

import { rescheduleGroups } from '@/mocks';
import type { RescheduleGroup, RescheduleStrategy } from '@/types';

import { RescheduleFaqChatHeader } from './RescheduleFaqChatHeader';
import { RescheduleFaqInput } from './RescheduleFaqInput';
import { RescheduleFaqMessage } from './RescheduleFaqMessage';
import { RescheduleFaqQuickQuestions } from './RescheduleFaqQuickQuestions';
import { RescheduleFaqTypingIndicator } from './RescheduleFaqTypingIndicator';
import type { ChatMessage } from './chatTypes';

interface RescheduleFaqChatProps {
  group: RescheduleGroup;
  activeStrategy: RescheduleStrategy;
  activeStrategyIndex: number;
  recommendedStrategy: RescheduleStrategy;
  recommendedStrategyIndex: number;
}

const QUICK_QUESTIONS = [
  '과거에 비슷한 위험 상황이 있었을 때 어떤 재조정안을 선택했나요?',
  'STEP4에서 가장 capa가 낮은 장비가 뭔가요?',
];

const strategyLabel = (index: number) => String.fromCharCode(65 + index);

const formatStrategyTitle = (strategy: RescheduleStrategy, index: number) =>
  `재조정안${strategyLabel(index)} (${strategy.name})`;

const buildWelcomeMessage = (
  _group: RescheduleGroup,
  _recommendedStrategy: RescheduleStrategy,
  _recommendedStrategyIndex: number
) => '재조정안이나 공장 상황에 대해 궁금한 점을 질문해주세요.';

const buildSimilarRiskAnswer = (
  group: RescheduleGroup,
  recommendedStrategy: RescheduleStrategy,
  recommendedStrategyIndex: number
) => {
  const similarGroups = rescheduleGroups.filter(
    (item) => item.group_id !== group.group_id && item.risk_factor === group.risk_factor
  );
  const relievedCount = recommendedStrategy.compare.units.filter((unit) => unit.relieved).length;

  return [
    `현재 목업 데이터에서 같은 "${group.risk_factor}" 그룹은 ${similarGroups.length}건이에요.`,
    `${formatStrategyTitle(recommendedStrategy, recommendedStrategyIndex)}처럼 위험 UNIT을 먼저 구제하는 안을 우선 검토하는 흐름으로 잡혀 있어요.`,
    `이 안은 위험 ${relievedCount}건을 해소하고 평균 대기를 ${recommendedStrategy.compare.wait_before_min}분에서 ${recommendedStrategy.compare.wait_after_min}분으로 줄여줍니다.`,
  ].join(' ');
};

const buildCapacityAnswer = (
  group: RescheduleGroup,
  activeStrategy: RescheduleStrategy,
  activeStrategyIndex: number
) => {
  const tightestMachine = [...activeStrategy.compare.utils].sort(
    (left, right) => right.util_after - left.util_after
  )[0];

  return [
    `현재 선택한 ${formatStrategyTitle(activeStrategy, activeStrategyIndex)} 기준으로 ${group.process_step}에서 가용 CAPA가 가장 빠듯한 장비는 ${tightestMachine.machine}입니다.`,
    `조정 후 가동률이 ${tightestMachine.util_after}%라 여유 CAPA는 약 ${100 - tightestMachine.util_after}% 수준으로 보여요.`,
  ].join(' ');
};

const buildRecommendationAnswer = (
  recommendedStrategy: RescheduleStrategy,
  recommendedStrategyIndex: number
) => {
  const relievedCount = recommendedStrategy.compare.units.filter((unit) => unit.relieved).length;

  return [
    `추천안은 ${formatStrategyTitle(recommendedStrategy, recommendedStrategyIndex)}입니다.`,
    `위험 UNIT ${relievedCount}건을 모두 구제하고, 전체 완료 시간을 ${recommendedStrategy.compare.makespan_before_min}분에서 ${recommendedStrategy.compare.makespan_after_min}분으로 줄이는 쪽에 강점이 있어요.`,
  ].join(' ');
};

const buildWaitAnswer = (activeStrategy: RescheduleStrategy, activeStrategyIndex: number) =>
  [
    `${formatStrategyTitle(activeStrategy, activeStrategyIndex)} 기준 평균 대기는 ${activeStrategy.compare.wait_before_min}분에서 ${activeStrategy.compare.wait_after_min}분으로 바뀝니다.`,
    `장비 부하 편차는 "${activeStrategy.compare.util_dev_label}"(±${activeStrategy.compare.util_dev_pp}%p) 수준이라, 대기 개선과 장비 균형의 trade-off를 함께 보시면 좋아요.`,
  ].join(' ');

const buildDefaultAnswer = (
  group: RescheduleGroup,
  activeStrategy: RescheduleStrategy,
  activeStrategyIndex: number
) =>
  [
    `현재 화면에서는 ${group.risk_factor || '지연 위험'} 대응으로 ${formatStrategyTitle(activeStrategy, activeStrategyIndex)}을 보고 있어요.`,
    `위험 UNIT 변화, 장비 가동률, 큐 우선순위 변경, 납기 완화 효과 중 궁금한 항목을 질문해주시면 바로 정리해드릴게요.`,
  ].join(' ');

function buildAnswer(
  question: string,
  group: RescheduleGroup,
  activeStrategy: RescheduleStrategy,
  activeStrategyIndex: number,
  recommendedStrategy: RescheduleStrategy,
  recommendedStrategyIndex: number
) {
  const compactQuestion = question.toLowerCase().replace(/\s+/g, '');

  if (
    compactQuestion.includes('과거') ||
    compactQuestion.includes('유사') ||
    compactQuestion.includes('비슷한위험')
  ) {
    return buildSimilarRiskAnswer(group, recommendedStrategy, recommendedStrategyIndex);
  }

  if (
    compactQuestion.includes('capa') ||
    compactQuestion.includes('capacity') ||
    compactQuestion.includes('장비')
  ) {
    return buildCapacityAnswer(group, activeStrategy, activeStrategyIndex);
  }

  if (compactQuestion.includes('추천') || compactQuestion.includes('승인')) {
    return buildRecommendationAnswer(recommendedStrategy, recommendedStrategyIndex);
  }

  if (compactQuestion.includes('대기') || compactQuestion.includes('wait')) {
    return buildWaitAnswer(activeStrategy, activeStrategyIndex);
  }

  return buildDefaultAnswer(group, activeStrategy, activeStrategyIndex);
}

export function RescheduleFaqChat({
  group,
  activeStrategy,
  activeStrategyIndex,
  recommendedStrategy,
  recommendedStrategyIndex,
}: RescheduleFaqChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcomeMessage(group, recommendedStrategy, recommendedStrategyIndex),
    },
  ]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  // 그룹/추천 전략이 바뀌면 대화 초기화 — 렌더 중 상태 조정 패턴
  const resetKey = `${group.group_id}|${recommendedStrategy.key}|${recommendedStrategyIndex}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setDraft('');
    setIsOpen(false);
    setIsTyping(false);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: buildWelcomeMessage(group, recommendedStrategy, recommendedStrategyIndex),
      },
    ]);
  }

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [isTyping, messages]);

  const submitQuestion = (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmedQuestion,
      },
    ]);
    setDraft('');
    setIsTyping(true);

    const answer = buildAnswer(
      trimmedQuestion,
      group,
      activeStrategy,
      activeStrategyIndex,
      recommendedStrategy,
      recommendedStrategyIndex
    );

    typingTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answer,
        },
      ]);
      setIsTyping(false);
      typingTimerRef.current = null;
    }, 420);
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
