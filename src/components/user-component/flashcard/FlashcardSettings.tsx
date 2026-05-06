"use client";

import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useGetFlashCardByIdQuery,
  useUpdateFlashCardMutation,
  useAddCardToFlashCardMutation,
} from "@/store/services/flashcardApi";
import {
  useGetActiveFlashcardImagePacksQuery,
  useGetFlashcardImageQuotaQuery,
  usePurchaseFlashcardImagePackMutation,
} from "@/store/services/userMonetizationApi";
import { getMockImage } from "@/lib/mockImages";
import { useFlashcardPipeline } from "@/hooks/useFlashcardPipeline";
import { resolveImage, searchImages } from "@/lib/flashcard-pipeline";
import TermPreviewList from "@/components/user-component/flashcard/TermPreviewList";
import { buildFlashcardDetailHref } from "@/lib/flashcardSeo";

interface CardEdit {
  id?: number;
  vocabulary: string;
  meaning: string;
  pronunciation: string;
  exampleSentence: string;
  previewUrl: string | null;
  isNew?: boolean;
  _tempId?: string;
}

type TabType = "info" | "cards" | "add";
type AddModeType = "single" | "multiple";

interface FlashcardSettingsProps {
  id: string;
  isModal?: boolean;
  onClose?: () => void;
}

/**
 * Parse multiline input with optional example and pronunciation.
 * Format: vocabulary - meaning <ví dụ câu> :/phát âm/:
 * Both <ví dụ> and :/phát âm/: are optional.
 */
function parseMultiLine(line: string): {
  vocabulary: string;
  meaning: string;
  pronunciation: string;
  exampleSentence: string;
} {
  let remaining = line.trim();
  let pronunciation = "";
  let exampleSentence = "";

  // Extract pronunciation :/.../:
  const pronMatch = remaining.match(/:\/(.+?)\/:/);
  if (pronMatch) {
    pronunciation = pronMatch[1].trim();
    remaining = remaining.replace(pronMatch[0], "").trim();
  }

  // Extract example <...>
  const exMatch = remaining.match(/<(.+?)>/);
  if (exMatch) {
    exampleSentence = exMatch[1].trim();
    remaining = remaining.replace(exMatch[0], "").trim();
  }

  // Now parse vocabulary - meaning
  const dashIdx = remaining.indexOf(" - ");
  if (dashIdx !== -1) {
    return {
      vocabulary: remaining.substring(0, dashIdx).trim(),
      meaning: remaining.substring(dashIdx + 3).trim(),
      pronunciation,
      exampleSentence,
    };
  }

  const colonSpaceIdx = remaining.indexOf(": ");
  if (colonSpaceIdx !== -1) {
    return {
      vocabulary: remaining.substring(0, colonSpaceIdx).trim(),
      meaning: remaining.substring(colonSpaceIdx + 2).trim(),
      pronunciation,
      exampleSentence,
    };
  }

  return {
    vocabulary: remaining,
    meaning: "",
    pronunciation,
    exampleSentence,
  };
}

