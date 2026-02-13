export interface FlashcardSet {
  id: number;
  name: string;
  description: string;
  lesson: string;
  numCards: number;
  createdAt: string;
  status: string;
  lessonColor?: string;
  isPublic?: boolean;
  level?: "N5" | "N4" | "N3" | "N2" | "N1";
}

export interface Flashcard {
  id: number;
  kanji: string;
  hiragana: string;
  meaning: string;
  example: string;
  lesson: string;
  type: string;
  studyStatus?: "learned" | "review" | "not_learned";
  viewCount: number;
}

export interface CreateFlashcardPayload {
  kanji: string;
  hiragana: string;
  meaning: string;
  example: string;
  lesson: string;
  type: string;
}

export function buildFlashcardFormData(payload: CreateFlashcardPayload, thumbnail?: File): FormData {
  const formData = new FormData();
  formData.append("flashcard", JSON.stringify(payload));
  if (thumbnail) {
    formData.append("thumbnail", thumbnail);
  }
  return formData;
}
