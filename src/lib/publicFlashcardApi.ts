import type { FlashCardResponseDTO, FlashListResponseDTO } from "@/types/flashcard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8181/api";

interface ApiResponse<T> {
  data?: T;
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
