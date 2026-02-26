// ─── Task Data Types (parsed from taskData JSON) ──────

export interface TaskDataEnvelope {
  type: string;
  title: string;
  instructions: string;
  audioUrl?: string;
  items: unknown[];
}

export interface MultipleChoiceItem {
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

export interface ListeningItem {
  id: string;
  question: string;
  options: { key: string; text: string }[];
  answer: string;
}

export function parseTaskData(raw: string | null): TaskDataEnvelope | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TaskDataEnvelope;
  } catch {
    return null;
  }
}
