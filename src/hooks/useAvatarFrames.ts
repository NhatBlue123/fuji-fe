"use client";

import { useEffect, useState } from "react";
import type { AvatarFrame } from "@/lib/avatar-frames";

export function useAvatarFrames() {
  const [frames, setFrames] = useState<AvatarFrame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch("/avatar-frames", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (alive) setFrames(Array.isArray(data.frames) ? data.frames : []);
      })
      .catch(() => {
        if (alive) setFrames([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { frames, isLoading };
}
