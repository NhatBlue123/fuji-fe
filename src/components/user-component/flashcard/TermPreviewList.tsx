/**
 * TermPreviewList — Real-time preview of parsed terms with progressive status.
 *
 * Shows each term's:
 *   - Status indicator (spinner, checkmark, warning, error)
 *   - Vocabulary + meaning
 *   - Language badge
 *   - Translation (if Japanese)
 *   - Image thumbnails grid (when available)
 *   - "No results" message
 *   - Click-to-select image for the term
 */

"use client";

import { useState, useCallback } from "react";
import type { TermState } from "@/lib/flashcard-pipeline";
import { STATUS_LABELS, LANGUAGE_LABELS } from "@/lib/flashcard-pipeline";

interface TermPreviewListProps {
  terms: TermState[];
  isProcessing: boolean;
  doneCount: number;
  totalCount: number;
  /** Called when user clicks search button for a specific term */
  onSearchImages?: (termKey: string) => void;
  /** Called when user clicks "Search all" */
  onSearchAllImages?: () => void;
  /** Number of terms ready for image search */
  readyCount?: number;
  /** Called when user selects an image for a term */
  onImageSelect?: (termKey: string, imageUrl: string) => void;
  /** Currently selected images per term key */
  selectedImages?: Record<string, string>;
}

export default function TermPreviewList({
  terms,
  isProcessing,
  doneCount,
  totalCount,
  onSearchImages,
  onSearchAllImages,
  readyCount = 0,
  onImageSelect,
  selectedImages = {},
}: TermPreviewListProps) {
  if (terms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {totalCount} từ vựng
          {isProcessing && (
            <span className="ml-2 text-pink-400 animate-pulse">
              đang xử lý...
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span>
            {doneCount}/{totalCount} hoàn tất
          </span>
          {readyCount > 0 && onSearchAllImages && (
            <button
              type="button"
              onClick={onSearchAllImages}
              className="px-2 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded-full hover:bg-pink-500/30 transition-colors"
            >
              Tìm ảnh tất cả ({readyCount})
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-blue-500 rounded-full transition-all duration-300"
          style={{
            width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%",
          }}
        />
      </div>

      {/* Term list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {terms.map((term) => (
          <TermCard
            key={term.key}
            term={term}
            selectedImage={selectedImages[term.key]}
            onImageSelect={
              onImageSelect ? (url) => onImageSelect(term.key, url) : undefined
            }
            onSearchImages={
              onSearchImages ? () => onSearchImages(term.key) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single Term Card ─────────────────────────────────

interface TermCardProps {
  term: TermState;
  selectedImage?: string;
  onImageSelect?: (url: string) => void;
  onSearchImages?: () => void;
}

function TermCard({
  term,
  selectedImage,
  onImageSelect,
  onSearchImages,
}: TermCardProps) {
  const [showAllImages, setShowAllImages] = useState(false);
  const visibleImages = showAllImages ? term.images : term.images.slice(0, 4);

  const handleImageClick = useCallback(
    (url: string) => {
      onImageSelect?.(url);
    },
    [onImageSelect],
  );

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 transition-all hover:border-white/10">
      {/* Header row */}
      <div className="flex items-center gap-2">
        {/* Status icon */}
        <StatusIcon status={term.status} />

        {/* Vocabulary */}
        <span className="font-bold text-white text-sm">{term.vocabulary}</span>

        {/* Meaning (if provided) */}
        {term.meaning && (
          <>
            <span className="text-gray-600">—</span>
            <span className="text-gray-300 text-sm">{term.meaning}</span>
          </>
        )}

        {/* Language badge */}
        {term.language && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 whitespace-nowrap">
            {LANGUAGE_LABELS[term.language]}
          </span>
        )}
      </div>

      {/* Status label for non-done states */}
      {term.status !== "done" &&
        term.status !== "no_results" &&
        term.status !== "ready" && (
          <p className="text-[11px] text-gray-500 mt-1.5 ml-6">
            {STATUS_LABELS[term.status]}
          </p>
        )}

      {/* Error message */}
      {term.status === "error" && term.errorMessage && (
        <p className="text-[11px] text-red-400 mt-1.5 ml-6">
          {term.errorMessage}
        </p>
      )}

      {/* No results message */}
      {term.status === "no_results" && (
        <div className="flex items-center gap-2 mt-2 ml-6">
          <p className="text-[11px] text-yellow-500/80">
            Không tìm thấy hình ảnh
          </p>
          {onSearchImages && (
            <button
              type="button"
              onClick={onSearchImages}
              className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full hover:bg-yellow-500/20 transition-colors"
            >
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* Ready state: Search images button */}
      {term.status === "ready" && onSearchImages && (
        <div className="mt-2 ml-6">
          <button
            type="button"
            onClick={onSearchImages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-pink-500/10 text-pink-400 rounded-lg hover:bg-pink-500/20 border border-pink-500/20 hover:border-pink-500/30 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              image_search
            </span>
            Tìm hình ảnh
          </button>
        </div>
      )}

      {/* Image grid */}
      {term.images.length > 0 && (
        <div className="mt-2 ml-6">
          <div className="grid grid-cols-4 gap-1.5">
            {visibleImages.map((img, i) => {
              const isSelected = selectedImage === img.url;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleImageClick(img.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? "border-pink-500 ring-1 ring-pink-500/50"
                      : "border-transparent hover:border-white/20"
                  }`}
                  title={img.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={img.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-lg drop-shadow">
                        check_circle
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Show more/less toggle */}
          {term.images.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllImages(!showAllImages)}
              className="mt-1.5 text-[10px] text-pink-400 hover:text-pink-300 transition-colors"
            >
              {showAllImages
                ? "Thu gọn"
                : `Xem thêm ${term.images.length - 4} ảnh`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Status Icon Component ───────────────────────────

function StatusIcon({ status }: { status: TermState["status"] }) {
  switch (status) {
    case "idle":
    case "parsing":
    case "detecting":
    case "searching_images":
      return (
        <span className="material-symbols-outlined text-sm text-pink-400 animate-spin flex-shrink-0">
          progress_activity
        </span>
      );
    case "ready":
      return (
        <span className="material-symbols-outlined text-sm text-blue-400 flex-shrink-0">
          photo_camera
        </span>
      );
    case "done":
      return (
        <span className="material-symbols-outlined text-sm text-green-400 flex-shrink-0">
          check_circle
        </span>
      );
    case "no_results":
      return (
        <span className="material-symbols-outlined text-sm text-yellow-500 flex-shrink-0">
          image_not_supported
        </span>
      );
    case "error":
      return (
        <span className="material-symbols-outlined text-sm text-red-400 flex-shrink-0">
          error
        </span>
      );
  }
}
