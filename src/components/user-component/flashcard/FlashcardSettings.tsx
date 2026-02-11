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

  // Flashcard info state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);

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
        }))
      );
    }
  }, [flashcard]);

  const handleTermImageSelect = (termKey: string, imageUrl: string) => {
    setSelectedTermImages((prev) => {
      // Toggle logic
      if (prev[termKey] === imageUrl) {
        const next = { ...prev };
        delete next[termKey];
        return next;
      }
      return { ...prev, [termKey]: imageUrl };
    });
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
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
  };

  // Add single card
  const addSingleCard = () => {
    const vocabInput = document.getElementById(
      "single-vocab"
    ) as HTMLInputElement;
    const meaningInput = document.getElementById(
      "single-meaning"
    ) as HTMLInputElement;
    const pronunciationInput = document.getElementById(
      "single-pronunciation"
    ) as HTMLInputElement;
    const exampleInput = document.getElementById(
      "single-example"
    ) as HTMLInputElement;
    const previewInput = document.getElementById(
      "single-preview-url"
    ) as HTMLInputElement;

    const vocab = vocabInput?.value?.trim();
    const meaning = meaningInput?.value?.trim();

    if (!vocab || !meaning) {
      alert("Vui lòng nhập từ vựng và nghĩa!");
      return;
    }

    const newCard: CardEdit = {
      vocabulary: vocab,
      meaning: meaning,
      pronunciation: pronunciationInput?.value?.trim() || "",
      exampleSentence: exampleInput?.value?.trim() || "",
      previewUrl: previewInput?.value?.trim() || null,
      isNew: true,
      _tempId: `temp-${Date.now()}`,
    };

    setCards((prev) => [...prev, newCard]);

    // Clear form
    vocabInput.value = "";
    meaningInput.value = "";
    pronunciationInput.value = "";
    exampleInput.value = "";
    previewInput.value = "";

    setActiveTab("cards");
  };

  // Add multiple cards
  const addMultipleCards = () => {
    if (pipelineTerms.length === 0) {
      alert("Không có thẻ nào hợp lệ!");
      return;
    }

    const newCards: CardEdit[] = pipelineTerms
      .filter((t) => t.vocabulary.trim())
      .map((term, index) => ({
        vocabulary: term.vocabulary,
        meaning: term.meaning || "",
        pronunciation: "",
        exampleSentence: "",
        previewUrl: selectedTermImages[term.key] || null,
        isNew: true,
        _tempId: `temp-${Date.now()}-${index}`,
      }));

    if (newCards.length === 0) {
      alert("Không có thẻ nào hợp lệ!");
      return;
    }

    setCards((prev) => [...prev, ...newCards]);

    // Clear form
    setMultiContent("");
    setSelectedTermImages({});
    setActiveTab("cards");
  };

  // Save all changes
  const handleSave = async () => {
    setSaving(true);
    try {
      // Update flashcard info and reorder cards
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

      // Add new cards
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

  // Calculate study time estimate
  const studyTimeMinutes = Math.ceil(cards.length * 0.3);

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
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              ) : (
                <Link
                  href={`/flashcards/detail/${id}`}
                  className="flex items-center justify-center size-10 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
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
            // Tab: Flashcard Info
            <div className="max-w-2xl space-y-6">
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

              {/* Visibility Toggle */}
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                <span className="material-symbols-outlined text-pink-400">
                  public
                </span>
                <div className="flex-1">
                  <p className="text-foreground font-medium">Công khai</p>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người khác xem và học bộ thẻ này
                  </p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isPublic ? "bg-pink-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isPublic ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
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
            // Tab: Cards Management (Reorder)
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Kéo thả để sắp xếp lại thứ tự thẻ.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cards.map((card, index) => (
                  <div
                    key={card._tempId || card.id || index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-card border rounded-xl overflow-hidden transition-all cursor-pointer group ${
                      draggedIndex === index
                        ? "border-pink-500 shadow-lg shadow-pink-500/20 scale-[1.02] opacity-50"
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
                      ></div>
                      {card.isNew && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                          MỚI
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-lg font-bold text-foreground">
                            {card.vocabulary || "—"}
                          </p>
                          {card.pronunciation && (
                            <p className="text-xs text-pink-400">
                              {card.pronunciation}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteCard(index)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
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
            </div>
          ) : (
            // Tab: Add Cards (Single + Multiple)
            <div className="max-w-7xl">
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
                // Single Card Add
                <div className="max-w-2xl bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-pink-400">
                      add_circle
                    </span>
                    Thêm một thẻ mới
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Từ vựng tiếng Nhật *
                      </label>
                      <input
                        type="text"
                        id="single-vocab"
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
                        id="single-meaning"
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="例: Tiếng Nhật"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Phiên âm (Romaji)
                      </label>
                      <input
                        type="text"
                        id="single-pronunciation"
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
                        id="single-example"
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="例: 私は日本語を学びます"
                      />
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="space-y-3 mb-6 p-4 bg-muted/10 border border-border rounded-xl">
                    <label className="text-sm text-muted-foreground">
                      Hình ảnh - Tùy chọn (URL)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        id="single-preview-url"
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-pink-500 focus:outline-none"
                        placeholder="Nhập URL hình ảnh..."
                      />
                    </div>
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
                // Multiple Cards Add
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
                        placeholder="vocabulary - meaning"
                      />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">
                          Hướng dẫn nhập liệu:
                        </span>
                        <br />
                        Mỗi dòng là một thẻ học tập
                        <br />
                        Dùng dấu &quot;-&quot; để phân tách từ vựng và nghĩa
                        <br />
                        <span className="text-gray-400">Ví dụ:</span>
                        <br />• hello - xin chào
                        <br />• goodbye - tạm biệt
                        <br />• thanks - cảm ơn
                      </p>

                      <button
                        onClick={addMultipleCards}
                        disabled={pipelineTerms.length === 0}
                        className="w-full py-4 mt-4 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
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
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                          ></div>
                          <div className="text-center">
                            <p className="text-foreground font-bold truncate">
                              {card.vocabulary}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {card.meaning}
                            </p>
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
