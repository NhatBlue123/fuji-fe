import type { FlashCardResponseDTO, FlashListResponseDTO } from "@/types/flashcard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api";

interface ApiResponse<T> {
  data?: T;
}

interface FlashcardListResponse {
  flashCards?: FlashCardResponseDTO[];
  results?: FlashCardResponseDTO[];
  content?: FlashCardResponseDTO[];
}

export async function fetchPublicFlashcards({
  page = 0,
  limit = 100,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<FlashCardResponseDTO[]> {
  try {
    const url = new URL(`${API_BASE}/flashcards`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const json: ApiResponse<FlashcardListResponse | FlashCardResponseDTO[]> =
      await response.json();
    const data = json.data;

    if (Array.isArray(data)) return data;
    return data?.flashCards ?? data?.results ?? data?.content ?? [];
  } catch {
    return [];
  }
}

export async function fetchPublicFlashcard(
  id: number | string,
): Promise<FlashCardResponseDTO | null> {
  try {
    const response = await fetch(`${API_BASE}/flashcards/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const json: ApiResponse<FlashCardResponseDTO> = await response.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchPublicFlashList(
  id: number | string,
): Promise<FlashListResponseDTO | null> {
  try {
    const response = await fetch(`${API_BASE}/flashlists/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const json: ApiResponse<FlashListResponseDTO> = await response.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
