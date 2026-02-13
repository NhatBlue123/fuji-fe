export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";

export type QuestionType =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "KANJI";

export interface JlptTest {
  id: number;
  title: string;
  level: JLPTLevel;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
  coverImage?: string;
  description?: string;
  questions?: JlptQuestion[];
}

export interface JlptQuestion {
  id: number;
  type: QuestionType;
  content: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  parentId?: number | null;
  children?: JlptQuestion[];
  orderIndex?: number;
  audioUrl?: string;
  imageUrl?: string;
}

export interface TestAttemptSubmission {
  testId: number;
  answers: UserAnswer[];
}

export interface UserAnswer {
  questionId: number;
  selected: number;
}

export interface TestAttemptResult {
  id: number;
  testId: number;
  userId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  timeSpent: number; // in seconds
  passed: boolean;
  answers: AnswerDetail[];
}

export interface AnswerDetail {
  questionId: number;
  selected: number;
  correct: number;
  isCorrect: boolean;
}

// Pagination response
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
