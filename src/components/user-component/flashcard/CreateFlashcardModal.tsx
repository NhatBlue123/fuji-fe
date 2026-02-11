"use client";

import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import {
  useCreateFlashCardMutation,
  useCreateFlashListMutation,
  useGetFlashCardsQuery,
} from "@/store/services/flashcardApi";
import { useAuth } from "@/store/hooks";
import { getMockImage } from "@/lib/mockImages";
import { useFlashcardPipeline } from "@/hooks/useFlashcardPipeline";
import TermPreviewList from "@/components/user-component/flashcard/TermPreviewList";
import type { CardDTO, FlashCardResponseDTO } from "@/types/flashcard";

interface CreateFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "list" | "card";

export default function CreateFlashcardModal({
  open,
  onOpenChange,
}: CreateFlashcardModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [isPublic, setIsPublic] = useState(false);
  const [level, setLevel] = useState("N5");

  // Form states for Flash List
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [searchFlashcard, setSearchFlashcard] = useState("");
  const [listThumbnail, setListThumbnail] = useState<string | null>(null);
  const listThumbnailFileRef = useRef<File | null>(null);
  const [selectedFlashcardIds, setSelectedFlashcardIds] = useState<number[]>(
    [],
  );

  // Form states for Flash Card
  const [cardName, setCardName] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [cardContent, setCardContent] = useState("");
  const [cardThumbnail, setCardThumbnail] = useState<string | null>(null);
  const cardThumbnailFileRef = useRef<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [selectedTermImages, setSelectedTermImages] = useState<
    Record<string, string>
  >({});

  // Pipeline for real-time term parsing + translation (no auto image search)
  const {
    terms: pipelineTerms,
    isProcessing: isPipelineProcessing,
    doneCount: pipelineDoneCount,
    totalCount: pipelineTotalCount,
    readyCount: pipelineReadyCount,
    searchImagesForTerm,
    searchAllImages,
  } = useFlashcardPipeline(activeTab === "card" ? cardContent : "");

  const handleTermImageSelect = (termKey: string, imageUrl: string) => {
    setSelectedTermImages((prev) => {
      // Toggle: click same image again to deselect
      if (prev[termKey] === imageUrl) {
        const next = { ...prev };
        delete next[termKey];
        return next;
      }
      return { ...prev, [termKey]: imageUrl };
    });
  };

  // Auth for visibility check
  const { user } = useAuth();
  const currentUserId = user?.id ?? user?._id;

  // Fetch all accessible flashcards for the search
  const { data: flashCardsData } = useGetFlashCardsQuery({
    page: 0,
    limit: 100,
  });

  // Filter flashcards by search query
  const searchResults = useMemo(() => {
    const allCards = flashCardsData?.flashCards || [];
    if (!searchFlashcard.trim()) return allCards;
    const q = searchFlashcard.toLowerCase();
    return allCards.filter(
      (fc) =>
        fc.name.toLowerCase().includes(q) ||
        fc.description?.toLowerCase().includes(q),
    );
  }, [flashCardsData, searchFlashcard]);

  // Check visibility: can this flashcard be added to the current list?
  const getVisibilityWarning = (fc: FlashCardResponseDTO): string | null => {
    const isOwnCard = String(fc.user?.id) === String(currentUserId);
    // Other's private → shouldn't even appear (API filters), but just in case
    if (!isOwnCard && !fc.isPublic) return "FlashCard riêng tư của người khác";
    // Own private card + public list → cannot add
    if (isOwnCard && !fc.isPublic && isPublic)
      return "Không thể thêm FlashCard riêng tư vào FlashList công khai";
    return null;
  };

  const toggleSelectFlashcard = (fcId: number) => {
    setSelectedFlashcardIds((prev) =>
      prev.includes(fcId) ? prev.filter((id) => id !== fcId) : [...prev, fcId],
    );
  };

  // RTK Query mutations
  const [createFlashCard, { isLoading: isCreatingCard }] =
    useCreateFlashCardMutation();
  const [createFlashList, { isLoading: isCreatingList }] =
    useCreateFlashListMutation();

  const isSubmitting = isCreatingCard || isCreatingList;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "list" | "card",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "list") {
        listThumbnailFileRef.current = file;
      } else {
        cardThumbnailFileRef.current = file;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "list") {
          setListThumbnail(reader.result as string);
        } else {
          setCardThumbnail(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Parse card content text into CardDTO[]
   * Format: each line = "vocabulary - meaning"
   * Enriches with pipeline translations when meaning is missing.
   * Includes previewUrl from selected images.
   */
  const parseCardContent = (content: string): CardDTO[] => {
    const lines = content.split("\n");
    return lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        const sepIdx = line.indexOf(" - ");
        let vocabulary: string;
        let meaning: string;
        if (sepIdx === -1) {
          vocabulary = line;
          meaning = "";
        } else {
          vocabulary = line.substring(0, sepIdx).trim();
          meaning = line.substring(sepIdx + 3).trim();
        }
        // Get selected image for this term (using index-based key matching)
        const termKey = `term-${index}`;
        const previewUrl = selectedTermImages[termKey] || null;
        return { vocabulary, meaning, previewUrl };
      });
  };

  const resetForm = () => {
    setListTitle("");
    setListDescription("");
    setSearchFlashcard("");
    setListThumbnail(null);
    listThumbnailFileRef.current = null;
    setSelectedFlashcardIds([]);
    setCardName("");
    setCardDescription("");
    setCardContent("");
    setCardThumbnail(null);
    cardThumbnailFileRef.current = null;
    setSelectedTermImages({});
    setIsPublic(false);
    setLevel("N5");
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (activeTab === "list") {
        if (!listTitle.trim()) {
          setError("Vui lòng nhập tiêu đề FlashList");
          return;
        }

        // Frontend visibility validation before sending
        if (isPublic && selectedFlashcardIds.length > 0) {
          const allCards = flashCardsData?.flashCards || [];
          const privateOwnCards = selectedFlashcardIds.filter((id) => {
            const fc = allCards.find((c) => c.id === id);
            if (!fc) return false;
            const isOwn = String(fc.user?.id) === String(currentUserId);
            return isOwn && !fc.isPublic;
          });
          if (privateOwnCards.length > 0) {
            setError(
              "Không thể thêm FlashCard riêng tư vào FlashList công khai. Hãy bỏ chọn các FlashCard riêng tư hoặc đặt FlashList ở chế độ riêng tư.",
            );
            return;
          }
        }

        await createFlashList({
          flashlist: {
            title: listTitle.trim(),
            description: listDescription.trim() || undefined,
            level,
            isPublic,
            flashcardIds:
              selectedFlashcardIds.length > 0
                ? selectedFlashcardIds
                : undefined,
          },
          thumbnail: listThumbnailFileRef.current || undefined,
        }).unwrap();
      } else {
        if (!cardName.trim()) {
          setError("Vui lòng nhập tên bộ FlashCard");
          return;
        }
        const cards = parseCardContent(cardContent);
        if (cards.length === 0) {
          setError("Vui lòng nhập ít nhất một thẻ");
          return;
        }
        await createFlashCard({
          flashcard: {
            name: cardName.trim(),
            description: cardDescription.trim() || undefined,
            level,
            isPublic,
            cards,
          },
          thumbnail: cardThumbnailFileRef.current || undefined,
        }).unwrap();
      }
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(
        apiErr?.data?.message || "Đã xảy ra lỗi khi tạo. Vui lòng thử lại.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0B1120] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">Tạo mới FlashCard</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === "list"
                ? "bg-secondary text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Flash List
          </button>
          <button
            onClick={() => setActiveTab("card")}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === "card"
                ? "bg-secondary text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Flash Card
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            {activeTab === "list" ? (
              <>
                {/* Flash List Form */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu đề FlashList...
                  </label>
                  <input
                    type="text"
                    value={listTitle}
                    onChange={(e) => setListTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500"
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mô tả...
                  </label>
                  <textarea
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500 resize-none"
                    placeholder="Nhập mô tả..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    JLPT Level
                  </label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-white/10">
                      <SelectItem value="N5">N5</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium">Công khai</label>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? "bg-secondary" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        isPublic ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tìm flashcard để thêm...
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-500 text-lg">
                        search
                      </span>
                    </span>
                    <input
                      type="text"
                      value={searchFlashcard}
                      onChange={(e) => setSearchFlashcard(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500"
                      placeholder="Tìm kiếm flashcard..."
                    />
                  </div>

                  {/* Selected count badge */}
                  {selectedFlashcardIds.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-pink-400">
                      <span className="material-symbols-outlined text-sm">
                        check_circle
                      </span>
                      <span>
                        Đã chọn {selectedFlashcardIds.length} flashcard
                      </span>
                      <button
                        onClick={() => setSelectedFlashcardIds([])}
                        className="ml-auto text-gray-500 hover:text-red-400 transition-colors"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  )}

                  {/* Flashcard search results */}
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2 text-center">
                        Không tìm thấy flashcard nào
                      </p>
                    ) : (
                      searchResults.map((fc) => {
                        const isSelected = selectedFlashcardIds.includes(fc.id);
                        const warning = getVisibilityWarning(fc);
                        const isDisabled = !!warning;
                        return (
                          <button
                            key={fc.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() =>
                              !isDisabled && toggleSelectFlashcard(fc.id)
                            }
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                              isDisabled
                                ? "opacity-40 cursor-not-allowed bg-white/[0.02]"
                                : isSelected
                                  ? "bg-pink-500/20 border border-pink-500/40"
                                  : "bg-white/5 hover:bg-white/10 border border-transparent"
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-md bg-cover bg-center flex-shrink-0"
                              style={{
                                backgroundImage: `url('${fc.thumbnailUrl || getMockImage(fc.id)}')`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {fc.name}
                              </p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-2">
                                <span>{fc.cardCount} thẻ</span>
                                {fc.level && (
                                  <span className="text-pink-400/70">
                                    {fc.level}
                                  </span>
                                )}
                                <span>
                                  {fc.isPublic ? "Công khai" : "Riêng tư"}
                                </span>
                                <span className="text-gray-500">
                                  {fc.user?.username}
                                </span>
                              </p>
                              {warning && (
                                <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-xs">
                                    warning
                                  </span>
                                  {warning}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-pink-400 text-lg flex-shrink-0">
                                check_circle
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Flash Card Form */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên bộ FlashCard...
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500"
                    placeholder="Nhập tên bộ FlashCard..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mô tả...
                  </label>
                  <textarea
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-500 resize-none"
                    placeholder="Nhập mô tả..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    JLPT Level
                  </label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-white/10">
                      <SelectItem value="N5">N5</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium">Công khai</label>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? "bg-secondary" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        isPublic ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nội dung thẻ (mỗi dòng một thẻ)
                  </label>
                  <textarea
                    value={cardContent}
                    onChange={(e) => setCardContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-gray-400 resize-none font-mono text-sm"
                    placeholder="mặt trước - mặt sau"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-semibold">Hướng dẫn nhập liệu:</span>
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
                </div>
              </>
            )}
          </div>

          {/* Right Column — Thumbnail (list tab) or Term Preview (card tab) */}
          <div className="space-y-4">
            {/* Thumbnail upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ảnh Thumbnail
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-pink-500/50 transition-colors">
                {(activeTab === "list" ? listThumbnail : cardThumbnail) ? (
                  <div className="relative w-full h-64">
                    <Image
                      src={
                        activeTab === "list" ? listThumbnail! : cardThumbnail!
                      }
                      alt="Thumbnail"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      onClick={() =>
                        activeTab === "list"
                          ? setListThumbnail(null)
                          : setCardThumbnail(null)
                      }
                      className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center py-12">
                      <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">
                        image
                      </span>
                      <p className="text-gray-400 mb-2">Chọn ảnh</p>
                      <p className="text-xs text-gray-600">PNG, JPG, GIF</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, activeTab)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Term Preview — only for card tab when there's content */}
            {activeTab === "card" && pipelineTerms.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Xem trước từ vựng
                </label>
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
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          {error && (
            <div className="mb-3 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-secondary hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
            )}
            {isSubmitting
              ? "Đang tạo..."
              : activeTab === "list"
                ? "Tạo Flash List"
                : "Tạo Flash Card"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
