"use client";

import { useCallback } from "react";
import { useRecordActivityMutation } from "@/store/services/progressApi";
import { toast } from "sonner";

export type ActivityType = "LESSON" | "FLASHCARD" | "JLPT_EXAM" | "CONVERSATION" | "VIDEO_CALL";

interface RecordActivityParams {
  activityType: ActivityType;
  durationMinutes?: number;
  cardsReviewed?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  source?: string;
}

export function useRecordActivity() {
  const [recordActivity] = useRecordActivityMutation();

  const record = useCallback(async (params: RecordActivityParams): Promise<boolean> => {
    try {
      const request = {
        activityType: params.activityType,
        durationMinutes: params.durationMinutes ?? 0,
        cardsReviewed: params.cardsReviewed ?? 0,
        correctAnswers: params.correctAnswers ?? 0,
        totalQuestions: params.totalQuestions ?? 0,
        source: params.source ?? "app",
      };

      await recordActivity(request).unwrap();
      return true;
    } catch (error) {
      console.error("[useRecordActivity] Error:", error);
      return false;
    }
  }, [recordActivity]);

  const recordWithFeedback = useCallback(async (params: RecordActivityParams): Promise<boolean> => {
    const success = await record(params);
    if (success) {
      toast.success("Đã ghi nhận hoạt động học tập! 🔥");
    } else {
      toast.error("Không thể ghi nhận hoạt động");
    }
    return success;
  }, [record]);

  return {
    record,
    recordWithFeedback,
  };
}

// Quick record functions
export async function recordFlashcardActivity(
  recordActivity: ReturnType<typeof useRecordActivityMutation>[0],
  stats?: { cardsReviewed?: number; correctAnswers?: number; totalQuestions?: number; durationMinutes?: number }
): Promise<boolean> {
  try {
    await recordActivity({
      activityType: "FLASHCARD",
      durationMinutes: stats?.durationMinutes ?? 5,
      cardsReviewed: stats?.cardsReviewed ?? 1,
      correctAnswers: stats?.correctAnswers ?? 0,
      totalQuestions: stats?.totalQuestions ?? 1,
      source: "flashcard",
    }).unwrap();
    return true;
  } catch {
    return false;
  }
}

export async function recordLessonActivity(
  recordActivity: ReturnType<typeof useRecordActivityMutation>[0],
  stats?: { lessonsCompleted?: number; durationMinutes?: number }
): Promise<boolean> {
  try {
    await recordActivity({
      activityType: "LESSON",
      durationMinutes: stats?.durationMinutes ?? 15,
      cardsReviewed: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      source: "lesson",
    }).unwrap();
    return true;
  } catch {
    return false;
  }
}

export async function recordAIChatActivity(
  recordActivity: ReturnType<typeof useRecordActivityMutation>[0],
  durationMinutes?: number
): Promise<boolean> {
  try {
    await recordActivity({
      activityType: "CONVERSATION",
      durationMinutes: durationMinutes ?? 10,
      cardsReviewed: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      source: "ai-chat",
    }).unwrap();
    return true;
  } catch {
    return false;
  }
}

export async function recordJLPTActivity(
  recordActivity: ReturnType<typeof useRecordActivityMutation>[0],
  stats?: { correctAnswers?: number; totalQuestions?: number; durationMinutes?: number }
): Promise<boolean> {
  try {
    await recordActivity({
      activityType: "JLPT_EXAM",
      durationMinutes: stats?.durationMinutes ?? 30,
      cardsReviewed: 0,
      correctAnswers: stats?.correctAnswers ?? 0,
      totalQuestions: stats?.totalQuestions ?? 0,
      source: "jlpt",
    }).unwrap();
    return true;
  } catch {
    return false;
  }
}
