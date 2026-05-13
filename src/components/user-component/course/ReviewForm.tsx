"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRateCourseMutation, useUpdateCourseRatingMutation } from "@/store/services/courseApi";

interface ReviewFormProps {
  courseId: number;
  existingReview?: {
    id: number;
    rating: number;
    review: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  courseId,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(existingReview?.review || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [submitReview, { isLoading: isSubmitting }] = useRateCourseMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateCourseRatingMutation();
  
  const isLoading = isSubmitting || isUpdating;
  const isEdit = Boolean(existingReview);

  // Auto focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (review.trim().length < 10) {
      toast.error("Nhận xét phải có ít nhất 10 ký tự");
      return;
    }

    if (review.trim().length > 500) {
      toast.error("Nhận xét không được quá 500 ký tự");
      return;
    }

    try {
      const trimmedReview = review.trim();
      if (isEdit && existingReview) {
        await updateReview({
          courseId,
          ratingId: existingReview.id,
          body: { rating, review: trimmedReview },
        }).unwrap();
        toast.success("Cập nhật đánh giá thành công!");
      } else {
        await submitReview({
          courseId,
          body: { rating, review: trimmedReview },
        }).unwrap();
        toast.success("Gửi đánh giá thành công!");
      }
      
      setRating(0);
      setReview("");
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message || "Không thể gửi đánh giá");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter (without Shift) = Submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter = New line (default behavior)
  };

  const ratingLabels = [
    t("auto.courseDetail_52"),
    t("auto.courseDetail_53"),
    t("auto.courseDetail_54"),
    t("auto.courseDetail_55"),
    t("auto.courseDetail_56"),
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 border border-border/50 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <span className="material-symbols-outlined text-white text-2xl filled">
              rate_review
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-foreground mb-1">
              {isEdit ? t("auto.courseDetail_71") : t("auto.courseDetail_43")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("auto.courseDetail_44")}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
          <label className="text-sm font-bold text-foreground mb-4 block flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-yellow-500">
              star
            </span>
            {t("auto.courseDetail_45")}
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="group relative transition-all duration-200 hover:scale-125 focus:outline-none p-1"
              >
                <span
                  className={`material-symbols-outlined text-4xl transition-all duration-200 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-500 filled drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                      : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
                  }`}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <p className="text-sm font-bold text-foreground mt-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {ratingLabels[(hoverRating || rating) - 1]}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label className="text-sm font-bold text-foreground mb-3 block flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-pink-500">
              edit_note
            </span>
            {t("auto.courseDetail_46")}
          </label>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("auto.courseDetail_47")}
              className="min-h-[140px] resize-none bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-pink-500/20 rounded-2xl text-base leading-relaxed"
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
              <span className="text-[10px] text-muted-foreground/60 bg-background/80 px-2 py-1 rounded-full">
                {t("auto.courseDetail_73")}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              {t("auto.courseDetail_48")}
            </p>
            <p className={`text-xs font-medium ${
              review.length > 450 
                ? "text-amber-500" 
                : review.length >= 10 
                  ? "text-emerald-500" 
                  : "text-muted-foreground"
            }`}>
              {review.length}/500
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0 || review.trim().length < 10}
            className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                {t("auto.courseDetail_72")}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">send</span>
                {isEdit ? t("auto.courseDetail_49") : t("auto.courseDetail_50")}
              </>
            )}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={isLoading}
              variant="outline"
              className="px-8 h-12 rounded-xl border-2 hover:bg-muted/50"
            >
              {t("auto.courseDetail_51")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
