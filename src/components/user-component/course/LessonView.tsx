"use client";

import { useTranslation } from "react-i18next";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetCourseByIdQuery,
  useGetLessonsByCourseQuery,
  useGetLessonByIdQuery,
  useTrackLessonProgressMutation,
  useCompleteLessonMutation,
} from "@/store/services/courseApi";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { LessonResponseDTO, TaskType } from "@/types/course";
import {
  MultipleChoiceTask,
  FillBlankTask,
  ListeningTask,
  MatchingTask,
  SpeakingTask,
  ReadingTask,
  parseTaskData,
} from "./task-renderers";

// ─── Helpers ───────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0:00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:00`;
  return `${m}:00`;
}

function formatDurationReadable(minutes: number, t: any): string {
  if (!minutes || minutes <= 0) return `0 ${t("common.time.minute") || "phút"}`;
  if (minutes < 60) return `${minutes} ${t("common.time.minute") || "phút"}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0
    ? `${h} ${t("common.time.hour") || "giờ"} ${m} ${t("common.time.minute") || "phút"}`
    : `${h} ${t("common.time.hour") || "giờ"}`;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── Skeleton ──────────────────────────────────────────

function LessonSkeleton() {
  return (
    <div className="flex flex-col h-[100dvh] bg-[hsl(var(--background))] animate-pulse -mt-[1px]">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 h-full px-6">
          <div className="size-8 rounded-lg bg-muted" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8">
          <div className="w-full aspect-video bg-muted rounded-2xl mb-6" />
          <div className="h-6 w-2/3 bg-muted rounded mb-3" />
          <div className="h-4 w-1/3 bg-muted rounded" />
        </div>
        <div className="w-80 bg-card border-l border-border p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LockedLessonNotice({
  courseId,
  lessonTitle,
  reason,
  fallbackLessonId,
}: {
  courseId: number;
  lessonTitle?: string;
  reason: "course" | "sequence";
  fallbackLessonId?: number;
}) {
  const { t } = useTranslation();
  const ctaHref =
    reason === "sequence" && fallbackLessonId
      ? `/course/${courseId}/lesson/${fallbackLessonId}`
      : `/course/${courseId}`;

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-background text-center px-6 -mt-[1px]">
      <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
        lock
      </span>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {reason === "sequence"
          ? t("course.lesson.lockedTitleSequence")
          : t("course.lesson.lockedTitleEnroll")}
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        {reason === "sequence"
          ? lessonTitle
            ? t("course.lesson.lockedDescSequenceDetailed", {
                title: lessonTitle,
              })
            : t("course.lesson.lockedDescSequence")
          : lessonTitle
            ? t("course.lesson.lockedDescEnrollDetailed", {
                title: lessonTitle,
              })
            : t("course.lesson.lockedDescEnroll")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={ctaHref}
          className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 transition-colors"
        >
          {reason === "sequence"
            ? t("course.lesson.actionSequence")
            : t("course.lesson.actionEnroll")}
        </Link>
        <Link
          href={`/course/${courseId}`}
          className="px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
        >
          {reason === "sequence"
            ? t("course.lesson.actionSequenceAlt")
            : t("course.lesson.actionEnrollAlt")}
        </Link>
      </div>
    </div>
  );
}

// ─── Video Player ──────────────────────────────────────

function VideoPlayer({
  lesson,
  onMarkCompleted,
  isCompleting,
}: {
  lesson: LessonResponseDTO;
  onMarkCompleted: () => void;
  isCompleting: boolean;
}) {
  const { t } = useTranslation();

  const renderCompletionAction = () => {
    if (lesson.userCompleted) {
      return (
        <div className="mt-3 flex w-full items-center justify-end gap-2 text-emerald-400 text-sm font-medium">
          <span className="material-symbols-outlined filled text-base">
            check_circle
          </span>
          {t("course.lesson.completed")}
        </div>
      );
    }

    return (
      <div className="mt-3 flex w-full items-center justify-end gap-3">
        <button
          type="button"
          onClick={onMarkCompleted}
          disabled={isCompleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] filled">
            {isCompleting ? "sync" : "check_circle"}
          </span>
          {isCompleting ? t("common.updating") : t("course.lesson.markAsDone")}
        </button>
      </div>
    );
  };

  if (lesson.lessonType !== "video" || !lesson.videoUrl) {
    return (
      <div className="w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden border border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <span className="material-symbols-outlined text-5xl mb-2 block">
            videocam_off
          </span>
          <p className="text-sm">{t("auto.lessonview_1")}</p>
        </div>
      </div>
    );
  }

  if (lesson.videoType === "youtube") {
    const videoId = extractYouTubeId(lesson.videoUrl);
    if (!videoId) {
      return (
        <div className="w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden border border-border flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {t("course.lesson.invalidYoutube")}
          </p>
        </div>
      );
    }
    return (
      <div>
        <div className="relative w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-border">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        {renderCompletionAction()}
      </div>
    );
  }

  // Uploaded video
  return (
    <div>
      <div className="relative w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-border">
        <video
          src={lesson.videoUrl}
          controls
          onEnded={() => {
            if (!lesson.userCompleted && !isCompleting) {
              onMarkCompleted();
            }
          }}
          className="absolute inset-0 w-full h-full object-contain"
          poster=""
        >
          <track kind="captions" />
        </video>
      </div>
      {renderCompletionAction()}
    </div>
  );
}

// ─── Task Content ──────────────────────────────────────

const TASK_RENDERERS: Record<
  TaskType,
  React.ComponentType<{
    data: ReturnType<typeof parseTaskData> & object;
    onTaskSubmitted?: () => void;
  }>
> = {
  multiple_choice: MultipleChoiceTask,
  fill_blank: FillBlankTask,
  listening: ListeningTask,
  matching: MatchingTask,
  speaking: SpeakingTask,
  reading: ReadingTask,
};

function TaskContent({
  lesson,
  onMarkCompleted,
}: {
  lesson: LessonResponseDTO;
  onMarkCompleted: () => void;
}) {
  const { t } = useTranslation();

  const taskLabel: Record<string, string> = {
    multiple_choice: t("course.task.type.multipleChoice"),
    fill_blank: t("course.task.type.fillBlank"),
    listening: t("course.task.type.listening"),
    matching: t("course.task.type.matching"),
    speaking: t("course.task.type.speaking"),
    reading: t("course.task.type.reading"),
  };

  const parsed = parseTaskData(lesson.taskData ?? null);
  const Renderer = lesson.taskType ? TASK_RENDERERS[lesson.taskType] : null;

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-6 md:p-8 relative z-0">
      {/* Interactive task renderer */}
      {Renderer && parsed ? (
        <Renderer data={parsed} onTaskSubmitted={onMarkCompleted} />
      ) : (
        <div className="bg-muted/50 rounded-xl p-6 border border-border text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/50 mb-2 block">
            assignment
          </span>
          <p className="text-sm text-muted-foreground">
            {lesson.taskType
              ? t("course.lesson.noTaskData")
              : t("course.lesson.taskUpcoming")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Lesson Item ───────────────────────────────

function SidebarLessonItem({
  lesson,
  isActive,
  courseId,
  canAccessCourse,
  isSequentiallyUnlocked,
}: {
  lesson: LessonResponseDTO;
  isActive: boolean;
  courseId: number;
  canAccessCourse: boolean;
  isSequentiallyUnlocked: boolean;
}) {
  const { t } = useTranslation();

  const isVideo = lesson.lessonType === "video";
  const canAccessByPolicy = canAccessCourse || lesson.isPreview;
  const canAccessLesson = canAccessByPolicy && isSequentiallyUnlocked;
  const lockLabel = canAccessByPolicy
    ? t("course.lesson.labelSequence")
    : t("course.lesson.labelEnroll");

  if (isActive) {
    return (
      <div className="relative p-4 flex gap-3 cursor-default bg-gradient-to-r from-secondary/10 to-transparent border-l-[3px] border-secondary">
        <div className="mt-1 relative z-10">
          <div className="size-6 rounded-full bg-secondary flex items-center justify-center shadow-[0_0_10px_rgba(244,114,182,0.5)]">
            <span className="material-symbols-outlined text-white text-[14px] filled">
              {isVideo ? "play_arrow" : "quiz"}
            </span>
          </div>
        </div>
        <div className="flex-1 relative z-10">
          <h4 className="text-sm font-bold text-foreground mb-1.5">
            {lesson.title}
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded font-bold shadow-sm">
                {t("course.lesson.status.learning")}
              </span>
              {lesson.userCompleted && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                  {t("course.lesson.status.completed")}
                </span>
              )}
              {lesson.isPreview && (
                <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">
                  {t("course.lesson.status.preview")}
                </span>
              )}
            </div>
            {lesson.duration > 0 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                {formatDuration(lesson.duration)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessLesson) {
    return (
      <div className="p-4 border-l-[3px] border-transparent flex gap-3 opacity-75 cursor-not-allowed">
        <div className="mt-1">
          <div className="size-6 rounded-full flex items-center justify-center border border-border bg-muted/50">
            <span className="material-symbols-outlined text-[14px] text-muted-foreground">
              lock
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium mb-1 text-muted-foreground">
            {lesson.title}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
              {lockLabel}
            </span>
            {lesson.duration > 0 && (
              <span className="text-[11px] text-muted-foreground/60">
                {formatDuration(lesson.duration)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/course/${courseId}/lesson/${lesson.id}`}
      className={`p-4 border-l-[3px] flex gap-3 cursor-pointer group transition-all ${
        lesson.userCompleted
          ? "bg-emerald-500/5 border-emerald-500/40 hover:bg-emerald-500/10"
          : "border-transparent hover:bg-muted/30"
      }`}
    >
      <div className="mt-1">
        <div
          className={`size-6 rounded-full flex items-center justify-center transition-colors ${
            lesson.userCompleted
              ? "bg-green-500/20 border border-green-500/40"
              : "border border-border group-hover:border-muted-foreground"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[14px] ${
              lesson.userCompleted
                ? "text-green-500 filled"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {lesson.userCompleted ? "check" : isVideo ? "play_arrow" : "quiz"}
          </span>
        </div>
      </div>
      <div className="flex-1">
        <h4
          className={`text-sm font-medium mb-1 transition-colors ${
            lesson.userCompleted
              ? "text-emerald-300"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {lesson.title}
        </h4>
        <div className="flex items-center gap-2">
          {lesson.userCompleted && (
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              {t("course.lesson.status.completed")}
            </span>
          )}
          {!lesson.userCompleted && (
            <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
              {t("course.lesson.status.notStarted")}
            </span>
          )}
          {lesson.isPreview && (
            <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
              {t("course.lesson.status.preview")}
            </span>
          )}
          {lesson.duration > 0 && (
            <span className="text-[11px] text-muted-foreground/60">
              {formatDuration(lesson.duration)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────

export default function LessonView({
  courseId,
  lessonId,
}: {
  courseId: number;
  lessonId: number;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { isPremium } = useFeatureAccess();
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "qa" | "notes">(
    "overview",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: course, isLoading: courseLoading } =
    useGetCourseByIdQuery(courseId);

  const { data: lessons = [], isLoading: lessonsLoading } =
    useGetLessonsByCourseQuery(courseId);

  const {
    data: lesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useGetLessonByIdQuery(lessonId);
  const [trackLessonProgress] = useTrackLessonProgressMutation();
  const [completeLesson, { isLoading: isCompletingLesson }] =
    useCompleteLessonMutation();

  // Sorted lessons
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonOrder - b.lessonOrder),
    [lessons, i18n.language],
  );
  const currentLessonMeta = sortedLessons.find((l) => l.id === lessonId);
  const firstIncompleteIndex = sortedLessons.findIndex((l) => !l.userCompleted);
  const maxUnlockedIndex =
    firstIncompleteIndex === -1
      ? sortedLessons.length - 1
      : firstIncompleteIndex;
  const sequentialUnlockedLessonIds = useMemo(() => {
    const unlockedIds = new Set<number>();
    sortedLessons.forEach((item, idx) => {
      if (idx <= maxUnlockedIndex || item.userCompleted) {
        unlockedIds.add(item.id);
      }
    });
    return unlockedIds;
  }, [maxUnlockedIndex, sortedLessons, i18n.language]);

  const canAccessCourse = isPremium || Boolean(course?.isEnrolled);
  const canAccessCurrentLessonByPolicy =
    canAccessCourse || Boolean(currentLessonMeta?.isPreview);
  const isCurrentLessonSequentiallyUnlocked = currentLessonMeta
    ? sequentialUnlockedLessonIds.has(currentLessonMeta.id)
    : false;
  const canAccessCurrentLesson =
    canAccessCurrentLessonByPolicy && isCurrentLessonSequentiallyUnlocked;
  const fallbackLessonId =
    maxUnlockedIndex >= 0 && maxUnlockedIndex < sortedLessons.length
      ? sortedLessons[maxUnlockedIndex]?.id
      : undefined;

  useEffect(() => {
    if (!courseId || !lessonId || !canAccessCurrentLesson) return;

    trackLessonProgress({ courseId, lessonId })
      .unwrap()
      .catch(() => {
        // Tracking failures should not block lesson consumption.
      });
  }, [canAccessCurrentLesson, courseId, lessonId, trackLessonProgress]);

  const handleMarkCurrentLessonCompleted = async () => {
    if (!lesson || lesson.userCompleted) {
      return;
    }

    try {
      await completeLesson({ courseId, lessonId: lesson.id }).unwrap();
    } catch {
      // Keep lesson page usable even if completion update fails.
    }
  };

  // Progress calculation
  const completedCount = sortedLessons.filter((l) => l.userCompleted).length;
  const totalCount = sortedLessons.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Navigation helpers
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null;
  const canAccessPrevLesson =
    !!prevLesson &&
    (canAccessCourse || prevLesson.isPreview) &&
    sequentialUnlockedLessonIds.has(prevLesson.id);
  const canAccessNextLesson =
    !!nextLesson &&
    (canAccessCourse || nextLesson.isPreview) &&
    sequentialUnlockedLessonIds.has(nextLesson.id);

  // Loading
  if (courseLoading || lessonLoading || lessonsLoading) {
    return <LessonSkeleton />;
  }

  const lessonErrorStatus =
    typeof lessonError === "object" &&
    lessonError !== null &&
    "status" in lessonError
      ? Number((lessonError as { status?: number }).status)
      : undefined;

  if (
    !lesson &&
    (lessonErrorStatus === 403 ||
      (Boolean(currentLessonMeta) && !canAccessCurrentLessonByPolicy))
  ) {
    return (
      <LockedLessonNotice
        courseId={courseId}
        lessonTitle={currentLessonMeta?.title}
        reason="course"
      />
    );
  }

  if (
    currentLessonMeta &&
    canAccessCurrentLessonByPolicy &&
    !isCurrentLessonSequentiallyUnlocked
  ) {
    return (
      <LockedLessonNotice
        courseId={courseId}
        lessonTitle={currentLessonMeta.title}
        reason="sequence"
        fallbackLessonId={fallbackLessonId}
      />
    );
  }

  // Error
  if (lessonError || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-background text-center -mt-[1px]">
        <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
          error
        </span>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t("course.lesson.notFound")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("course.lesson.deleted")}
        </p>
        <Link
          href={`/course/${courseId}`}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          {t("course.lesson.backToCourse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[hsl(var(--background))] -mt-[1px] relative">
      {/* ══════════════════ HEADER ══════════════════ */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded-lg"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <h1 className="font-bold text-lg text-foreground truncate max-w-[200px] sm:max-w-md">
            {course?.title || t("common.loading")}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-secondary font-bold hidden sm:inline-block">
            {progressPercent}% {t("course.lesson.completedSuffix")}
          </span>
          {/* Circular progress */}
          <div className="relative size-10">
            <svg
              className="size-full -rotate-90 transform"
              viewBox="0 0 36 36"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="stroke-muted"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeWidth="3"
              />
              <circle
                className="stroke-secondary"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="100"
                strokeDashoffset={100 - progressPercent}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
              {progressPercent}%
            </div>
          </div>
          {/* Mobile sidebar toggle */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="material-symbols-outlined">
              {sidebarOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* ══════════════════ BODY ══════════════════ */}
      <div
        className="flex-1 flex overflow-hidden relative"
        style={{ isolation: "isolate" }}
      >
        {/* ── Main Content ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Video / Task Area */}
          {lesson.lessonType === "video" ? (
            <VideoPlayer
              lesson={lesson}
              onMarkCompleted={handleMarkCurrentLessonCompleted}
              isCompleting={isCompletingLesson}
            />
          ) : (
            <TaskContent
              lesson={lesson}
              onMarkCompleted={handleMarkCurrentLessonCompleted}
            />
          )}

          {/* Lesson Title & Info */}
          <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-border">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {currentIndex >= 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {t("course.lesson.lessonPrefix")} {currentIndex + 1}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    lesson.lessonType === "video"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {lesson.lessonType === "video"
                    ? t("common.video")
                    : t("common.task")}
                </span>
                {lesson.taskType && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                    {lesson.taskType.replace("_", " ")}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2 leading-tight">
                {lesson.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("common.lastUpdated")}:{" "}
                {new Date(lesson.updatedAt).toLocaleDateString(
                  i18n.language === "vi"
                    ? "vi-VN"
                    : i18n.language === "ja"
                      ? "ja-JP"
                      : "en-US",
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lesson.duration > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-muted-foreground">
                  <span className="material-symbols-outlined text-secondary text-lg">
                    timer
                  </span>
                  {formatDurationReadable(lesson.duration, t)}
                </div>
              )}
              {lesson.completionCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-muted-foreground">
                  <span className="material-symbols-outlined text-green-500 text-lg">
                    group
                  </span>
                  {lesson.completionCount}{" "}
                  {t("course.lesson.completedCountSuffix")}
                </div>
              )}
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="mt-8">
            <div className="flex gap-8 text-sm font-bold text-muted-foreground border-b border-border mb-6">
              <button
                onClick={() => setActiveSubTab("overview")}
                className={`pb-3 px-2 transition-colors ${
                  activeSubTab === "overview"
                    ? "text-secondary border-b-2 border-secondary"
                    : "hover:text-foreground"
                }`}
              >
                {t("course.lesson.tab.overview")}
              </button>
              <button
                onClick={() => setActiveSubTab("qa")}
                className={`pb-3 px-2 transition-colors ${
                  activeSubTab === "qa"
                    ? "text-secondary border-b-2 border-secondary"
                    : "hover:text-foreground"
                }`}
              >
                {t("course.lesson.tab.qa")}
              </button>
              <button
                onClick={() => setActiveSubTab("notes")}
                className={`pb-3 px-2 transition-colors ${
                  activeSubTab === "notes"
                    ? "text-secondary border-b-2 border-secondary"
                    : "hover:text-foreground"
                }`}
              >
                {t("course.lesson.tab.notes")}
              </button>
            </div>

            {/* Tab content */}
            {activeSubTab === "overview" && (
              <div className="prose prose-invert max-w-none text-muted-foreground">
                <h3 className="text-foreground font-bold text-lg mb-3">
                  {t("course.lesson.content")}
                </h3>
                {lesson.content ? (
                  <div className="whitespace-pre-line leading-relaxed">
                    {lesson.content}
                  </div>
                ) : (
                  <p className="text-muted-foreground/60 italic">
                    {t("course.lesson.noDescription")}
                  </p>
                )}
              </div>
            )}

            {activeSubTab === "qa" && (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-5xl mb-3 block text-muted-foreground/40">
                  forum
                </span>
                <p className="font-medium mb-1">{t("auto.lessonview_2")}</p>
                <p className="text-sm text-muted-foreground/60">
                  Tính năng hỏi đáp sẽ sớm được cập nhật
                </p>
              </div>
            )}

            {activeSubTab === "notes" && (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-5xl mb-3 block text-muted-foreground/40">
                  edit_note
                </span>
                <p className="font-medium mb-1">{t("auto.lessonview_3")}</p>
                <p className="text-sm text-muted-foreground/60">
                  Tính năng ghi chú cá nhân sẽ sớm được cập nhật
                </p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 pb-4 border-t border-border">
            {prevLesson && canAccessPrevLesson ? (
              <Link
                href={`/course/${courseId}/lesson/${prevLesson.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-card hover:bg-muted text-foreground rounded-xl border border-border transition-all font-medium text-sm group"
              >
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-secondary transition-colors">
                  arrow_back
                </span>
                <div className="text-left hidden sm:block">
                  <div className="text-xs text-muted-foreground">
                    {t("auto.lessonview_4")}
                  </div>
                  <div className="text-sm font-bold truncate max-w-[180px]">
                    {prevLesson.title}
                  </div>
                </div>
              </Link>
            ) : prevLesson ? (
              <div className="flex items-center gap-2 px-5 py-3 bg-card text-muted-foreground rounded-xl border border-border font-medium text-sm opacity-70 cursor-not-allowed">
                <span className="material-symbols-outlined">lock</span>
                <div className="text-left hidden sm:block">
                  <div className="text-xs">{t("auto.lessonview_5")}</div>
                  <div className="text-sm font-bold truncate max-w-[180px]">
                    {prevLesson.title}
                  </div>
                </div>
              </div>
            ) : (
              <div />
            )}

            {nextLesson && canAccessNextLesson ? (
              <Link
                href={`/course/${courseId}/lesson/${nextLesson.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-secondary/80 text-white rounded-xl transition-all font-medium text-sm group shadow-lg shadow-secondary/20"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-white/70">
                    {t("auto.lessonview_6")}
                  </div>
                  <div className="text-sm font-bold truncate max-w-[180px]">
                    {nextLesson.title}
                  </div>
                </div>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            ) : nextLesson ? (
              <div className="flex items-center gap-2 px-5 py-3 bg-card text-muted-foreground rounded-xl border border-border font-medium text-sm opacity-70 cursor-not-allowed">
                <div className="text-right hidden sm:block">
                  <div className="text-xs">{t("auto.lessonview_7")}</div>
                  <div className="text-sm font-bold truncate max-w-[180px]">
                    {nextLesson.title}
                  </div>
                </div>
                <span className="material-symbols-outlined">lock</span>
              </div>
            ) : (
              <Link
                href={`/course/${courseId}`}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-green-600/20"
              >
                <span className="material-symbols-outlined filled">
                  check_circle
                </span>
                {t("course.lesson.completeCourse")}
              </Link>
            )}
          </div>
        </div>

        {/* ── Right Sidebar (Lesson List) ── */}
        {/* Desktop */}
        <aside className="w-80 lg:w-96 bg-card border-l border-border flex-col shrink-0 hidden lg:flex z-20">
          <div className="p-5 border-b border-border sticky top-0 z-10 bg-card">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                list_alt
              </span>
              {t("course.lesson.courseContent")}
            </h3>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all shadow-[0_0_8px_rgba(244,114,182,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedLessons.map((l) => (
              <SidebarLessonItem
                key={l.id}
                lesson={l}
                isActive={l.id === lessonId}
                courseId={courseId}
                canAccessCourse={canAccessCourse}
                isSequentiallyUnlocked={sequentialUnlockedLessonIds.has(l.id)}
              />
            ))}
            {sortedLessons.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {t("course.lesson.noLessons")}
              </div>
            )}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border flex flex-col z-50 lg:hidden shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    list_alt
                  </span>
                  {t("course.lesson.courseContent")}
                </h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex items-center gap-2 px-5 pb-3">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sortedLessons.map((l) => (
                  <SidebarLessonItem
                    key={l.id}
                    lesson={l}
                    isActive={l.id === lessonId}
                    courseId={courseId}
                    canAccessCourse={canAccessCourse}
                    isSequentiallyUnlocked={sequentialUnlockedLessonIds.has(
                      l.id,
                    )}
                  />
                ))}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
