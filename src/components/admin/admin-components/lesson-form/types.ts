// ─── Lesson Form types ─────────────────────────────────

export type LessonType = "video" | "task";
export type VideoType = "youtube" | "upload";
export type TaskType =
  | "multiple_choice"
  | "fill_blank"
  | "listening"
  | "matching"
  | "speaking"
  | "reading";

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
}

export interface FillBlankItem {
  id: string;
  sentence: string;
  answer: string;
  hints: string[];
}

export interface MatchingItem {
  left: string;
  right: string;
}

export interface ListeningQuestion {
  id: string;
  question: string;
  options: { key: string; text: string }[];
  answer: string;
}

export const TASK_TYPE_OPTIONS: {
  value: TaskType;
  label: string;
  icon: string;
}[] = [
  { value: "multiple_choice", label: "Trắc nghiệm", icon: "ListChecks" },
  { value: "fill_blank", label: "Điền từ", icon: "PenLine" },
  { value: "listening", label: "Nghe hiểu", icon: "Volume2" },
  { value: "matching", label: "Ghép cặp", icon: "Shuffle" },
  { value: "speaking", label: "Phát âm", icon: "Mic" },
  { value: "reading", label: "Đọc hiểu", icon: "BookOpen" },
];