export default function FlashcardSettings({
  id,
  isModal = false,
  onClose,
}: FlashcardSettingsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: flashcard, isLoading } = useGetFlashCardByIdQuery(id);
  const [updateFlashCard] = useUpdateFlashCardMutation();
  const [addCardToFlashCard] = useAddCardToFlashCardMutation();
  const {
    data: imageQuota,
    isFetching: isImageQuotaFetching,
    refetch: refetchImageQuota,
  } = useGetFlashcardImageQuotaQuery();
  const [showImagePackModal, setShowImagePackModal] = useState(false);
  const { data: imagePacks = [], isFetching: isFetchingImagePacks } =
    useGetActiveFlashcardImagePacksQuery(undefined, {
      skip: !showImagePackModal,
    });
  const [purchaseImagePack, purchaseImagePackState] =
    usePurchaseFlashcardImagePackMutation();
  const detailHref = flashcard
    ? buildFlashcardDetailHref(flashcard)
    : `/flashcards/detail/${id}`;

  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [addMode, setAddMode] = useState<AddModeType>("single");
  const [cards, setCards] = useState<CardEdit[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Card editing state
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  // Flashcard info state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);

  // Single card form state (controlled)
  const [singleVocab, setSingleVocab] = useState("");
  const [singleMeaning, setSingleMeaning] = useState("");
  const [singlePronunciation, setSinglePronunciation] = useState("");
  const [singleExample, setSingleExample] = useState("");
  const [singlePreviewUrl, setSinglePreviewUrl] = useState("");
  const [singleSearchResults, setSingleSearchResults] = useState<
    { url: string; title: string }[]
  >([]);
  const [singleSearching, setSingleSearching] = useState(false);
  const [singleImageError, setSingleImageError] = useState("");

  const [singleResolving, setSingleResolving] = useState(false);
  const imageQuotaRemaining = Number(imageQuota?.totalRemaining ?? 0);
  const imageQuotaDaily = Number(imageQuota?.dailyQuota ?? 0);
  const isImageQuotaEmpty = Boolean(imageQuota) && imageQuotaRemaining <= 0;
  const imageQuotaPercent =
    imageQuotaDaily > 0 ? imageQuotaRemaining / imageQuotaDaily : 1;
  const imageQuotaTone =
    isImageQuotaEmpty ? "text-red-400" : imageQuotaPercent <= 0.2 ? "text-amber-400" : "text-muted-foreground";
  const imageQuotaExhaustedMessage =
    t("monetization.messages.imageUsageExhausted");

  const handlePurchaseImagePack = async (packId: number) => {
    try {
      await purchaseImagePack(packId).unwrap();
      toast.success(t("monetization.messages.buyImageBundleSuccess"));
      setShowImagePackModal(false);
      refetchImageQuota();
    } catch {
      toast.error(t("monetization.messages.buyImageBundleFailed"));
    }
  };

  const handleSingleImageSelect = (imageUrl: string) => {
    if (isImageQuotaEmpty) {
      setSingleImageError(imageQuotaExhaustedMessage);
      return;
    }
    setSingleImageError("");
    // Immediately show the raw URL as preview
    setSinglePreviewUrl(imageUrl);
    // Resolve to Cloudinary URL in background
    setSingleResolving(true);
    resolveImage(imageUrl)
      .then((resolved) => {
        setSinglePreviewUrl(resolved.cloudinaryUrl);
      })
      .catch((err) => {
        console.error("Failed to resolve single image:", err);
        setSingleImageError(err instanceof Error ? err.message : "Không thể lưu ảnh đã chọn.");
        // Keep the raw URL as fallback
      })
      .finally(() => {
        setSingleResolving(false);
        refetchImageQuota();
      });
  };

  // Multi-add state
  const [multiContent, setMultiContent] = useState("");
  const [multiImageWarning, setMultiImageWarning] = useState("");
  const [selectedTermImages, setSelectedTermImages] = useState<
    Record<string, string>
  >({});

  // Pipeline for real-time term parsing + image search
  const {
    terms: pipelineTerms,
    isProcessing: isPipelineProcessing,
    doneCount: pipelineDoneCount,
    totalCount: pipelineTotalCount,
    readyCount: pipelineReadyCount,
    searchImagesForTerm,
    searchAllImages,
  } = useFlashcardPipeline(multiContent);

  // Initialize data when flashcard loads
  useEffect(() => {
    if (flashcard && cards.length === 0) {
      setName(flashcard.name || "");
      setDescription(flashcard.description || "");
      setLevel(flashcard.level || "");
      setIsPublic(flashcard.isPublic !== false);
      setCards(
        (flashcard.cards || []).map((card) => ({
          id: card.id,
          vocabulary: card.vocabulary || "",
          meaning: card.meaning || "",
          pronunciation: card.pronunciation || "",
          exampleSentence: card.exampleSentence || "",
          previewUrl: card.previewUrl || null,
        })),
      );
    }
  }, [flashcard, cards.length]);

  const [resolvingImages, setResolvingImages] = useState<
    Record<string, boolean>
  >({});
  // Store resolved Cloudinary URLs separately so visual selection (raw URL match) stays intact
  const [resolvedTermImages, setResolvedTermImages] = useState<
    Record<string, string>
  >({});

  const handleTermImageSelect = (termKey: string, imageUrl: string) => {
    if (selectedTermImages[termKey] !== imageUrl && isImageQuotaEmpty) {
      setMultiImageWarning(imageQuotaExhaustedMessage);
      return;
    }
    setMultiImageWarning("");

    // Toggle: if same raw URL, deselect
    setSelectedTermImages((prev) => {
      if (prev[termKey] === imageUrl) {
        const next = { ...prev };
        delete next[termKey];
        return next;
      }
      return { ...prev, [termKey]: imageUrl };
    });

    // If deselecting (same image clicked), also remove resolved
    if (selectedTermImages[termKey] === imageUrl) {
      setResolvedTermImages((prev) => {
        const next = { ...prev };
        delete next[termKey];
        return next;
      });
      return;
    }

    // Resolve: upload to Cloudinary (or get cached URL)
    setResolvingImages((prev) => ({ ...prev, [termKey]: true }));
    resolveImage(imageUrl)
      .then((resolved) => {
        // Store resolved URL separately — don't overwrite selectedTermImages
        setResolvedTermImages((prev) => ({
          ...prev,
          [termKey]: resolved.cloudinaryUrl,
        }));
      })
      .catch((err) => {
        console.error("Failed to resolve image:", err);
      })
      .finally(() => {
        setResolvingImages((prev) => ({ ...prev, [termKey]: false }));
        refetchImageQuota();
      });
  };

  const handlePipelineSearchImagesForTerm = async (termKey: string) => {
    if (isImageQuotaEmpty) {
      setMultiImageWarning(imageQuotaExhaustedMessage);
      return;
    }
    setMultiImageWarning("");
    await searchImagesForTerm(termKey);
    refetchImageQuota();
  };

  const handlePipelineSearchAllImages = async () => {
    if (isImageQuotaEmpty) {
      setMultiImageWarning(imageQuotaExhaustedMessage);
      return;
    }
    if (imageQuota && pipelineReadyCount > imageQuotaRemaining) {
      setMultiImageWarning(
        t("monetization.messages.imageSearchOverflow", {
          remaining: imageQuotaRemaining,
          readyCount: pipelineReadyCount,
        }),
      );
    } else {
      setMultiImageWarning("");
    }
    await searchAllImages();
    refetchImageQuota();
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCards = [...cards];
    const draggedCard = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedCard);
    setCards(newCards);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Delete card
  const deleteCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
    if (editingCardIndex === index) setEditingCardIndex(null);
    else if (editingCardIndex !== null && editingCardIndex > index) {
      setEditingCardIndex(editingCardIndex - 1);
    }
  };

  // Update card field
  const updateCardField = (
    index: number,
    field: keyof CardEdit,
    value: string,
  ) => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
    );
  };

  // Add single card
  const addSingleCard = () => {
    if (!singleVocab.trim() || !singleMeaning.trim()) {
      alert("Vui lòng nhập từ vựng và nghĩa!");
      return;
    }

    const newCard: CardEdit = {
      vocabulary: singleVocab.trim(),
      meaning: singleMeaning.trim(),
      pronunciation: singlePronunciation.trim(),
      exampleSentence: singleExample.trim(),
      previewUrl: singlePreviewUrl.trim() || null,
      isNew: true,
      _tempId: `temp-${Date.now()}`,
    };

    setCards((prev) => [...prev, newCard]);

    // Clear form
    setSingleVocab("");
    setSingleMeaning("");
    setSinglePronunciation("");
    setSingleExample("");
    setSinglePreviewUrl("");
    setSingleSearchResults([]);
    setSingleImageError("");

    setActiveTab("cards");
  };

  // Search images for single card — uses vocabulary term directly
  const handleSingleImageSearch = async () => {
    const query = singleVocab.trim();
    if (!query) return;
    if (isImageQuotaEmpty) {
      setSingleImageError(imageQuotaExhaustedMessage);
      return;
    }
    setSingleSearching(true);
    setSingleImageError("");
    try {
      const results = await searchImages(query, { maxResults: 10 });
      setSingleSearchResults(
        results.map((r) => ({
          url: r.url,
          title: r.title || query,
        })),
      );
    } catch (error) {
      setSingleSearchResults([]);
      setSingleImageError(error instanceof Error ? error.message : "Không thể tìm ảnh lúc này.");
    } finally {
      setSingleSearching(false);
      refetchImageQuota();
    }
  };

  // Add multiple cards with enhanced parsing
  const addMultipleCards = () => {
    // Use our enhanced parser that supports <example> and :/pronunciation/:
    const lines = multiContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert("Không có thẻ nào hợp lệ!");
      return;
    }

    const newCards: CardEdit[] = lines.map((line, index) => {
      const parsed = parseMultiLine(line);
      // Try to match image from pipeline
      const matchingTerm = pipelineTerms.find(
        (t) => t.vocabulary === parsed.vocabulary,
      );
      const termKey = matchingTerm?.key || "";

      return {
        vocabulary: parsed.vocabulary,
        meaning: parsed.meaning,
        pronunciation: parsed.pronunciation,
        exampleSentence: parsed.exampleSentence,
        previewUrl:
          resolvedTermImages[termKey] || selectedTermImages[termKey] || null,
        isNew: true,
        _tempId: `temp-${Date.now()}-${index}`,
      };
    });

    const validCards = newCards.filter((c) => c.vocabulary.trim());
    if (validCards.length === 0) {
      alert("Không có thẻ nào hợp lệ!");
      return;
    }

    setCards((prev) => [...prev, ...validCards]);
    setMultiContent("");
    setSelectedTermImages({});
    setResolvedTermImages({});
    setActiveTab("cards");
  };

  // Save all changes
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFlashCard({
        id: id,
        flashcard: {
          name,
          description,
          level: level || null,
          isPublic,
          cards: cards
            .filter((c) => !c.isNew)
            .map((card) => ({
              vocabulary: card.vocabulary,
              meaning: card.meaning,
              pronunciation: card.pronunciation,
              exampleSentence: card.exampleSentence,
              previewUrl: card.previewUrl,
            })),
        },
      }).unwrap();

      const newCards = cards.filter((c) => c.isNew);
      for (const card of newCards) {
        await addCardToFlashCard({
          flashCardId: id,
          card: {
            vocabulary: card.vocabulary,
            meaning: card.meaning,
            pronunciation: card.pronunciation,
            exampleSentence: card.exampleSentence,
            previewUrl: card.previewUrl,
          },
        }).unwrap();
      }

      // Revalidate ISR pages
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "flashcard", action: "update" }),
      }).catch(() => {});

      if (onClose) {
        onClose();
      } else {
        router.push(detailHref);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const studyTimeMinutes = Math.ceil(cards.length * 0.3);
  const editingCard =
    editingCardIndex !== null ? cards[editingCardIndex] : null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-y-auto relative scroll-smooth bg-background text-foreground ${
        isModal ? "h-full" : ""
      }`}
    >
      <div className={`w-full ${isModal ? "" : "min-h-screen"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isModal && onClose ? (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center size-10 rounded-full bg-muted hover:bg-card text-muted-foreground hover:text-foreground transition-all border border-border"
                >
                  <span className="material-symbols-outlined text-xl">
                    close
                  </span>
                </button>
              ) : (
                <Link
                  href={detailHref}
                  className="flex items-center justify-center size-10 rounded-full bg-muted hover:bg-card text-muted-foreground hover:text-foreground transition-all border border-border"
                >
                  <span className="material-symbols-outlined text-xl">
                    close
                  </span>
                </Link>
              )}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Cài đặt
                </span>
                <h1 className="text-lg font-bold text-foreground truncate max-w-[250px]">
                  {name || flashcard?.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isModal && onClose ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-card border border-border text-foreground font-medium transition-colors"
                >
                  Hủy
                </button>
              ) : (
                <Link
                  href={detailHref}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-card border border-border text-foreground font-medium transition-colors"
                >
                  Hủy
                </Link>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex border-b border-border">
              {[
                { id: "info", label: "Thông tin", icon: "info" },
                { id: "cards", label: `Thẻ (${cards.length})`, icon: "style" },
                { id: "add", label: t("flashcard.settings.addCard"), icon: "add_circle" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === "info" ? (
            /* ═══════════════════════════════════════════
               Tab: Thông tin — full-width 2-column layout
               ═══════════════════════════════════════════ */
            <div className="space-y-6">
              {/* Row 1: Name + Level side by side on full width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tên bộ thẻ
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder={t('auto.flashcardsettings_14')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Trình độ JLPT
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="">{t('auto.flashcardsettings_1')}</option>
                    <option value="N5">{t('auto.flashcardsettings_2')}</option>
                    <option value="N4">{t('auto.flashcardsettings_3')}</option>
                    <option value="N3">{t('auto.flashcardsettings_4')}</option>
                    <option value="N2">{t('auto.flashcardsettings_5')}</option>
                    <option value="N1">{t('auto.flashcardsettings_6')}</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Description full-width */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder={t('auto.flashcardsettings_15')}
                />
              </div>

              {/* Row 3: Stats + Visibility side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-card border border-border rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {cards.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('auto.flashcardsettings_7')}</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-2xl font-bold text-primary">
                      {studyTimeMinutes}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('auto.flashcardsettings_8')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {cards.filter((c) => c.previewUrl).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('auto.flashcardsettings_9')}</p>
                  </div>
                </div>

                {/* Visibility Toggle — fixed CSS */}
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                  <span className="material-symbols-outlined text-primary">
                    {isPublic ? "public" : "lock"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">
                      {isPublic ? "Công khai" : "Riêng tư"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isPublic
                        ? "Cho phép người khác xem và học"
                        : "Chỉ bạn mới xem được"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      isPublic ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        isPublic ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* New Cards Count */}
              {cards.some((c) => c.isNew) && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="material-symbols-outlined">
                      add_circle
                    </span>
                    <span className="font-medium">
                      {cards.filter((c) => c.isNew).length} thẻ mới sẽ được thêm
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "cards" ? (
            /* ═══════════════════════════════════════════
               Tab: Thẻ — horizontal cards with drag & drop + click to edit
               ═══════════════════════════════════════════ */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Kéo thả để sắp xếp lại thứ tự. Nhấn vào thẻ để chỉnh sửa thông
                tin.
              </p>

              {/* Horizontal scrollable card strip */}
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {cards.map((card, index) => (
                  <div
                    key={card._tempId || card.id || index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() =>
                      setEditingCardIndex(
                        editingCardIndex === index ? null : index,
                      )
                    }
                    className={`flex-shrink-0 w-44 bg-card border rounded-xl overflow-hidden transition-all cursor-pointer select-none ${
                      draggedIndex === index
                        ? "border-primary shadow-lg shadow-primary/20 scale-[1.02] opacity-50"
                        : editingCardIndex === index
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/30"
                    } ${card.isNew ? "ring-2 ring-green-500/50" : ""}`}
                  >
                    {/* Preview Image */}
                    <div className="relative aspect-video bg-muted/30">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${
                            card.previewUrl || getMockImage(card.id || index)
                          }')`,
                        }}
                      />
                      {card.isNew && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                          MỚI
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 text-white text-[10px] font-bold rounded">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-3">
                      <p className="text-sm font-bold text-foreground truncate">
                        {card.vocabulary || "—"}
                      </p>
                      {card.pronunciation && (
                        <p className="text-[11px] text-primary truncate">
                          /{card.pronunciation}/
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {card.meaning || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {cards.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <span className="material-symbols-outlined text-6xl mb-4 block">
                    style
                  </span>
                  <p>{t('auto.flashcardsettings_10')}</p>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="mt-4 text-primary hover:underline"
                  >
                    {t("flashcard.settings.addCardNow")}
                  </button>
                </div>
              )}

              {/* Card Edit Panel (shown when a card is selected) */}
              {editingCard && editingCardIndex !== null && (
                <div className="mt-6 bg-card border border-border rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">
                        edit
                      </span>
                      Chỉnh sửa thẻ #{editingCardIndex + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteCard(editingCardIndex)}
                        className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>{t("common.delete")}</button>
                      <button
                        onClick={() => setEditingCardIndex(null)}
                        className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Từ vựng *
                      </label>
                      <input
                        type="text"
                        value={editingCard.vocabulary}
                        onChange={(e) =>
                          updateCardField(
                            editingCardIndex,
                            "vocabulary",
                            e.target.value,
                          )
                        }
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-japanese"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Nghĩa *
                      </label>
                      <input
                        type="text"
                        value={editingCard.meaning}
                        onChange={(e) =>
                          updateCardField(
                            editingCardIndex,
                            "meaning",
                            e.target.value,
                          )
                        }
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Phiên âm
                      </label>
                      <input
                        type="text"
                        value={editingCard.pronunciation}
                        onChange={(e) =>
                          updateCardField(
                            editingCardIndex,
                            "pronunciation",
                            e.target.value,
                          )
                        }
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        placeholder={t('auto.flashcardsettings_16')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Ví dụ câu
                      </label>
                      <input
                        type="text"
                        value={editingCard.exampleSentence}
                        onChange={(e) =>
                          updateCardField(
                            editingCardIndex,
                            "exampleSentence",
                            e.target.value,
                          )
                        }
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        placeholder={t('auto.flashcardsettings_17')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      URL hình ảnh
                    </label>
                    <input
                      type="text"
                      value={editingCard.previewUrl || ""}
                      onChange={(e) =>
                        updateCardField(
                          editingCardIndex,
                          "previewUrl",
                          e.target.value,
                        )
                      }
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      placeholder={t('auto.flashcardsettings_18')}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ═══════════════════════════════════════════
               Tab: Thêm thẻ (Single + Multiple) — full-width
               ═══════════════════════════════════════════ */
            <div>
              {/* Add Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAddMode("single")}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    addMode === "single"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-card"
                  }`}
                >
                  <span className="material-symbols-outlined">add</span>
                  {t("flashcard.settings.addSingleCard")}
                </button>
                <button
                  onClick={() => setAddMode("multiple")}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    addMode === "multiple"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-card"
                  }`}
                >
                  <span className="material-symbols-outlined">queue</span>
                  Thêm nhiều thẻ
                </button>
              </div>

              {addMode === "single" ? (
                /* Single Card Add — full width */
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      add_circle
                    </span>
                    Thêm một thẻ mới
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Từ vựng tiếng Nhật *
                      </label>
                      <input
                        type="text"
                        value={singleVocab}
                        onChange={(e) => setSingleVocab(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-japanese"
                        placeholder="例: 日本語"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Nghĩa tiếng Việt *
                      </label>
                      <input
                        type="text"
                        value={singleMeaning}
                        onChange={(e) => setSingleMeaning(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        placeholder={t('auto.flashcardsettings_19')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Phiên âm (Romaji)
                      </label>
                      <input
                        type="text"
                        value={singlePronunciation}
                        onChange={(e) => setSinglePronunciation(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        placeholder="例: nihongo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Ví dụ câu
                      </label>
                      <input
                        type="text"
                        value={singleExample}
                        onChange={(e) => setSingleExample(e.target.value)}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        placeholder="例: 私は日本語を学びます"
                      />
                    </div>
                  </div>

                  {/* Image Section — auto-search from vocabulary, no URL shown */}
                  <div className="space-y-3 mb-6 p-4 bg-muted/10 border border-border rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Hình ảnh
                        </label>
                        <p className={`mt-1 text-xs font-medium ${imageQuotaTone}`}>
                          {isImageQuotaFetching && !imageQuota
                            ? t("monetization.messages.loadingImageUsage")
                            : t("monetization.messages.flashcardImageRemaining", {
                                count: imageQuotaRemaining.toLocaleString("vi-VN"),
                              })}
                        </p>
                      </div>
                      <button
                        onClick={handleSingleImageSearch}
                        disabled={singleSearching || !singleVocab.trim() || isImageQuotaEmpty}
                        className="px-4 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {singleSearching
                            ? "progress_activity"
                            : "image_search"}
                        </span>
                        {singleSearching
                          ? "Đang tìm..."
                          : `Tìm ảnh "${singleVocab.trim() || "..."}"`}
                      </button>
                    </div>
                    {isImageQuotaEmpty && (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        <span>{imageQuotaExhaustedMessage}</span>
                        <button
                          type="button"
                          onClick={() => setShowImagePackModal(true)}
                          className="font-bold text-red-200 underline"
                        >
                          {t("monetization.actions.buyImageBundle")}
                        </button>
                        <Link href="/packages" className="font-bold text-red-200 underline">
                          {t("monetization.actions.upgradePackage")}
                        </Link>
                      </div>
                    )}
                    {singleImageError && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {singleImageError}
                      </div>
                    )}
                    {/* Search results grid */}
                    {singleSearchResults.length > 0 && (
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {singleSearchResults.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSingleImageSelect(img.url)}
                            disabled={singleResolving || isImageQuotaEmpty}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                              singlePreviewUrl === img.url
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Preview selected image (no URL shown) */}
                    {singlePreviewUrl && (
                      <div className="flex items-center gap-3 mt-2 p-2 bg-card border border-border rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={singlePreviewUrl}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                              check_circle
                            </span>
                            Đã chọn hình ảnh
                            {singleResolving && (
                              <span className="text-primary animate-pulse ml-1">
                                đang tải lên...
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => setSinglePreviewUrl("")}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={addSingleCard}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Thêm thẻ
                  </button>
                </div>
              ) : (
                /* Multiple Cards Add */
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      queue
                    </span>
                    Thêm nhiều thẻ cùng lúc
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Input */}
                    <div className="space-y-4">
                      <label className="block text-sm text-muted-foreground font-medium">
                        Nội dung thẻ (mỗi dòng một thẻ)
                      </label>
                      <textarea
                        value={multiContent}
                        onChange={(e) => setMultiContent(e.target.value)}
                        rows={15}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none font-mono text-sm"
                        placeholder={`từ vựng - nghĩa <ví dụ câu>{t('auto.flashcardsettings_11')}<日本語を学ぶ>{t('auto.flashcardsettings_12')}<hello world>`}
                      />
                      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/10 border border-border rounded-lg">
                        <p className="font-semibold text-foreground/70">
                          Hướng dẫn nhập:
                        </p>
                        <p>
                          <span className="text-primary font-mono">
                            từ vựng - nghĩa
                          </span>{" "}
                          — bắt buộc
                        </p>
                        <p>
                          <span className="text-primary font-mono">
                            &lt;ví dụ câu&gt;
                          </span>{" "}
                          — tùy chọn, đặt trong dấu {"<>"}
                        </p>
                        <p>
                          <span className="text-primary font-mono">
                            :/phát âm/:
                          </span>{" "}
                          — tùy chọn, đặt trong{" "}
                          <span className="font-mono">:/.../:{"  "}</span>
                        </p>
                        <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5">
                          <p className="text-muted-foreground/70">{t('auto.flashcardsettings_13')}</p>
                          <p className="font-mono text-[11px]">
                            日本語 - tiếng Nhật {"<"}日本語を学ぶ{">"}{" "}
                            :/にほんご/:
                          </p>
                          <p className="font-mono text-[11px]">
                            ありがとう - cảm ơn :/arigatou/:
                          </p>
                          <p className="font-mono text-[11px]">
                            hello - xin chào {"<"}hello world{">"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={addMultipleCards}
                        disabled={
                          multiContent
                            .trim()
                            .split("\n")
                            .filter((l) => l.trim()).length === 0
                        }
                        className="w-full py-4 mt-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">add</span>
                        Thêm tất cả thẻ
                      </button>
                    </div>

                    {/* Right Column: Preview & Image Search */}
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <label className="block text-sm text-muted-foreground font-medium">
                          Xem trước từ vựng
                        </label>
                        <span className={`text-xs font-medium ${imageQuotaTone}`}>
                          {t("monetization.messages.imageRemainingToday", {
                            count: imageQuotaRemaining.toLocaleString("vi-VN"),
                          })}
                        </span>
                      </div>
                      {multiImageWarning && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                          {multiImageWarning}
                        </div>
                      )}
                      {isImageQuotaEmpty && (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                          <span>{imageQuotaExhaustedMessage}</span>
                          <button
                            type="button"
                            onClick={() => setShowImagePackModal(true)}
                            className="font-bold text-red-200 underline"
                          >
                            {t("monetization.actions.buyImageBundle")}
                          </button>
                          <Link href="/packages" className="font-bold text-red-200 underline">
                            {t("monetization.actions.upgradePackage")}
                          </Link>
                        </div>
                      )}
                      <div className="bg-muted/10 border border-border rounded-xl p-4 min-h-[400px]">
                        {pipelineTerms.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 pt-10">
                            <span className="material-symbols-outlined text-4xl opacity-50">
                              preview
                            </span>
                            <p className="text-sm">
                              Danh sách xem trước sẽ hiện ở đây
                            </p>
                          </div>
                        ) : (
                          <TermPreviewList
                            terms={pipelineTerms}
                            isProcessing={isPipelineProcessing}
                            doneCount={pipelineDoneCount}
                            totalCount={pipelineTotalCount}
                            readyCount={pipelineReadyCount}
                            onSearchImages={handlePipelineSearchImagesForTerm}
                            onSearchAllImages={handlePipelineSearchAllImages}
                            onImageSelect={handleTermImageSelect}
                            selectedImages={selectedTermImages}
                            resolvingImages={resolvingImages}
                            imageSearchDisabled={isImageQuotaEmpty}
                            imageSearchDisabledMessage={imageQuotaExhaustedMessage}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview New Cards (Already Added) */}
              {cards.some((c) => c.isNew) && (
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400">
                      preview
                    </span>
                    Thẻ mới sẽ thêm ({cards.filter((c) => c.isNew).length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {cards
                      .filter((c) => c.isNew)
                      .map((card, index) => (
                        <div
                          key={card._tempId || index}
                          className="bg-card border border-green-500/30 rounded-xl p-3"
                        >
                          <div
                            className="aspect-square rounded-lg bg-cover bg-center mb-2 bg-muted/30"
                            style={{
                              backgroundImage: `url('${
                                card.previewUrl ||
                                getMockImage(card.id || index)
                              }')`,
                            }}
                          />
                          <div className="text-center">
                            <p className="text-foreground font-bold truncate text-sm">
                              {card.vocabulary}
                            </p>
                            {card.pronunciation && (
                              <p className="text-[11px] text-primary truncate">
                                /{card.pronunciation}/
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground truncate">
                              {card.meaning}
                            </p>
                            {card.exampleSentence && (
                              <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 italic">
                                {card.exampleSentence}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newCards = [...cards];
                              const cardIdx = newCards.indexOf(card);
                              if (cardIdx > -1) {
                                newCards.splice(cardIdx, 1);
                                setCards(newCards);
                              }
                            }}
                            className="w-full mt-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded"
                          >{t("common.delete")}</button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {showImagePackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {t("monetization.terms.imageBundle")}
                </p>
                <h3 className="mt-1 text-xl font-black text-foreground">
                  {t("monetization.actions.buyImageBundle")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("monetization.messages.imageBundleDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImagePackModal(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {isFetchingImagePacks ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : imagePacks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t("monetization.messages.imageBundleUnavailable")}
              </div>
            ) : (
              <div className="space-y-3">
                {imagePacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4"
                  >
                    <div>
                      <p className="font-black text-foreground">{pack.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("monetization.messages.imageRemainingToday", {
                          count: pack.operationAmount.toLocaleString("vi-VN"),
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchaseImagePack(pack.id)}
                      disabled={purchaseImagePackState.isLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {pack.priceHoa.toLocaleString("vi-VN")}{" "}
                      {t("monetization.terms.blossom")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
