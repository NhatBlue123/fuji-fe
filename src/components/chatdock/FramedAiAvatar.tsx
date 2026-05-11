"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import AiAvatar from "./AiAvatar";

const CHAT_DOCK_FRAME_SRC = "/images/khung_avatar_new/bonsai.png";

type FramedAiAvatarProps = {
  className?: string;
  avatarClassName?: string;
};

export default function FramedAiAvatar({
  className,
  avatarClassName,
}: FramedAiAvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex aspect-square shrink-0 items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-[11%] z-10 rounded-full drop-shadow-[0_8px_16px_rgba(15,23,42,0.32)]",
          avatarClassName,
        )}
      >
        <AiAvatar className="!h-full !w-full" />
      </div>
      <Image
        src={CHAT_DOCK_FRAME_SRC}
        alt=""
        fill
        sizes="96px"
        className="pointer-events-none z-20 object-contain"
        aria-hidden="true"
      />
    </div>
  );
}
