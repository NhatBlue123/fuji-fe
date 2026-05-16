"use client";

import { useEffect, useCallback } from "react";
import { publishStomp, subscribeStomp, STOMP_JSON_HEADERS } from "@/lib/stomp";
import type { IMessage } from "@stomp/stompjs";

export interface QuizQuestionPublic {
  id: number;
  quizId: number;
  questionIndex: number;
  questionType: string;
  questionText: string;
  optionsJson?: string | null;
  // New fields for enhanced quiz types
  quizType?: string;
  mediaContent?: string | null;
  passageText?: string | null;
  groupKey?: string | null;
  passageQuestions?: QuizQuestionPublic[];
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
  useEffect(() => {
    if (!lessonId || !token) return;

    const base = `/topic/room/${lessonId}`;
    const unsubQuestion = subscribeStomp(token, `${base}/quiz`, (frame: IMessage) => {
        try {
          const q = JSON.parse(frame.body) as QuizQuestionPublic;
          onQuestion?.(q);
        } catch {
          /* ignore */
        }
      }
    );
    const unsubSubmission = subscribeStomp(token, `${base}/quiz/submission`, (frame: IMessage) => {
        try {
          const s = JSON.parse(frame.body) as QuizSubmissionEvent;
          onSubmission?.(s);
        } catch {
          /* ignore */
        }
      }
    );
    const unsubReveal = subscribeStomp(token, `${base}/quiz/answer`, (frame: IMessage) => {
        try {
          const r = JSON.parse(frame.body) as QuizRevealEvent;
          onReveal?.(r);
        } catch {
          /* ignore */
        }
      }
    );
    const unsubEnded = subscribeStomp(token, `${base}/quiz/ended`, (frame: IMessage) => {
        try {
          const e = JSON.parse(frame.body) as QuizEndedEvent;
          onEnded?.(e);
        } catch {
          /* ignore */
        }
      }
    );

    return () => {
      unsubQuestion();
      unsubSubmission();
      unsubReveal();
      unsubEnded();
    };
  }, [lessonId, token, onQuestion, onSubmission, onReveal, onEnded]);

  const publish = useCallback(
    (dest: string, body: object) => {
      if (!lessonId || !token) return;
      publishStomp(token, {
        destination: `/app${dest}`,
        body: JSON.stringify(body),
        headers: STOMP_JSON_HEADERS,
      });
    },
    [lessonId, token]
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
