import type { FlashCardResponseDTO, FlashListResponseDTO } from "@/types/flashcard";

const FALLBACK_LEVEL = "tong-hop";

export function slugifyVietnamese(input: string | null | undefined): string {
  const normalized = (input ?? "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "bo-tu-vung";
}

export function extractTrailingId(slug: string | number | null | undefined): string {
  const raw = String(slug ?? "");
  const match = raw.match(/(?:^|-)(\d+)$/);
  return match?.[1] ?? raw;
}

export function buildFlashcardSlug(
  flashcard: Pick<FlashCardResponseDTO, "id" | "name" | "level">,
): string {
  const level = slugifyVietnamese(String(flashcard.level ?? FALLBACK_LEVEL));
  const name = slugifyVietnamese(flashcard.name);
  return `tu-vung-${level}-${name}-${flashcard.id}`;
}

export function buildFlashcardDetailHref(
  flashcard: Pick<FlashCardResponseDTO, "id" | "name" | "level">,
): string {
  return `/flashcards/detail/${buildFlashcardSlug(flashcard)}`;
}

export function buildFlashcardLearnHref(
  flashcard: Pick<FlashCardResponseDTO, "id" | "name" | "level">,
): string {
  return `/flashcards/learn/${buildFlashcardSlug(flashcard)}`;
}

export function buildFlashcardExerciseHref(
  flashcard: Pick<FlashCardResponseDTO, "id" | "name" | "level">,
  exercise: "multiple-choice" | "fill-blank",
): string {
  return `/flashcards/exercise/${buildFlashcardSlug(flashcard)}/${exercise}`;
}

export function buildFlashcardSettingsHref(
  flashcard: Pick<FlashCardResponseDTO, "id" | "name" | "level">,
): string {
  return `/flashcards/detail/${buildFlashcardSlug(flashcard)}/settings`;
}

export function buildFlashListSlug(
  flashList: Pick<FlashListResponseDTO, "id" | "title" | "level">,
): string {
  const level = slugifyVietnamese(String(flashList.level ?? FALLBACK_LEVEL));
  const title = slugifyVietnamese(flashList.title);
  return `bo-tu-vung-${level}-${title}-${flashList.id}`;
}

export function buildFlashListHref(
  flashList: Pick<FlashListResponseDTO, "id" | "title" | "level">,
): string {
  return `/flashcards/sets/${buildFlashListSlug(flashList)}`;
}
