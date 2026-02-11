"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetFlashCardByIdQuery,
  useUpdateFlashCardMutation,
  useAddCardToFlashCardMutation,
} from "@/store/services/flashcardApi";
import { getMockImage } from "@/lib/mockImages";
import { useFlashcardPipeline } from "@/hooks/useFlashcardPipeline";
import TermPreviewList from "@/components/user-component/flashcard/TermPreviewList";

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
  const router = useRouter();
  const { data: flashcard, isLoading } = useGetFlashCardByIdQuery(id);
  const [updateFlashCard] = useUpdateFlashCardMutation();
  const [addCardToFlashCard] = useAddCardToFlashCardMutation();

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
  const [singleImageSearch, setSingleImageSearch] = useState("");
  const [singleSearchResults, setSingleSearchResults] = useState<
    { url: string; title: string }[]
  >([]);
  const [singleSearching, setSingleSearching] = useState(false);

  // Multi-add state
  const [multiContent, setMultiContent] = useState("");
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
        flashcard.cards.map((card) => ({
          id: card.id,
          vocabulary: card.vocabulary || "",
          meaning: card.meaning || "",
          pronunciation: card.pronunciation || "",
          exampleSentence: card.exampleSentence || "",
          previewUrl: card.previewUrl || null,
        })),
      );
    }
  }, [flashcard]);

  const handleTermImageSelect = (termKey: string, imageUrl: string) => {
    setSelectedTermImages((prev) => {
      if (prev[termKey] === imageUrl) {
        const next = { ...prev };
        delete next[termKey];
        return next;
      }
      return { ...prev, [termKey]: imageUrl };
    });
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
    setSingleImageSearch("");

    setActiveTab("cards");
  };

  // Search images for single card
  const handleSingleImageSearch = async () => {
    const query = singleImageSearch.trim() || singleVocab.trim();
    if (!query) return;
    setSingleSearching(true);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query,
        )}&per_page=8&client_id=demo`,
      );
      if (res.ok) {
        const data = await res.json();
        setSingleSearchResults(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.results?.map((r: any) => ({
            url: r.urls?.small || r.urls?.thumb,
            title: r.alt_description || query,
          })) || [],
        );
      } else {
        // Fallback mock
        setSingleSearchResults(
          Array.from({ length: 6 }, (_, i) => ({
            url: getMockImage(i),
            title: `${query} ${i + 1}`,
          })),
        );
      }
    } catch {
      setSingleSearchResults(
        Array.from({ length: 6 }, (_, i) => ({
          url: getMockImage(i),
          title: `${query} ${i + 1}`,
        })),
      );
    } finally {
      setSingleSearching(false);
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
        previewUrl: selectedTermImages[termKey] || null,
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

      if (onClose) {
        onClose();
      } else {
        router.push(`/flashcards/detail/${id}`);
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
        <span className="material-symbols-outlined text-5xl text-pink-400 animate-spin">
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
                  className="flex items-center justify-center size-10 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border"
                >
                  <span className="material-symbols-outlined text-xl">
                    close
                  </span>
                </button>
              ) : (
                <Link
                  href={`/flashcards/detail/${id}`}
                  className="flex items-center justify-center size-10 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border"
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
                  className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border text-foreground font-medium transition-colors"
                >
                  Hủy
                </button>
              ) : (
                <Link
                  href={`/flashcards/detail/${id}`}
                  className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border text-foreground font-medium transition-colors"
                >
                  Hủy
                </Link>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
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
                { id: "add", label: "Thêm thẻ", icon: "add_circle" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-pink-500 border-b-2 border-pink-500 bg-pink-500/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none transition-colors"
                    placeholder="Nhập tên bộ thẻ..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Trình độ JLPT
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:border-pink-500 focus:outline-none transition-colors"
                  >
                    <option value="">Không xác định</option>
                    <option value="N5">N5 - Sơ cấp</option>
                    <option value="N4">N4 - Trung cấp</option>
                    <option value="N3">N3 - Tiền trung cấp</option>
                    <option value="N2">N2 - Trung cấp</option>
                    <option value="N1">N1 - Cao cấp</option>
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
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none transition-colors resize-none"
                  placeholder="Nhập mô tả..."
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
                    <p className="text-xs text-muted-foreground">Tổng thẻ</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-2xl font-bold text-pink-400">
                      {studyTimeMinutes}
                    </p>
                    <p className="text-xs text-muted-foreground">Phút học</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {cards.filter((c) => c.previewUrl).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Có hình ảnh</p>
                  </div>
                </div>

                {/* Visibility Toggle — fixed CSS */}
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                  <span className="material-symbols-outlined text-pink-400">
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
                      isPublic ? "bg-pink-500" : "bg-muted-foreground/30"
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
                        ? "border-pink-500 shadow-lg shadow-pink-500/20 scale-[1.02] opacity-50"
                        : editingCardIndex === index
                          ? "border-pink-500 ring-2 ring-pink-500/30"
                          : "border-border hover:border-pink-500/30"
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
                        <p className="text-[11px] text-pink-400 truncate">
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
                  <p>Chưa có thẻ nào trong bộ này</p>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="mt-4 text-pink-400 hover:underline"
                  >
                    Thêm thẻ ngay
                  </button>
                </div>
              )}

              {/* Card Edit Panel (shown when a card is selected) */}
              {editingCard && editingCardIndex !== null && (
                <div className="mt-6 bg-card border border-border rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-pink-400">
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
                        </span>
                        Xóa
                      </button>
                      <button
                        onClick={() => setEditingCardIndex(null)}
                        className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary border border-border transition-colors"
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none font-japanese"
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="Phiên âm..."
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="Ví dụ câu..."
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
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                      placeholder="URL hình ảnh..."
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
                      ? "bg-pink-500 text-white"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined">add</span>
                  Thêm thẻ đơn
                </button>
                <button
                  onClick={() => setAddMode("multiple")}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    addMode === "multiple"
                      ? "bg-pink-500 text-white"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
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
                    <span className="material-symbols-outlined text-pink-400">
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none font-japanese"
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="例: Tiếng Nhật"
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="例: 私は日本語を学びます"
                      />
                    </div>
                  </div>

                  {/* Image Search Section */}
                  <div className="space-y-3 mb-6 p-4 bg-muted/10 border border-border rounded-xl">
                    <label className="text-sm font-medium text-muted-foreground">
                      Hình ảnh
                    </label>
                    {/* URL input */}
                    <input
                      type="text"
                      value={singlePreviewUrl}
                      onChange={(e) => setSinglePreviewUrl(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                      placeholder="Nhập URL hình ảnh hoặc tìm kiếm bên dưới..."
                    />
                    {/* Image search bar */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={singleImageSearch}
                        onChange={(e) => setSingleImageSearch(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSingleImageSearch()
                        }
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder={`Tìm ảnh "${singleVocab || "từ vựng"}"...`}
                      />
                      <button
                        onClick={handleSingleImageSearch}
                        disabled={singleSearching}
                        className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {singleSearching ? "progress_activity" : "search"}
                        </span>
                        Tìm
                      </button>
                    </div>
                    {/* Search results grid */}
                    {singleSearchResults.length > 0 && (
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
                        {singleSearchResults.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSinglePreviewUrl(img.url)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                              singlePreviewUrl === img.url
                                ? "border-pink-500 ring-2 ring-pink-500/30"
                                : "border-border hover:border-pink-500/40"
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Preview selected image */}
                    {singlePreviewUrl && (
                      <div className="flex items-center gap-3 mt-2 p-2 bg-card border border-border rounded-lg">
                        <img
                          src={singlePreviewUrl}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">
                            {singlePreviewUrl}
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
                    className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Thêm thẻ
                  </button>
                </div>
              ) : (
                /* Multiple Cards Add */
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-pink-400">
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
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none resize-none font-mono text-sm"
                        placeholder={`từ vựng - nghĩa <ví dụ câu> :/phát âm/:\n\nVí dụ:\n日本語 - tiếng Nhật <日本語を学ぶ> :/にほんご/:\nありがとう - cảm ơn :/arigatou/:\nhello - xin chào <hello world>`}
                      />
                      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/10 border border-border rounded-lg">
                        <p className="font-semibold text-foreground/70">
                          Hướng dẫn nhập:
                        </p>
                        <p>
                          <span className="text-pink-400 font-mono">
                            từ vựng - nghĩa
                          </span>{" "}
                          — bắt buộc
                        </p>
                        <p>
                          <span className="text-pink-400 font-mono">
                            &lt;ví dụ câu&gt;
                          </span>{" "}
                          — tùy chọn, đặt trong dấu {"<>"}
                        </p>
                        <p>
                          <span className="text-pink-400 font-mono">
                            :/phát âm/:
                          </span>{" "}
                          — tùy chọn, đặt trong{" "}
                          <span className="font-mono">:/.../:{"  "}</span>
                        </p>
                        <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5">
                          <p className="text-muted-foreground/70">Ví dụ:</p>
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
                        className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                      >
                        <span className="material-symbols-outlined">add</span>
                        Thêm tất cả thẻ
                      </button>
                    </div>

                    {/* Right Column: Preview & Image Search */}
                    <div className="space-y-4">
                      <label className="block text-sm text-muted-foreground font-medium">
                        Xem trước từ vựng
                      </label>
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
                            onSearchImages={searchImagesForTerm}
                            onSearchAllImages={searchAllImages}
                            onImageSelect={handleTermImageSelect}
                            selectedImages={selectedTermImages}
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
                              <p className="text-[11px] text-pink-400 truncate">
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
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
