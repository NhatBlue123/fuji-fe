export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

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

export interface CardDTO {
  id?: number;
  vocabulary: string;
  meaning: string;
  pronunciation?: string;
  exampleSentence?: string;
  previewUrl?: string | null;
  cardOrder?: number;
  createdAt?: string;
}

export interface CardResponseDTO extends CardDTO {
  id: number;
}

export interface UserStudyProgressDTO {
  userId: number;
  flashCardId: number;
  progressPercentage: number;
  rememberedCount: number;
  totalCards: number;
  lastStudiedAt?: string;
  nextReviewAt?: string;
  isCompleted?: boolean;
}

export interface UserDTO {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export interface FlashCardResponseDTO {
  id: number;
  name: string;
  description?: string;
  level?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  cardCount: number;
  cards: CardResponseDTO[];
  user: UserDTO;
  userProgress?: UserStudyProgressDTO;
  studyCount: number;
  createdAt?: string;
  updatedAt?: string;
  rating?: number;
}

export interface FlashListResponseDTO {
  id: number;
  title: string;
  description?: string;
  level?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  flashcards: any[];
  user: UserDTO;
  rating?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashListPageDTO {
  myLists: FlashListResponseDTO[];
  publicLists: FlashListResponseDTO[];
  pagination: PaginationDTO;
}

export interface FlashCardSearchResult {
  results: FlashCardResponseDTO[];
  pagination: PaginationDTO;
}

export interface FlashListSearchResult {
  results: FlashListResponseDTO[];
  pagination: PaginationDTO;
}

export interface PaginationDTO {
  page?: number;
  size?: number;
  total?: number;
  totalPages?: number;
}

export interface RatingRequestDTO {
  rating: number;
}

export interface FlashCardListParams {
  page?: number;
  limit?: number;
}

export interface FlashListListParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  query?: string;
  level?: string;
  select?: string;
  page?: number;
  limit?: number;
}

export function buildFlashcardFormData(
  payload: CreateFlashcardPayload,
  thumbnail?: File,
): FormData {
  const formData = new FormData();
  formData.append("flashcard", JSON.stringify(payload));
  if (thumbnail) {
    formData.append("thumbnail", thumbnail);
  }
  return formData;
}
