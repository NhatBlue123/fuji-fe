"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { normalizeAvatarFramePath } from "@/lib/avatar-frames";

type FramedAvatarProps = {
  src?: string | null;
  frameSrc?: string | null;
  fallback: ReactNode;
  alt?: string;
  sizes?: string;
  className?: string;
  avatarClassName?: string;
  fallbackClassName?: string;
  frameClassName?: string;
};

export function FramedAvatar({
  src,
  frameSrc,
  fallback,
  alt = "avatar",
  sizes = "160px",
  className,
  avatarClassName,
  fallbackClassName,
  frameClassName,
}: FramedAvatarProps) {
  const safeFrameSrc = normalizeAvatarFramePath(frameSrc);
  const avatarInset = safeFrameSrc ? "inset-[10%]" : "inset-0";

  return (
    <div
      className={cn(
        "relative inline-flex aspect-square shrink-0 items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "absolute overflow-hidden rounded-full bg-background shadow-inner",
          "z-0",
          avatarInset,
          avatarClassName,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            className="object-cover"
            fill
            sizes={sizes}
            unoptimized={src.startsWith("blob:")}
          />
        ) : (
          <span
            className={cn(
              "flex h-full w-full items-center justify-center bg-clip-text text-transparent",
              "bg-gradient-to-br from-pink-400 to-cyan-400 font-black",
              fallbackClassName,
            )}
          >
            {fallback}
          </span>
        )}
      </div>

      {safeFrameSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeFrameSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-10 h-full w-full object-contain",
            frameClassName,
          )}
        />
      )}
    </div>
  );
}
