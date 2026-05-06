"use client";

import { useEffect, useMemo } from "react";
import { Check, CircleSlash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FramedAvatar } from "@/components/common/FramedAvatar";
import { useAvatarFrames } from "@/hooks/useAvatarFrames";
import {
  canUseAvatarFrame,
  changeAvatarFrame,
  getAvailableAvatarFrames,
} from "@/lib/avatar-frames";
import { cn } from "@/lib/utils";

type AvatarFramePickerProps = {
  value: string;
  onChange: (frameSrc: string) => void;
  hasAnyPackage: boolean;
  avatarSrc?: string | null;
  fallback: string;
};

export function AvatarFramePicker({
  value,
  onChange,
  hasAnyPackage,
  avatarSrc,
  fallback,
}: AvatarFramePickerProps) {
  const { t } = useTranslation();
  const { frames, isLoading } = useAvatarFrames();

  const availableFrames = useMemo(
    () => getAvailableAvatarFrames(frames, hasAnyPackage),
    [frames, hasAnyPackage],
  );

  useEffect(() => {
    if (
      !isLoading &&
      frames.length > 0 &&
      value &&
      !canUseAvatarFrame(value, frames, hasAnyPackage)
    ) {
      onChange("");
    }
  }, [frames, hasAnyPackage, isLoading, onChange, value]);

  const handleSelect = (nextFrameSrc: string) => {
    onChange(changeAvatarFrame(value, nextFrameSrc, frames, hasAnyPackage));
  };

  return (
    <div className="w-full space-y-4 rounded-2xl border border-muted/60 bg-muted/20 p-4 dark:border-white/5 dark:bg-black/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t("profile.avatarFrame.title", { defaultValue: "Khung avatar" })}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {hasAnyPackage
              ? t("profile.avatarFrame.allUnlocked", { defaultValue: "Đã mở toàn bộ khung" })
              : t("profile.avatarFrame.defaultOnly", { defaultValue: "Đang dùng 5 khung mặc định" })}
          </p>
        </div>

        <Button
          type="button"
          variant={value ? "outline" : "secondary"}
          size="sm"
          onClick={() => handleSelect("")}
          className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest"
        >
          <CircleSlash className="mr-2 size-4" />
          {t("common.none", { defaultValue: "Không" })}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {availableFrames.map((frame) => {
            const selected = value === frame.src;
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleSelect(frame.src)}
                title={frame.name}
                className={cn(
                  "relative aspect-square rounded-2xl border bg-background p-1.5 transition-all",
                  "hover:-translate-y-0.5 hover:border-pink-400 hover:shadow-lg",
                  selected
                    ? "border-pink-500 ring-2 ring-pink-500/30"
                    : "border-muted dark:border-white/10",
                )}
              >
                <FramedAvatar
                  src={avatarSrc}
                  frameSrc={frame.src}
                  fallback={fallback}
                  className="h-full w-full"
                  fallbackClassName="text-lg"
                  sizes="96px"
                />
                {selected && (
                  <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
