export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5";

export interface JlptQuestion {
    id: number;
    testId: number;
    section: string;
    mondaiNumber: number;
    questionOrder: number;
    contentText: string | null;
    options: string | string[]; // Can be JSON string or array
    correctOption: number | null;
    explanation: string | null;
    parentId: number | null;
    children?: JlptQuestion[];
    isReadingPassage?: boolean;
}

export interface AnswerDetail {
    question_id: number;
    selected: number;
    correct: number;
    is_correct: boolean;
}

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
    timeSpent: number;
    userAnswers: string; // JSON string of AnswerDetail[]
    startedAt: string;
    completedAt: string;
}

export interface JLPTTest {
    id: number;
    title: string;
    level: JLPTLevel;
    duration: number;
    totalQuestions: number;
    status: "DRAFT" | "PUBLISHED";
    questions?: JlptQuestion[];
    createdAt: string;
    updatedAt: string;
}
