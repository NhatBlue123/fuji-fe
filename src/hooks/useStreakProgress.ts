"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGetStreakProgressQuery } from "@/store/services/progressApi";

interface UseStreakProgressOptions {
  pollingInterval?: number;
  enabled?: boolean;
  onQualified?: () => void;
}

interface StreakNotification {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
  timestamp: number;
}

export function useStreakProgress(options: UseStreakProgressOptions = {}) {
  const { pollingInterval = 15000, enabled = true, onQualified } = options;

  const { data: progress, isLoading, isError, refetch } = useGetStreakProgressQuery(undefined, {
    skip: !enabled,
    pollingInterval,
  });

  const [notification, setNotification] = useState<StreakNotification | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const previousMessageRef = useRef<string | null>(null);
  const previousQualifiedRef = useRef<boolean | null>(null);
  const justQualifiedTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (progress?.justQualified && !justQualifiedTriggeredRef.current) {
      justQualifiedTriggeredRef.current = true;
      onQualified?.();
    }
  }, [progress?.justQualified, onQualified]);

  useEffect(() => {
    if (!progress || isLoading) return;

    const currentMessage = progress.message;

    if (previousMessageRef.current !== currentMessage) {
      previousMessageRef.current = currentMessage;

      let type: "success" | "warning" | "info" = "info";
      if (progress.qualified) {
        type = "success";
      } else if (progress.almostQualified) {
        type = "warning";
      }

      setNotification({
        id: Date.now().toString(),
        message: currentMessage,
        type,
        timestamp: Date.now(),
      });
      setShowNotification(true);

      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [progress?.message, progress?.qualified, progress?.almostQualified, isLoading]);

  useEffect(() => {
    if (progress?.qualified !== undefined) {
      previousQualifiedRef.current = progress.qualified;
    }
  }, [progress?.qualified]);

  useEffect(() => {
    if (!progress?.qualified) {
      justQualifiedTriggeredRef.current = false;
    }
  }, [progress?.qualified]);

  const dismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const manualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    progress,
    isLoading,
    isError,
    notification,
    showNotification,
    dismissNotification,
    manualRefresh,
    qualified: progress?.qualified ?? false,
    almostQualified: progress?.almostQualified ?? false,
    justQualified: progress?.justQualified ?? false,
    progressPercent: progress?.progressPercent ?? 0,
    remainingMinutes: progress?.remainingMinutes ?? 10,
    remainingCards: progress?.remainingCards ?? 20,
    currentStreak: progress?.currentStreak ?? 0,
    message: progress?.message ?? "",
  };
}
