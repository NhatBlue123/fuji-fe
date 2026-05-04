"use client";

import { use, useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  buildFlashcardExerciseHref,
  buildFlashcardLearnHref,
  buildFlashcardSettingsHref,
  extractTrailingId,
} from "@/lib/flashcardSeo";
import { fetchPublicFlashcard } from "@/lib/publicFlashcardApi";
import { useAuth } from "@/store/hooks";
import { useGetFlashCardByIdQuery } from "@/store/services/flashcardApi";
import type { CardResponseDTO, FlashCardResponseDTO } from "@/types/flashcard";

const LEVEL_LABELS: Record<string, string> = {
  N5: "Cơ bản",
  N4: "Sơ cấp",
  N3: "Trung cấp",
  N2: "Cao cấp",
  N1: "Nâng cao",
};

function clampPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatRelativeDate(dateStr?: string | null) {
  if (!dateStr) return "Chưa có dữ liệu";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return date.toLocaleDateString("vi-VN");
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function formatNextReview(dateStr?: string | null) {
  if (!dateStr) return "Chưa lên lịch";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Chưa lên lịch";

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Đang đến hạn";
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Ngày mai";
  if (diffDays < 7) return `${diffDays} ngày nữa`;
  return date.toLocaleDateString("vi-VN");
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function getInitials(name?: string | null) {
  const source = name?.trim();
  if (!source) return "F";
  const parts = source.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function matchesSearch(card: CardResponseDTO, query: string) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return [card.vocabulary, card.meaning, card.pronunciation, card.exampleSentence]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export default function FlashcardSetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const id = extractTrailingId(slug);
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  const {
    data: authedFlashcard,
    isLoading: authedLoading,
    error: authedError,
  } = useGetFlashCardByIdQuery(id, {
    skip: !isInitialized || !isAuthenticated,
  });

  const [publicState, setPublicState] = useState<{
    id: string;
    data: FlashCardResponseDTO | null;
    error: boolean;
  }>({ id: "", data: null, error: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [imageOnly, setImageOnly] = useState(false);

  useEffect(() => {
    if (!isInitialized || isAuthenticated) return;

    let cancelled = false;

    fetchPublicFlashcard(id)
      .then((data) => {
        if (cancelled) return;
        setPublicState({ id, data: data ?? null, error: !data });
      })
      .catch(() => {
        if (!cancelled) setPublicState({ id, data: null, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, isInitialized]);

  const currentPublicState =
    publicState.id === id ? publicState : { id, data: null, error: false };
  const flashcard = isAuthenticated ? authedFlashcard : currentPublicState.data;
  const isLoading = isAuthenticated
    ? authedLoading
    : (!currentPublicState.data && !currentPublicState.error) || !isInitialized;
  const hasError = isAuthenticated
    ? Boolean(authedError)
    : currentPublicState.error;

  const cards = useMemo(() => flashcard?.cards ?? [], [flashcard?.cards]);
  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        if (imageOnly && !card.previewUrl) return false;
        return matchesSearch(card, searchTerm.trim());
      }),
    [cards, imageOnly, searchTerm],
  );

  const cardCount = flashcard?.cardCount || cards.length;
  const imageCount = cards.filter((card) => Boolean(card.previewUrl)).length;
  const exampleCount = cards.filter((card) =>
    Boolean(card.exampleSentence),
  ).length;
  const studyMinutes = Math.max(1, Math.ceil(cardCount * 0.35));
  const progressPercent = clampPercent(
    flashcard?.userProgress?.progressPercentage,
  );
  const rememberedCount = flashcard?.userProgress?.rememberedCount ?? 0;
  const studiedCards = flashcard?.userProgress?.studiedCards ?? 0;
  const creatorName =
    flashcard?.user?.fullName || flashcard?.user?.username || "FUJI";

  const learnHref = flashcard ? buildFlashcardLearnHref(flashcard) : "#";
  const settingsHref = flashcard ? buildFlashcardSettingsHref(flashcard) : "#";
  const multipleChoiceHref = flashcard
    ? buildFlashcardExerciseHref(flashcard, "multiple-choice")
    : "#";
  const fillBlankHref = flashcard
    ? buildFlashcardExerciseHref(flashcard, "fill-blank")
    : "#";

  const requireLogin = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    router.push("/login");
  };

  if (!isInitialized || isLoading) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">
          progress_activity
        </span>
      </main>
    );
  }

  if (hasError || !flashcard) {
    return (
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-red-400">
          error
        </span>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Không tìm thấy bộ thẻ
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bộ thẻ này có thể đã bị xoá hoặc không còn công khai.
          </p>
        </div>
        <Link
          href="/flashcards"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại danh sách
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-1 overflow-y-auto bg-background text-foreground">
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-6 md:grid-cols-[minmax(0,1fr)_340px] md:px-8 lg:px-10">
          <div className="flex min-w-0 flex-col gap-6">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link
                href="/flashcards"
                className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
              >
                <span className="material-symbols-outlined text-base">
                  arrow_back
                </span>
                Flashcard
              </Link>
              <span>/</span>
              <span className="truncate text-foreground">{flashcard.name}</span>
            </nav>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {flashcard.level && (
                  <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    {flashcard.level} ·{" "}
                    {LEVEL_LABELS[String(flashcard.level)] ?? "Tổng hợp"}
                  </span>
                )}
                <span className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
                  {flashcard.isPublic ? "Công khai" : "Riêng tư"}
                </span>
                <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {formatNumber(cardCount)} thẻ
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  {flashcard.name}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  {flashcard.description?.trim() || "Bộ thẻ chưa có mô tả."}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-rose-500">
                    schedule
                  </span>
                  Khoảng {studyMinutes} phút
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-500">
                    image
                  </span>
                  {formatNumber(imageCount)} thẻ có ảnh
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-amber-500">
                    edit_note
                  </span>
                  {formatNumber(exampleCount)} câu ví dụ
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-sky-500">
                    update
                  </span>
                  Cập nhật {formatRelativeDate(flashcard.updatedAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href={learnHref}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    <span className="material-symbols-outlined text-xl">
                      play_circle
                    </span>
                    Bắt đầu học
                  </Link>
                  <Link
                    href={multipleChoiceHref}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    <span className="material-symbols-outlined text-xl">
                      quiz
                    </span>
                    Trắc nghiệm
                  </Link>
                  <Link
                    href={fillBlankHref}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    <span className="material-symbols-outlined text-xl">
                      edit
                    </span>
                    Điền từ
                  </Link>
                  <Link
                    href={settingsHref}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    <span className="material-symbols-outlined text-xl">
                      tune
                    </span>
                    Cài đặt
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={requireLogin}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-xl">lock</span>
                  Đăng nhập để học
                </button>
              )}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              {flashcard.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={flashcard.thumbnailUrl}
                  alt={flashcard.name}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(244,63,94,0.14),transparent_30%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]">
                  <div className="flex size-20 items-center justify-center rounded-lg border border-border bg-card text-3xl font-bold">
                    {getInitials(flashcard.name)}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                {flashcard.user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flashcard.user.avatarUrl}
                    alt={creatorName}
                    className="size-11 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                    {getInitials(creatorName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {creatorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Người tạo bộ thẻ
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 md:grid-cols-3 md:px-8 lg:px-10">
        <MetricPanel
          icon="trending_up"
          label="Tiến độ"
          value={`${progressPercent}%`}
          detail={
            isAuthenticated
              ? flashcard.userProgress?.isCompleted
                ? "Đã hoàn thành"
                : flashcard.userProgress
                  ? "Đang học"
                  : "Chưa bắt đầu"
              : "Đăng nhập để lưu tiến độ"
          }
          accent="rose"
        />
        <MetricPanel
          icon="psychology"
          label="Đã thuộc"
          value={`${formatNumber(rememberedCount)}/${formatNumber(cardCount)}`}
          detail={
            studiedCards > 0
              ? `${formatNumber(studiedCards)} thẻ đã học`
              : "Chưa có lượt học"
          }
          accent="emerald"
        />
        <MetricPanel
          icon="event_upcoming"
          label="Ôn tiếp"
          value={formatNextReview(flashcard.userProgress?.nextReviewAt)}
          detail={`Học gần nhất: ${formatRelativeDate(
            flashcard.userProgress?.lastStudiedAt,
          )}`}
          accent="sky"
        />
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8 lg:px-10">
        <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Danh sách từ vựng</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hiển thị {formatNumber(filteredCards.length)} /{" "}
              {formatNumber(cards.length)} thẻ trong bộ này.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-[260px]">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                search
              </span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm từ, nghĩa, cách đọc..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <button
              type="button"
              onClick={() => setImageOnly((current) => !current)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                imageOnly
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="material-symbols-outlined text-lg">image</span>
              Có ảnh
            </button>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
            <span className="material-symbols-outlined text-5xl text-muted-foreground">
              style
            </span>
            <p className="mt-3 font-semibold">Không có thẻ phù hợp</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc ảnh.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-16 px-4 py-3">STT</th>
                    <th className="w-20 px-3 py-3">Ảnh</th>
                    <th className="px-3 py-3">Từ vựng</th>
                    <th className="px-3 py-3">Cách đọc</th>
                    <th className="px-3 py-3">Nghĩa</th>
                    <th className="px-3 py-3">Ví dụ</th>
                    <th className="w-16 px-4 py-3 text-right">Nghe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCards.map((card, index) => (
                    <VocabularyRow key={card.id} card={card} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricPanel({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  accent: "rose" | "emerald" | "sky";
}) {
  const accentClass = {
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  }[accent];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className={`flex size-12 items-center justify-center rounded-lg ${accentClass}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function VocabularyRow({
  card,
  index,
}: {
  card: CardResponseDTO;
  index: number;
}) {
  const order =
    typeof card.cardOrder === "number" ? card.cardOrder + 1 : index + 1;

  return (
    <tr className="transition-colors hover:bg-muted/35">
      <td className="px-4 py-2 align-middle text-sm font-semibold text-muted-foreground">
        {order}
      </td>
      <td className="px-3 py-2 align-middle">
        <CardImage card={card} />
      </td>
      <td className="max-w-[220px] px-3 py-2 align-middle">
        <div className="truncate text-base font-semibold text-foreground">
          {card.vocabulary}
        </div>
      </td>
      <td className="max-w-[180px] px-3 py-2 align-middle text-muted-foreground">
        <span className="truncate block">
          {card.pronunciation || "—"}
        </span>
      </td>
      <td className="max-w-[240px] px-3 py-2 align-middle">
        <span className="block truncate font-medium">{card.meaning}</span>
      </td>
      <td className="max-w-[360px] px-3 py-2 align-middle text-muted-foreground">
        <span className="block truncate">
          {card.exampleSentence || "—"}
        </span>
      </td>
      <td className="px-4 py-2 align-middle text-right">
        <button
          type="button"
          onClick={() => speakText(card.vocabulary)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          aria-label={`Nghe phát âm ${card.vocabulary}`}
        >
          <span className="material-symbols-outlined text-lg">volume_up</span>
        </button>
      </td>
    </tr>
  );
}

function CardImage({ card }: { card: CardResponseDTO }) {
  const sizeClass = "size-12";

  if (!card.previewUrl) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded-lg bg-muted text-muted-foreground`}
      >
        <span className="material-symbols-outlined text-3xl">image_not_supported</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} overflow-hidden rounded-lg bg-muted`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.previewUrl}
        alt={card.vocabulary}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
}
