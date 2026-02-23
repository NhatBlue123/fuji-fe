// ─── Flashcard Types (matching BE DTOs) ────────────────

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// ─── User Summary ──────────────────────────────────────
export interface UserSummaryDTO {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

// ─── Card (individual vocabulary card) ─────────────────
export interface CardDTO {
  vocabulary: string;
  meaning: string;
  pronunciation?: string;
  exampleSentence?: string;
  previewUrl?: string | null;
}

export interface CardResponseDTO {
  id: number;
  vocabulary: string;
  meaning: string;
  pronunciation: string | null;
  exampleSentence: string | null;
  previewUrl: string | null;
  cardOrder: number;
  createdAt: string;
}

// ─── User Study Progress ─────────────────────────────────
export interface UserStudyProgressDTO {
  id: number;
  progressPercentage: number;
  rememberedCount: number;
  totalCards: number;
  lastStudiedAt: string | null;
  nextReviewAt: string | null;
  isCompleted: boolean;
}

// ─── FlashCard (a set of cards) ────────────────────────
export interface FlashCardRequestDTO {
  name: string;
  description?: string;
  level?: JlptLevel;
  isPublic?: boolean;
  cards: CardDTO[];
}

export interface FlashCardUpdateDTO {
  name?: string;
  description?: string;
  level?: JlptLevel;
  isPublic?: boolean;
  cards?: CardDTO[];
}

export interface FlashCardResponseDTO {
  id: number;
  name: string;
  description: string | null;
  level: JlptLevel | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  user: UserSummaryDTO;
  cards: CardResponseDTO[];
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  // Study tracking fields
  studyCount?: number;
  userProgress?: UserStudyProgressDTO;
}

export interface FlashCardSummaryDTO {
  id: number;
  name: string;
  level: JlptLevel | null;
  thumbnailUrl: string | null;
  cardCount: number;
}

// ─── FlashList (collection of flashcard sets) ──────────
export interface FlashListRequestDTO {
  title: string;
  description?: string;
  level?: JlptLevel;
  isPublic?: boolean;
  flashcardIds?: number[];
}

export interface FlashListUpdateDTO {
  title?: string;
  description?: string;
  level?: JlptLevel;
  isPublic?: boolean;
}

export interface FlashListResponseDTO {
  id: number;
  title: string;
  description: string | null;
  level: JlptLevel | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  user: UserSummaryDTO;
  flashcards: FlashCardSummaryDTO[];
  cardCount: number;
  averageRating: number;
  ratingCount: number;
  studyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashListPageDTO {
  publicLists: FlashListResponseDTO[];
  myLists: FlashListResponseDTO[];
  pagination: PaginationDTO;
}

// ─── Rating ────────────────────────────────────────────
export interface RatingRequestDTO {
  rating: number; // 1-5
}

// ─── Pagination ────────────────────────────────────────
export interface PaginationDTO {
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── Search Results ────────────────────────────────────
export interface FlashCardSearchResult {
  results: FlashCardResponseDTO[];
  pagination: PaginationDTO;
}

export interface FlashListSearchResult {
  results: FlashListResponseDTO[];
  pagination: PaginationDTO;
}

// ─── List params ───────────────────────────────────────
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
  level?: JlptLevel;
  select?: string;
  page?: number;
  limit?: number;
}
