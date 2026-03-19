import type { SectionType } from "./jlpt";

export interface AnswerReview {
  questionId: number;
  mondaiNumber: number;
  mondaiTitle?: string;
  questionOrder: number;
  section: SectionType;

  contentText: string;
  options?: string; // JSON string from backend
  correctOption?: number;
  explanation?: string;

  selected?: number;
  isCorrect: boolean;
}

export interface QuestionReportPayload {
  questionId: number;
  attemptId?: number;
  reason: string;
}

export interface QuestionReport {
  id: number;
  questionId: number;
  attemptId?: number;
  userId: number;
  reason: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  adminNote?: string;
  questionContent: string;
  testTitle: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
}

