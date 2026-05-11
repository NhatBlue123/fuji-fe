export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";

export type TestType = 
  | "full_test" 
  | "vocabulary" 
  | "grammar" 
  | "reading" 
  | "listening";

export type SectionType =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING";

// Match backend JlptTestResponseDTO
export interface JlptTest {
  id: number;
  title: string;
  level: JLPTLevel;
  testType: TestType;
  description?: string;
  duration: number; // in minutes
  totalQuestions: number;
  maxScore: number;
  passScore: number;
  languageKnowledgePassScore?: number;
  readingPassScore?: number;
  listeningPassScore?: number;
  attemptCount: number;
  averageScore: number;
  isPublished: boolean;
  isAntiCheatEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  mondaiCounts?: Record<number, number>;
  questions?: JlptQuestion[];
}

// Match backend QuestionResponseDTO
export interface JlptQuestion {
  id: number;
  testId: number;
  mondaiNumber: number;
  mondaiTitle?: string;
  parentId?: number | null;
  questionOrder: number;
  section: SectionType;
  contentText: string;
  imageMedia?: MediaInfo;
  audioMedia?: MediaInfo;
  options?: string[];
  correctOption?: number;
  explanation?: string;
  points: number;
  createdAt: string;
  children?: JlptQuestion[];
  parent?: JlptQuestion;  // populated on frontend when flattening tree for exam
  subLabel?: string;
  isReadingPassage?: boolean;
}

export interface MediaInfo {
  id: number;
  publicId: string;
  url: string;
  resourceType: string;
  format?: string;
  size?: number;
}

// Match backend SubmitTestAttemptDTO
export interface TestAttemptSubmission {
  testId: number;
  userAnswers: string; // JSON string: "[{\"questionId\":1,\"selected\":2}]"
  timeSpent: number; // in seconds
}

// For internal use before serialization
export interface UserAnswer {
  questionId: number;
  selected: number;
}

// Match backend TestAttemptResponseDTO
export interface TestAttemptResult {
  id: number;
  userId: number;
  testId: number;
  totalScore: number;
  isPassed: boolean;
  languageKnowledgeScore: number;
  readingScore: number;
  listeningScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  userAnswers: string; // JSON string with results
  startedAt: string;
  completedAt?: string;
  test?: JlptTest; // Included for history display
}

// For displaying individual answer details
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
