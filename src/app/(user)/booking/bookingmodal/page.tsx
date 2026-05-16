"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Ban, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useCancelBookingMutation,
  useEndBookingVideoSessionMutation,
  useGetMyBookingsQuery,
} from "@/store/services/bookingApi";
import { useAuth } from "@/store/hooks";
import { MeetingSummaryModal } from "@/components/meeting-summary/MeetingSummaryModal";
import type { MeetingSummaryResult } from "@/hooks/useMeetingSummary";
import { API_CONFIG } from "@/config/api";

type BookingTab = "UPCOMING" | "COMPLETED" | "CANCELLED";

function localeFromLanguage(language: string) {
  if (language.startsWith("ja")) return "ja-JP";
  if (language.startsWith("en")) return "en-US";
  return "vi-VN";
}

function formatDate(v: string, language: string) {
  return new Date(v).toLocaleDateString(localeFromLanguage(language), {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTimeRange(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(s)} - ${hhmm(e)}`;
}

function normalizeSummary(data: unknown): MeetingSummaryResult {
  const source =
    typeof data === "object" && data !== null
      ? (data as Partial<MeetingSummaryResult> & Record<string, unknown>)
      : {};

  return {
    ...source,
    keyPoints: Array.isArray(source.keyPoints) ? source.keyPoints.filter((item): item is string => typeof item === "string") : [],
    actionItems: Array.isArray(source.actionItems) ? source.actionItems as MeetingSummaryResult["actionItems"] : [],
    isMock: Boolean(source.isMock),
    errorMessage: typeof source.errorMessage === "string" ? source.errorMessage : null,
  } as MeetingSummaryResult;
}

export default function MySchedulePage() {
  const { t, i18n } = useTranslation();
  const { isTeacher, isInitialized, accessToken } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [tab, setTab] = useState<BookingTab>("UPCOMING");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"CANCEL" | "END_EARLY">("CANCEL");

  // AI Summary state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<MeetingSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError } = useGetMyBookingsQuery(
    { status: tab },
    { skip: !isInitialized }
  );

  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [endBookingSession, { isLoading: isEndingEarly }] = useEndBookingVideoSessionMutation();

  // Fetch AI Summary for a booking
  const fetchMeetingSummary = useCallback(async (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setSummaryLoading(true);
    setSummaryError(null);
    setCurrentSummary(null);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/booking/${bookingId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No summary exists - either AI was disabled or transcript wasn't collected
          setSummaryError(
            t("booking.modal.summary.noData")
          );
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t("booking.modal.summary.loadFailed"));
      }

      const data = await response.json();
      setCurrentSummary(normalizeSummary(data));
    } catch (err) {
      console.error("[BookingModal] Failed to fetch summary:", err);
      setSummaryError(err instanceof Error ? err.message : t("booking.modal.summary.loadFailed"));
    } finally {
      setSummaryLoading(false);
    }
  }, [t, accessToken]);

  const handleViewSummary = (bookingId: number) => {
    fetchMeetingSummary(bookingId);
    setSummaryModalOpen(true);
  };

  const handleRetrySummary = useCallback(async () => {
    if (!selectedBookingId) return;
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const summaryLanguage = (i18n.language || "vi").split("-")[0];
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/summaries/booking/${selectedBookingId}/generate?language=${summaryLanguage}`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || "";
        // Check if it's a "no transcript" error
        if (errorMsg.toLowerCase().includes("transcript") ||
            errorMsg.toLowerCase().includes("no data") ||
            errorMsg.toLowerCase().includes("không có dữ liệu")) {
          throw new Error(t("booking.modal.summary.noTranscript"));
        }
        throw new Error(errorMsg || t("booking.modal.summary.createFailed"));
      }

      const data = await response.json();
      setCurrentSummary(normalizeSummary(data));
    } catch (err) {
      console.error("[BookingModal] Failed to generate summary:", err);
      setSummaryError(err instanceof Error ? err.message : t("booking.modal.summary.createFailed"));
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedBookingId, t, accessToken, i18n.language]);

  const handleToggleSummaryActionItem = useCallback(async (
    summaryId: number,
    itemIndex: number
  ): Promise<MeetingSummaryResult | null> => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/summaries/${summaryId}/action-items/${itemIndex}/toggle`,
      {
        method: "PATCH",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || t("booking.modal.summary.updateActionFailed"));
    }

    const data = await response.json();
    const updated = normalizeSummary(data);
    setCurrentSummary(updated);
    return updated;
  }, [accessToken, t]);

  const items = data ?? [];

  const handleConfirmCancel = async () => {
    if (deletingId === null) return;
    try {
      if (actionType === "END_EARLY") {
        await endBookingSession({ bookingId: deletingId }).unwrap();
      } else {
        await cancelBooking({ bookingId: deletingId }).unwrap();
      }
      setDeletingId(null);
    } catch (e) {
      console.error("[BookingModal] Failed to update booking:", e);
      alert(actionType === "END_EARLY"
        ? t("booking.modal.alert.endEarlyFailed")
        : t("booking.modal.alert.cancelFailed"));
    }
  };

  const getTeacherAction = (startAt: string, endAt: string) => {
    const now = new Date().getTime();
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    const canCancel = now < start - 5 * 60 * 1000;
    const canEndEarly = now >= start && now < end;
    return { canCancel, canEndEarly };
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0f172a] px-6 relative min-h-screen">
      <div className="px-10 py-8">
        {/* Tab Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {(["UPCOMING", "COMPLETED", "CANCELLED"] as BookingTab[]).map((tabItem) => (
              <button
                key={tabItem}
                onClick={() => setTab(tabItem)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === tabItem ? "bg-secondary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t(`booking.modal.tabs.${tabItem.toLowerCase()}`)}
              </button>
            ))}
          </div>

          <Link
            href={
              isMounted && isTeacher
                ? "/admin/teacher-schedules/teaching-schedule"
                : "/booking"
            }
          >
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-xl text-sm font-bold text-secondary hover:bg-secondary/20 transition-all active:scale-95">
              <span className="material-symbols-outlined text-sm">
                {isMounted && isTeacher ? "calendar_month" : "add"}
              </span>
              {isMounted && isTeacher
                ? t("booking.modal.manageTeachingSchedule")
                : t("booking.modal.newBooking")}
            </button>
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="size-4" />
            <p className="text-sm font-bold">{t("booking.modal.rules.title")}</p>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-amber-100/90">
            <li className="flex items-start gap-2">
              <Clock3 className="mt-0.5 size-3.5 shrink-0" />
              {t("booking.modal.rules.rule1")}
            </li>
            <li className="flex items-start gap-2">
              <Ban className="mt-0.5 size-3.5 shrink-0" />
              {t("booking.modal.rules.rule2")}
            </li>
            <li className="flex items-start gap-2">
              <Ban className="mt-0.5 size-3.5 shrink-0" />
              {t("booking.modal.rules.rule3")}
            </li>
          </ul>
        </div>

        {(isLoading || isFetching) && (
          <div className="text-slate-400 animate-pulse">{t("booking.modal.loading")}</div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {t("booking.modal.fetchError")}
          </div>
        )}

        {!isLoading && !isFetching && !isError && items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
            {t("booking.modal.empty")}
          </div>
        )}

        <div className="space-y-4">
          {items.map((c) => (
            <div
              key={c.bookingId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 w-full">
                <Image
                  src={(c.role === "TEACHER" ? c.studentAvatarUrl : c.teacherAvatarUrl) || "/images/avt-default.jpg"}
                  width={56}
                  height={56}
                  className="size-14 rounded-xl object-cover ring-2 ring-pink-500/20"
                  alt={c.role === "TEACHER"
                    ? t("booking.modal.roles.student")
                    : t("booking.modal.roles.teacher")}
                />
                <div>
                  <h4 className="text-slate-100 font-bold">
                    {c.role === "TEACHER" ? c.studentName : c.teacherName}
                  </h4>
                  <p className="text-pink-400 text-sm">{c.subject}</p>
                  <p className="text-slate-500 text-xs">
                    {c.role === "TEACHER"
                      ? t("booking.modal.roles.student")
                      : t("booking.modal.roles.teacher")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 px-8 border-x border-white/10">
                <div className="flex flex-col items-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{t("booking.modal.date")}</p>
                  <p className="text-white font-bold">{formatDate(c.startAt, i18n.language)}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{t("booking.modal.time")}</p>
                  <p className="text-white font-bold">{formatTimeRange(c.startAt, c.endAt)}</p>
                </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {tab === "UPCOMING" && (
                  <>
                    {c.canJoinVideoCall ? (
                      <Link href={`/learn/lesson/${c.bookingId}`}>
                        <button className="px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-all flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">videocam</span>
                          {t("booking.modal.joinRoom")}
                        </button>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="px-6 py-3 rounded-xl text-sm font-bold bg-secondary/50 text-white/60 cursor-not-allowed transition-all"
                        title={t("booking.modal.joinNotYetTitle")}
                      >
                        {t("booking.modal.waitingRoom")}
                      </button>
                    )}
                    {!isTeacher && (
                      <button
                        onClick={() => handleViewSummary(c.bookingId)}
                        className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-slate-300 hover:bg-purple-500/20 hover:text-purple-300 transition-all flex items-center gap-2"
                      >
                        {t("booking.modal.cancel")}
                      </button>
                    )}
                    {isTeacher && (() => {
                      const action = getTeacherAction(c.startAt, c.endAt);
                      if (action.canEndEarly) {
                        return (
                          <button
                            disabled={isEndingEarly}
                            onClick={() => {
                              setActionType("END_EARLY");
                              setDeletingId(c.bookingId);
                            }}
                            className="px-4 py-3 rounded-xl text-sm font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-50"
                          >
                            {t("booking.modal.endEarly")}
                          </button>
                        );
                      }
                      if (action.canCancel) {
                        return (
                          <button
                            disabled={isCancelling}
                            onClick={() => {
                              setActionType("CANCEL");
                              setDeletingId(c.bookingId);
                            }}
                            className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                          >
                            {t("booking.modal.cancelSchedule")}
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}

                {tab === "COMPLETED" && (
                  <>
                    <button
                      onClick={() => handleViewSummary(c.bookingId)}
                      className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-slate-300 hover:bg-purple-500/20 hover:text-purple-300 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      {t("meetingSummary.viewSummary")}
                    </button>
                    <Link href={`/learn/session/${c.bookingId}`}>
                      <button className="px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {t("booking.modal.viewDetail")}
                      </button>
                    </Link>
                  </>
                )}

                {tab === "CANCELLED" && (
                  <span className="px-6 py-3 rounded-xl text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/20">
                    {t("booking.modal.cancelled")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL AI SUMMARY --- */}
      <MeetingSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summary={currentSummary}
        isLoading={summaryLoading}
        isGenerating={summaryLoading}
        error={summaryError}
        onRetry={handleRetrySummary}
        onToggleActionItem={handleToggleSummaryActionItem}
        isNoDataError={
          summaryError?.toLowerCase().includes("không có dữ liệu") ||
          summaryError?.toLowerCase().includes("no data") ||
          summaryError?.toLowerCase().includes("no transcripts") ||
          summaryError?.toLowerCase().includes("transcript")
        }
      />

      {/* Cancel confirmation modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !isCancelling && setDeletingId(null)}
          />
          <div className="relative bg-[#1e293b] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">warning</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {actionType === "END_EARLY"
                  ? t("booking.modal.confirm.endEarlyTitle")
                  : t("booking.modal.confirm.cancelTitle")}
              </h3>
              <p className="text-slate-400 text-sm mb-8">
                {actionType === "END_EARLY"
                  ? t("booking.modal.confirm.endEarlyDescription")
                  : t("booking.modal.confirm.cancelDescription")}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeletingId(null)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {t("booking.modal.confirm.later")}
                </button>

                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling || isEndingEarly}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-secondary/20"
                >
                  {(isCancelling || isEndingEarly) ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {actionType === "END_EARLY"
                        ? t("booking.modal.confirm.ending")
                        : t("booking.modal.confirm.cancelling")}
                    </>
                  ) : (actionType === "END_EARLY"
                    ? t("booking.modal.confirm.endEarlyConfirm")
                    : t("booking.modal.confirm.cancelConfirm"))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
