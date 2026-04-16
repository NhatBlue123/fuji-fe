"use client";

import { useEffect, useRef, useCallback } from "react";
import { getStompClient, STOMP_JSON_HEADERS } from "@/lib/stomp";
import type { Client, IMessage, StompSubscription } from "@stomp/stompjs";

export interface QuizQuestionPublic {
  id: number;
  quizId: number;
  questionIndex: number;
  questionType: string;
  questionText: string;
  optionsJson?: string | null;
}

export interface QuizSubmissionEvent {
  userId: number;
  userName: string;
  questionId: number;
  correct: boolean;
  scorePoints: number;
}

export interface QuizRevealEvent {
  questionId: number;
  correctAnswer: string;
  explanation?: string | null;
}

export interface QuizEndedEvent {
  quizId: number;
  scoresByUser: Record<string, number>;
}

interface UseQuizStompOptions {
  lessonId: number | null;
  token: string | null;
  onQuestion?: (q: QuizQuestionPublic) => void;
  onSubmission?: (s: QuizSubmissionEvent) => void;
  onReveal?: (r: QuizRevealEvent) => void;
  onEnded?: (e: QuizEndedEvent) => void;
}

export function useQuizStomp({
  lessonId,
  token,
  onQuestion,
  onSubmission,
  onReveal,
  onEnded,
}: UseQuizStompOptions) {
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    if (!lessonId || !token) return;

    const client = getStompClient(token);
    clientRef.current = client;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const subscribe = () => {
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];

      const base = `/topic/room/${lessonId}`;
      const subQ = client.subscribe(`${base}/quiz`, (frame: IMessage) => {
        try {
          const q = JSON.parse(frame.body) as QuizQuestionPublic;
          onQuestion?.(q);
        } catch {
          /* ignore */
        }
      });
      const subS = client.subscribe(`${base}/quiz/submission`, (frame: IMessage) => {
        try {
          const s = JSON.parse(frame.body) as QuizSubmissionEvent;
          onSubmission?.(s);
        } catch {
          /* ignore */
        }
      });
      const subR = client.subscribe(`${base}/quiz/answer`, (frame: IMessage) => {
        try {
          const r = JSON.parse(frame.body) as QuizRevealEvent;
          onReveal?.(r);
        } catch {
          /* ignore */
        }
      });
      const subE = client.subscribe(`${base}/quiz/ended`, (frame: IMessage) => {
        try {
          const e = JSON.parse(frame.body) as QuizEndedEvent;
          onEnded?.(e);
        } catch {
          /* ignore */
        }
      });
      subsRef.current = [subQ, subS, subR, subE];
    };

    const waitUntilConnected = () => {
      if (cancelled) return;
      if (client.connected) {
        subscribe();
        return;
      }
      retryTimer = setTimeout(waitUntilConnected, 150);
    };

    waitUntilConnected();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];
    };
  }, [lessonId, token, onQuestion, onSubmission, onReveal, onEnded]);

  const publish = useCallback(
    (dest: string, body: object) => {
      if (!lessonId || !clientRef.current?.connected) return;
      clientRef.current.publish({
        destination: `/app${dest}`,
        body: JSON.stringify(body),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId]
  );

  const startQuiz = useCallback(
    (quizId: number, questionIndex = 0) => {
      publish(`/quiz/${lessonId}/start`, { quizId, questionIndex });
    },
    [lessonId, publish]
  );

  const nextQuestion = useCallback(
    (quizId: number, questionIndex: number) => {
      publish(`/quiz/${lessonId}/next`, { quizId, questionIndex });
    },
    [lessonId, publish]
  );

  const submitLive = useCallback(
    (quizId: number, questionId: number, answer: string) => {
      publish(`/quiz/${lessonId}/submit`, { quizId, questionId, answer });
    },
    [lessonId, publish]
  );

  const sendReveal = useCallback(
    (questionId: number) => {
      publish(`/quiz/${lessonId}/reveal`, { questionId });
    },
    [lessonId, publish]
  );

  const endQuiz = useCallback(
    (quizId: number) => {
      publish(`/quiz/${lessonId}/end`, { quizId });
    },
    [lessonId, publish]
  );

  return { startQuiz, nextQuestion, submitLive, sendReveal, endQuiz };
}
