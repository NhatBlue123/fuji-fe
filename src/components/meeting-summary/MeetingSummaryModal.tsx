"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeetingSummaryResult, ActionItem } from "@/hooks/useMeetingSummary";
import { useTranslation } from "react-i18next";

interface MeetingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MeetingSummaryResult | null;
  isLoading?: boolean;
  isGenerating?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onToggleActionItem?: (summaryId: number, itemIndex: number) => Promise<MeetingSummaryResult | null | void>;
  /** Hide retry button when there's no transcript data */
  isNoDataError?: boolean;
}

export function MeetingSummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading = false,
  isGenerating = false,
  error = null,
  onRetry,
  onToggleActionItem,
  isNoDataError = false,
}: MeetingSummaryModalProps) {
  const { t } = useTranslation();
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const [togglingActionIndex, setTogglingActionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (summary?.actionItems) {
      const completed = new Set<number>();
      summary.actionItems.forEach((item, index) => {
        if (item.completed) {
          completed.add(index);
        }
      });
      setCompletedActions(completed);
    }
  }, [summary?.actionItems]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const setActionCompletedOptimistically = (index: number) => {
    let nextCompleted = false;
    setCompletedActions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
        nextCompleted = true;
      }
      return newSet;
    });
    return nextCompleted;
  };

  const applyCompletedFromSummary = (nextSummary: MeetingSummaryResult) => {
    const completed = new Set<number>();
    nextSummary.actionItems?.forEach((item, index) => {
      if (item.completed) completed.add(index);
    });
    setCompletedActions(completed);
  };

  const toggleActionComplete = async (index: number) => {
    if (!summary?.id || !onToggleActionItem) {
      setActionCompletedOptimistically(index);
      return;
    }

    const wasCompleted = completedActions.has(index);
    setActionCompletedOptimistically(index);
    setTogglingActionIndex(index);

    try {
      const updated = await onToggleActionItem(summary.id, index);
      if (updated) {
        applyCompletedFromSummary(updated);
      } else {
        throw new Error("Action item update failed");
      }
    } catch {
      setCompletedActions((prev) => {
        const reverted = new Set(prev);
        if (wasCompleted) {
          reverted.add(index);
        } else {
          reverted.delete(index);
        }
        return reverted;
      });
    } finally {
      setTogglingActionIndex(null);
    }
  };

  const handleDownload = () => {
    if (!summary) return;

    const content = `
MEETING SUMMARY
================

SUMMARY
-------
${summary.summary}

KEY POINTS
----------
${summary.keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

ACTION ITEMS
------------
${summary.actionItems.map((item, i) => `[${completedActions.has(i) ? "x" : " "}] ${item.task} (${item.assignee})`).join("\n")}

---
Generated: ${summary.completedAt || new Date().toISOString()}
Model: ${summary.modelUsed || "AI"}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeSessionId = String(summary.sessionId).replace(/[^a-zA-Z0-9-_]/g, "");
    const safeDate = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `meeting-summary-${safeSessionId}-${safeDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 bg-[#1a1d27] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-[#F0F0F0] font-semibold text-lg">
                {t("meetingSummary.title", "Meeting Summary")}
              </h2>
              <p className="text-[#8B8FA8] text-xs">
                {summary?.sessionType === "BOOKING" ? "Booking Session" : "Video Call"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#8B8FA8] hover:text-[#F0F0F0]"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                {t("meetingSummary.download", "Download")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-[#8B8FA8] hover:text-[#F0F0F0]"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 text-secondary animate-spin" />
              <p className="text-[#8B8FA8] text-sm">
                {t("meetingSummary.loading", "Loading summary...")}
              </p>
            </div>
          )}

          {/* Generating state */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 text-secondary animate-spin" />
              <p className="text-[#8B8FA8] text-sm">
                {t("meetingSummary.generating", "AI is generating summary...")}
              </p>
              <p className="text-[#8B8FA8] text-xs">
                {t("meetingSummary.generatingHint", "This may take a few seconds")}
              </p>
            </div>
          )}

          {/* Error state */}
          {(error || (summary?.status === "FAILED" && summary.errorMessage)) && !isLoading && !isGenerating && !summary?.summary && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-red-400 text-sm text-center">{error ?? summary?.errorMessage}</p>
              {onRetry && !isNoDataError && (
                <Button
                  onClick={onRetry}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  {t("meetingSummary.retry", "Retry")}
                </Button>
              )}
            </div>
          )}

          {/* Summary content */}
          {summary && summary.status !== "FAILED" && !isLoading && !isGenerating && (
            <div className="space-y-6">
              {(summary.isMock || summary.status === "FAILED" || summary.errorMessage) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {summary.status === "FAILED"
                      ? summary.errorMessage || "Summary generation failed."
                      : summary.isMock
                      ? "This summary is marked as mock data."
                      : summary.errorMessage}
                  </span>
                </div>
              )}

              {/* Summary text */}
              <div>
                <h3 className="text-[#F0F0F0] font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-secondary" />
                  {t("meetingSummary.summary", "Summary")}
                </h3>
                <div className="bg-[#0f1117] rounded-xl p-4 border border-white/5">
                  <p className="text-[#C8C8D0] text-sm leading-relaxed">
                    {summary.summary}
                  </p>
                </div>
              </div>

              {/* Key points */}
              <div>
                <h3 className="text-[#F0F0F0] font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  {t("meetingSummary.keyPoints", "Key Points")}
                </h3>
                <div className="space-y-2">
                  {summary.keyPoints.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 bg-[#0f1117] rounded-lg p-3 border border-white/5"
                    >
                      <span className="h-6 w-6 rounded-full bg-secondary/20 text-secondary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-[#C8C8D0] text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action items */}
              {summary.actionItems.length > 0 && (
                <div>
                  <h3 className="text-[#F0F0F0] font-semibold text-sm mb-3 flex items-center gap-2">
                    <Circle className="h-4 w-4 text-secondary" />
                    {t("meetingSummary.actionItems", "Action Items")}
                  </h3>
                  <div className="space-y-2">
                    {summary.actionItems.map((item: ActionItem, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 rounded-lg p-3 border transition-colors",
                          completedActions.has(index)
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : "bg-[#0f1117] border-white/5"
                        )}
                      >
                        <button
                          onClick={() => toggleActionComplete(index)}
                          disabled={togglingActionIndex === index}
                          className="mt-0.5 shrink-0"
                        >
                          {togglingActionIndex === index ? (
                            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                          ) : completedActions.has(index) ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#8B8FA8]" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm",
                              completedActions.has(index)
                                ? "text-[#8B8FA8] line-through"
                                : "text-[#C8C8D0]"
                            )}
                          >
                            {item.task}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                item.assignee === "TEACHER"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : item.assignee === "STUDENT"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-purple-500/20 text-purple-300"
                              )}
                            >
                              {item.assignee}
                            </span>
                            {item.deadline && (
                              <span className="flex items-center gap-1 text-xs text-[#8B8FA8]">
                                <Clock className="h-3 w-3" />
                                {item.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-[#8B8FA8]">
                  <span>
                    {t("meetingSummary.generatedAt", "Generated")}:{" "}
                    {summary.completedAt
                      ? new Date(summary.completedAt).toLocaleString()
                      : new Date().toLocaleString()}
                  </span>
                  <span>
                    {t("meetingSummary.words", "Words")}: {summary.totalWords || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!summary && !isLoading && !isGenerating && !error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <FileText className="h-12 w-12 text-[#8B8FA8]" />
              <p className="text-[#8B8FA8] text-sm text-center">
                {t("meetingSummary.noSummary", "No summary available yet")}
              </p>
              <p className="text-[#8B8FA8] text-xs text-center">
                {t("meetingSummary.noSummaryHint", "Summary will be generated after the meeting ends")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
