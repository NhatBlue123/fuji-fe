"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
  Mic2,
  Search,
  Sparkles,
  StickyNote,
  UserRound,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/store/hooks";
import {
  useGetLessonByBookingQuery,
  useGetLessonSummaryQuery,
  useGetMyNoteQuery,
  useGetQuizQuery,
  useGetQuizResultsQuery,
  useListQuizzesQuery,
  type QuizResponse,
  type QuizResultResponse,
} from "@/store/services/lessonApi";
import { useGetBookingDetailQuery } from "@/store/services/bookingApi";
import { useLessonTranscript, type LessonTranscriptItem } from "@/hooks/useLessonTranscript";
import { useMeetingSummary, type MeetingSummaryResult } from "@/hooks/useMeetingSummary";

type TabId = "summary" | "transcript" | "quiz" | "notes";

const TABS: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "summary", label: "AI Summary", icon: Sparkles },
  { id: "transcript", label: "Transcripts", icon: Mic2 },
  { id: "quiz", label: "Quiz & kết quả", icon: ClipboardList },
  { id: "notes", label: "Notes", icon: StickyNote },
];

const QUIZ_TYPE_LABEL: Record<string, string> = {
  VOCAB: "Từ vựng",
  LISTENING: "Nghe hiểu",
  READING: "Đọc hiểu",
};

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTranscriptTime(item: LessonTranscriptItem) {
  if (item.startTimeMs == null) {
    return item.createdAt ? formatDateTime(item.createdAt) : "--:--";
  }

  const seconds = Math.floor(item.startTimeMs / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function parseOptions(raw?: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).map((item) => String(item)).filter(Boolean);
    }
  } catch {
    return raw
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function groupSubmissionsByUser(results?: QuizResultResponse) {
  const grouped = new Map<number, QuizResultResponse["submissions"]>();
  results?.submissions.forEach((submission) => {
    const current = grouped.get(submission.userId) ?? [];
    current.push(submission);
    grouped.set(submission.userId, current);
  });
  return Array.from(grouped.entries()).map(([userId, submissions]) => ({
    userId,
    userName: submissions[0]?.userName ?? `User ${userId}`,
    submissions,
  }));
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center shadow-sm dark:border-white/15 dark:bg-white/[0.03]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-white/10">
        <Icon className="h-7 w-7 text-muted-foreground dark:text-white/75" />
      </div>
      <h3 className="text-lg font-bold text-foreground dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground dark:text-slate-300">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-foreground dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MeetingSummaryPanel({
  summary,
  isLoading,
  error,
  onDownload,
}: {
  summary: MeetingSummaryResult | null;
  isLoading: boolean;
  error: string | null;
  onDownload: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-pink-300" />
        <span className="text-sm font-semibold text-foreground dark:text-slate-200">Đang tải AI summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-red-100">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="font-semibold">Không tải được AI summary</p>
        </div>
        <p className="mt-2 text-sm text-red-100/80">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Chưa có AI summary"
        description="Khi buổi học có transcript và giáo viên tạo tổng kết, phần tóm tắt sẽ xuất hiện tại đây."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-0">
                {summary.status}
              </span>
              {summary.isMock && (
                <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                  Fallback
                </span>
              )}
              <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-bold text-sky-600">
                {summary.totalWords ?? 0} từ
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black text-foreground dark:text-white">Tóm tắt buổi học</h2>
            <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
              Tạo lúc {formatDateTime(summary.completedAt ?? summary.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted/80 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <Download className="h-4 w-4" />
            Tải summary
          </button>
        </div>
        <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-foreground dark:text-slate-100">
          {summary.summary}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="flex items-center gap-2 text-lg font-black text-foreground dark:text-white">
            <BookOpen className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            Ý chính
          </h3>
          <div className="mt-4 space-y-3">
            {summary.keyPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có key points.</p>
            ) : (
              summary.keyPoints.map((point, index) => (
                <div key={`${point}-${index}`} className="rounded-xl bg-muted p-3 text-sm leading-6 text-foreground dark:bg-white/5 dark:text-slate-100">
                  {point}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="flex items-center gap-2 text-lg font-black text-foreground dark:text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            Việc cần làm
          </h3>
          <div className="mt-4 space-y-3">
            {summary.actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có action items.</p>
            ) : (
              summary.actionItems.map((item, index) => (
                <div key={`${item.task}-${index}`} className="rounded-xl bg-muted p-3 dark:bg-white/5">
                  <div className="flex items-start gap-3">
                    {item.completed ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 text-amber-300" />
                    )}
                    <div>
                      <p className="text-sm font-semibold leading-6 text-foreground dark:text-white">{item.task}</p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                        Phụ trách: {item.assignee}
                        {item.deadline ? ` · Deadline: ${item.deadline}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TranscriptPanel({
  transcripts,
  isLoading,
  error,
  query,
  setQuery,
  onDownload,
}: {
  transcripts: LessonTranscriptItem[];
  isLoading: boolean;
  error: string | null;
  query: string;
  setQuery: (value: string) => void;
  onDownload: () => void;
}) {
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return transcripts;
    return transcripts.filter((item) => {
      const speaker = item.speakerName ?? item.speakerRole ?? "";
      return `${speaker} ${item.content}`.toLowerCase().includes(keyword);
    });
  }, [query, transcripts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-white/[0.04]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm trong transcript..."
            className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-pink-400/70 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-300/60"
          />
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={transcripts.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          <Download className="h-4 w-4" />
          Tải transcript
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-pink-300" />
          <span className="text-sm font-semibold text-foreground dark:text-slate-200">Đang tải transcript...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="Chưa có transcript phù hợp"
          description="Nếu buổi học đã bật transcript realtime, các câu thoại đã lưu sẽ nằm tại đây."
        />
      ) : (
        <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
          {filtered.map((item, index) => (
            <div key={`${item.id ?? index}-${item.startTimeMs ?? item.createdAt}`} className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-100 dark:ring-0">
                    {item.speakerName || item.speakerRole || "Người nói"}
                  </span>
                  {item.speakerRole && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground dark:bg-white/10 dark:text-slate-300">
                      {item.speakerRole}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-muted-foreground dark:text-slate-400">{formatTranscriptTime(item)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-foreground dark:text-slate-100">{item.content}</p>
              {typeof item.confidence === "number" && (
                <p className="mt-3 text-xs text-muted-foreground/80 dark:text-slate-500">Confidence: {Math.round(item.confidence * 100)}%</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizReviewCard({ lessonId, quiz }: { lessonId: number; quiz: QuizResponse }) {
  const { data: detail, isLoading: isLoadingDetail } = useGetQuizQuery(
    { lessonId, quizId: quiz.id },
    { skip: !lessonId || !quiz.id }
  );
  const { data: results, isLoading: isLoadingResults } = useGetQuizResultsQuery(
    { lessonId, quizId: quiz.id },
    { skip: !lessonId || !quiz.id }
  );

  const fullQuiz = detail ?? quiz;
  const questions = fullQuiz.questions ?? [];
  const users = groupSubmissionsByUser(results);
  const questionMap = useMemo(() => {
    const map = new Map<number, NonNullable<QuizResponse["questions"]>[number]>();
    questions.forEach((question) => map.set(question.id, question));
    return map;
  }, [questions]);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-400/15 px-3 py-1 text-xs font-bold text-violet-100">
              {QUIZ_TYPE_LABEL[fullQuiz.quizType] ?? fullQuiz.quizType}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground dark:bg-white/10 dark:text-slate-300">
              {fullQuiz.questionCount} câu
            </span>
          </div>
          <h3 className="mt-3 text-xl font-black text-foreground dark:text-white">{fullQuiz.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">Tạo lúc {formatDateTime(fullQuiz.createdAt)}</p>
        </div>
        {(isLoadingDetail || isLoadingResults) && <Loader2 className="h-5 w-5 animate-spin text-pink-300" />}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            <BookOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Câu hỏi đã tạo
          </h4>
          {questions.length === 0 ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground dark:bg-white/5 dark:text-slate-400">
              Đang tải nội dung câu hỏi hoặc quiz này chưa có câu hỏi.
            </p>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => {
                const options = parseOptions(question.optionsJson);
                return (
                  <div key={question.id} className="rounded-xl bg-muted p-4 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-500 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {question.passageText && (
                          <p className="mb-3 rounded-lg bg-background p-3 text-sm leading-6 text-foreground dark:bg-black/20 dark:text-slate-200">
                            {question.passageText}
                          </p>
                        )}
                        {question.mediaContent && (
                          <audio controls className="mb-3 w-full" src={question.mediaContent}>
                            <track kind="captions" />
                          </audio>
                        )}
                        <p className="text-sm font-semibold leading-6 text-foreground dark:text-white">{question.questionText}</p>
                        {options.length > 0 && (
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {options.map((option, optionIndex) => (
                              <div key={`${option}-${optionIndex}`} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:border-white/10 dark:bg-black/15 dark:text-slate-200">
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.correctAnswer && (
                          <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-200">
                            Đáp án đúng: {question.correctAnswer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-slate-300">{question.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            Kết quả học viên
          </h4>
          {users.length === 0 ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground dark:bg-white/5 dark:text-slate-400">Chưa có kết quả làm quiz.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const score = results?.scoresByUser[String(user.userId)] ?? user.submissions.reduce((sum, item) => sum + item.scorePoints, 0);
                const percent = results?.totalQuestions ? Math.round((score / results.totalQuestions) * 100) : 0;

                return (
                  <div key={user.userId} className="rounded-xl bg-muted p-4 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground dark:text-white">{user.userName}</p>
                        <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                          {score}/{results?.totalQuestions ?? fullQuiz.questionCount} câu đúng
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-100 dark:ring-0">
                        {percent}%
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {user.submissions.map((submission) => {
                        const question = questionMap.get(submission.questionId);
                        return (
                          <div key={`${user.userId}-${submission.questionId}`} className="rounded-lg bg-background p-3 dark:bg-black/15">
                            <div className="flex items-start gap-2">
                              {submission.correct ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                              ) : (
                                <XCircle className="mt-0.5 h-4 w-4 text-red-300" />
                              )}
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-xs font-semibold text-foreground dark:text-slate-200">
                                  {question?.questionText ?? `Câu hỏi ID: ${submission.questionId}`}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                                  Trả lời: {submission.userAnswer || "Chưa trả lời"} · Đáp án: {submission.correctAnswer || question?.correctAnswer || "--"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function QuizArchivePanel({ lessonId, quizzes }: { lessonId: number; quizzes: QuizResponse[] }) {
  if (quizzes.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Chưa có quiz trong buổi học"
        description="Khi giáo viên tạo quiz trong video call, danh sách câu hỏi và kết quả làm bài sẽ được lưu tại đây."
      />
    );
  }

  return (
    <div className="space-y-5">
      {quizzes.map((quiz) => (
        <QuizReviewCard key={quiz.id} lessonId={lessonId} quiz={quiz} />
      ))}
    </div>
  );
}

export default function CompletedLessonSessionPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = Number(params.bookingId);
  const { accessToken, isAuthenticated, isInitialized } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [transcriptQuery, setTranscriptQuery] = useState("");

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(`/login?redirect=/learn/session/${params.bookingId}`);
    }
  }, [isAuthenticated, isInitialized, params.bookingId, router]);

  const canLoad = isInitialized && isAuthenticated && Number.isFinite(bookingId);
  const {
    data: lesson,
    isLoading: isLessonLoading,
  } = useGetLessonByBookingQuery({ bookingId }, { skip: !canLoad });
  const {
    data: bookingDetail,
    isLoading: isBookingLoading,
    error: bookingError,
  } = useGetBookingDetailQuery({ bookingId }, { skip: !canLoad });

  const meetingSummary = useMeetingSummary();
  const summarySessionId =
    meetingSummary.summary?.sessionType === "BOOKING"
      ? Number(meetingSummary.summary.sessionId)
      : null;
  const lessonId =
    lesson?.lessonId ??
    (summarySessionId != null && Number.isFinite(summarySessionId) ? summarySessionId : null);
  const { transcripts, isLoading: isTranscriptLoading, error: transcriptError } = useLessonTranscript(
    lessonId,
    accessToken ?? null
  );
  const { data: quizzes = [], isLoading: isQuizzesLoading } = useListQuizzesQuery(
    { lessonId: lessonId ?? 0 },
    { skip: !lessonId }
  );
  const { data: myNote } = useGetMyNoteQuery({ lessonId: lessonId ?? 0 }, { skip: !lessonId });
  const { data: lessonSummary } = useGetLessonSummaryQuery({ lessonId: lessonId ?? 0 }, { skip: !lessonId });

  useEffect(() => {
    if (!canLoad) return;
    void meetingSummary.getBookingSummary(bookingId);
  }, [bookingId, canLoad, meetingSummary.getBookingSummary]);

  const sessionHeader = useMemo(
    () => ({
      bookingId,
      lessonId,
      status: lesson?.status ?? bookingDetail?.status ?? "COMPLETED",
      subject: lesson?.subject ?? bookingDetail?.subject ?? "Chi tiết buổi học",
      teacherName: lesson?.teacherName ?? bookingDetail?.teacherName ?? "Giảng viên",
      studentName: lesson?.studentName ?? bookingDetail?.studentName ?? "Học viên",
      startAt: lesson?.scheduledStartAt ?? bookingDetail?.startAt ?? null,
      endAt: lesson?.scheduledEndAt ?? bookingDetail?.endAt ?? null,
    }),
    [bookingDetail, bookingId, lesson, lessonId]
  );

  const noteCount = useMemo(() => {
    let count = 0;
    if (myNote?.content?.trim()) count += 1;
    if (lessonSummary?.teacherNote?.trim()) count += 1;
    if (lessonSummary?.homework?.trim()) count += 1;
    if ((lessonSummary?.vocabularyList ?? []).length > 0) count += 1;
    return count;
  }, [lessonSummary, myNote]);

  const transcriptText = useMemo(
    () =>
      transcripts
        .map((item) => {
          const speaker = item.speakerName || item.speakerRole || "Người nói";
          return `[${formatTranscriptTime(item)}] ${speaker}: ${item.content}`;
        })
        .join("\n"),
    [transcripts]
  );

  const summaryText = useMemo(() => {
    const summary = meetingSummary.summary;
    if (!summary) return "";
    const points = summary.keyPoints.map((point) => `- ${point}`).join("\n");
    const actions = summary.actionItems
      .map((item) => `- [${item.completed ? "x" : " "}] ${item.task} (${item.assignee})`)
      .join("\n");
    return [`Tóm tắt buổi học`, "", summary.summary, "", "Ý chính", points, "", "Việc cần làm", actions]
      .filter(Boolean)
      .join("\n");
  }, [meetingSummary.summary]);

  if (!isInitialized || (canLoad && !lesson && !bookingDetail && (isLessonLoading || isBookingLoading))) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground dark:bg-[#07111f] dark:text-white">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-pink-300" />
        <span className="font-semibold">Đang tải chi tiết buổi học...</span>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground dark:bg-[#07111f] dark:text-white">
        <EmptyState
          icon={UserRound}
          title="Bạn cần đăng nhập"
          description="Vui lòng đăng nhập để xem lại transcript, quiz và notes của buổi học."
        />
      </main>
    );
  }

  if (!Number.isFinite(bookingId) || (!lesson && !bookingDetail && bookingError)) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8 dark:bg-[#07111f] dark:text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/booking/bookingmodal" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Quay lại booking
          </Link>
          <div className="mt-6">
            <EmptyState
              icon={AlertCircle}
              title="Không tìm thấy dữ liệu buổi học"
              description="Buổi học này có thể chưa từng được mở phòng hoặc bạn không có quyền xem chi tiết."
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8 dark:bg-[#07111f] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/booking/bookingmodal" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách booking
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-pink-200/70 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-6 shadow-xl shadow-slate-200/70 md:p-8 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.24),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(20,31,52,0.92))] dark:shadow-2xl dark:shadow-black/25">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-0">
                  {sessionHeader.status}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground dark:bg-white/10 dark:text-slate-200">
                  Booking #{sessionHeader.bookingId}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground dark:bg-white/10 dark:text-slate-200">
                  {sessionHeader.lessonId ? `Lesson #${sessionHeader.lessonId}` : "Chưa có lesson room"}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-5xl dark:text-white">
                {sessionHeader.subject}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground dark:text-slate-200">
                Xem lại toàn bộ nội dung đã lưu: transcript realtime, quiz, kết quả làm bài, notes và AI meeting summary.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  <GraduationCap className="h-4 w-4 text-pink-200" />
                  Giảng viên
                </p>
                <p className="mt-2 font-black text-foreground dark:text-white">{sessionHeader.teacherName}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                  <UserRound className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                  Học viên
                </p>
                <p className="mt-2 font-black text-foreground dark:text-white">{sessionHeader.studentName}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          <StatCard label="Transcript" value={String(transcripts.length)} icon={Mic2} tone="bg-sky-500/80" />
          <StatCard label="Quiz" value={isQuizzesLoading ? "..." : String(quizzes.length)} icon={ClipboardList} tone="bg-violet-500/80" />
          <StatCard label="Notes" value={String(noteCount)} icon={StickyNote} tone="bg-amber-500/85" />
          <StatCard label="AI Summary" value={meetingSummary.summary ? "Có" : "Chưa"} icon={Sparkles} tone="bg-emerald-500/80" />
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-card p-3 shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-[#0b1324]/95 dark:shadow-black/20">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 p-1 md:p-3">
            {activeTab === "summary" && (
              <MeetingSummaryPanel
                summary={meetingSummary.summary}
                isLoading={meetingSummary.isLoading}
                error={meetingSummary.error}
                onDownload={() => downloadText(`booking-${bookingId}-summary.txt`, summaryText || "Chưa có summary")}
              />
            )}

            {activeTab === "transcript" && (
              <TranscriptPanel
                transcripts={transcripts}
                isLoading={isTranscriptLoading}
                error={transcriptError}
                query={transcriptQuery}
                setQuery={setTranscriptQuery}
                onDownload={() => downloadText(`booking-${bookingId}-transcript.txt`, transcriptText || "Chưa có transcript")}
              />
            )}

            {activeTab === "quiz" && (
              lessonId ? (
                <QuizArchivePanel lessonId={lessonId} quizzes={quizzes} />
              ) : (
                <EmptyState
                  icon={ClipboardList}
                  title="Chưa có dữ liệu quiz"
                  description="Buổi học này có thể chỉ có summary theo booking, chưa có lesson room để lưu quiz realtime."
                />
              )
            )}

            {activeTab === "notes" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <h3 className="flex items-center gap-2 text-lg font-black text-foreground dark:text-white">
                    <StickyNote className="h-5 w-5 text-amber-300" />
                    Note cá nhân
                  </h3>
                  {myNote?.content?.trim() ? (
                    <div className="mt-4 rounded-xl bg-muted p-4 dark:bg-white/5">
                      <p className="whitespace-pre-line text-sm leading-7 text-foreground dark:text-slate-100">{myNote.content}</p>
                      <p className="mt-4 text-xs text-muted-foreground/80 dark:text-slate-500">Cập nhật: {formatDateTime(myNote.updatedAt ?? myNote.createdAt)}</p>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground dark:bg-white/5 dark:text-slate-400">Bạn chưa ghi note cá nhân cho buổi học này.</p>
                  )}
                </section>

                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <h3 className="flex items-center gap-2 text-lg font-black text-foreground dark:text-white">
                    <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                    Tổng kết từ giáo viên
                  </h3>
                  {!lessonSummary ? (
                    <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground dark:bg-white/5 dark:text-slate-400">Giáo viên chưa gửi tổng kết buổi học.</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {lessonSummary.teacherNote && (
                        <div className="rounded-xl bg-muted p-4 dark:bg-white/5">
                          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground dark:text-slate-400">Nhận xét</p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground dark:text-slate-100">{lessonSummary.teacherNote}</p>
                        </div>
                      )}
                      {lessonSummary.homework && (
                        <div className="rounded-xl bg-muted p-4 dark:bg-white/5">
                          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground dark:text-slate-400">Bài tập về nhà</p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground dark:text-slate-100">{lessonSummary.homework}</p>
                        </div>
                      )}
                      {(lessonSummary.vocabularyList ?? []).length > 0 && (
                        <div className="rounded-xl bg-muted p-4 dark:bg-white/5">
                          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground dark:text-slate-400">Từ vựng cần ôn</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {lessonSummary.vocabularyList.map((word) => (
                              <span key={word} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-400/15 dark:text-cyan-100 dark:ring-0">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {typeof lessonSummary.quizScore === "number" && (
                        <div className="rounded-xl bg-muted p-4 dark:bg-white/5">
                          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground dark:text-slate-400">Điểm quiz tổng kết</p>
                          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-200">{lessonSummary.quizScore}</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
