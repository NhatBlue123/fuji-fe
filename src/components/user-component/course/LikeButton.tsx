"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/hooks";
import { useLikeCourseRatingMutation, useUnlikeCourseRatingMutation } from "@/store/services/courseApi";

interface LikeButtonProps {
  courseId: number;
  ratingId: number;
  initialLikeCount: number;
  initialIsLiked: boolean;
  disabled?: boolean;
}

export function LikeButton({
  courseId,
  ratingId,
  initialLikeCount,
  initialIsLiked,
  disabled = false,
}: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [likeRating] = useLikeCourseRatingMutation();
  const [unlikeRating] = useUnlikeCourseRatingMutation();

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setIsLiked(initialIsLiked);
  }, [initialLikeCount, initialIsLiked]);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const handleToggleLike = async () => {
    if (disabled || !isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thích đánh giá");
      return;
    }

    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;
    
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    setIsAnimating(true);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }
    animationTimerRef.current = setTimeout(() => setIsAnimating(false), 600);

    try {
      if (isLiked) {
        await unlikeRating({ courseId, ratingId }).unwrap();
      } else {
        await likeRating({ courseId, ratingId }).unwrap();
      }
    } catch (error: any) {
      // Rollback on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(error?.data?.message || "Không thể thực hiện");
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={disabled}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-red-500/30 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
      title={isAuthenticated ? "Thích đánh giá" : "Đăng nhập để thích đánh giá"}
    >
      <span
        className={`material-symbols-outlined text-xl transition-all duration-300 ${
          isAnimating ? "scale-125 rotate-12" : "scale-100"
        } ${
          isLiked 
            ? "text-red-500 filled drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" 
            : "text-muted-foreground group-hover:text-red-500"
        }`}
      >
        favorite
      </span>
      {likeCount > 0 && (
        <span className={`text-sm font-bold transition-colors ${
          isLiked ? "text-red-500" : "text-muted-foreground group-hover:text-foreground"
        }`}>
          {likeCount}
        </span>
      )}
    </button>
  );
}
