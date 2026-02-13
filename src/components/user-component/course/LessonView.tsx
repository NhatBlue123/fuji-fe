"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetCourseByIdQuery,
  useGetLessonsByCourseQuery,
  useGetLessonByIdQuery,
} from "@/store/services/courseApi";
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

function formatDurationReadable(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 phút";
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
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

// ─── Video Player ──────────────────────────────────────

function VideoPlayer({ lesson }: { lesson: LessonResponseDTO }) {
  if (lesson.lessonType !== "video" || !lesson.videoUrl) {
    return (
      <div className="w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden border border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <span className="material-symbols-outlined text-5xl mb-2 block">
            videocam_off
          </span>
          <p className="text-sm">Video chưa được tải lên</p>
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
            Link YouTube không hợp lệ
          </p>
        </div>
      );
    }
    return (
      <div className="relative w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-border">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // Uploaded video
  return (
    <div className="relative w-full aspect-[16/9] min-h-[400px] max-h-[75vh] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-border">
      <video
        src={lesson.videoUrl}
        controls
        className="absolute inset-0 w-full h-full object-contain"
        poster=""
      >
        <track kind="captions" />
      </video>
    </div>
  );
}

// ─── Task Content ──────────────────────────────────────

const TASK_RENDERERS: Record<
  TaskType,
  React.ComponentType<{ data: ReturnType<typeof parseTaskData> & object }>
> = {
  multiple_choice: MultipleChoiceTask,
  fill_blank: FillBlankTask,
  listening: ListeningTask,
  matching: MatchingTask,
  speaking: SpeakingTask,
  reading: ReadingTask,
};

function TaskContent({ lesson }: { lesson: LessonResponseDTO }) {
  const taskLabel: Record<string, string> = {
    multiple_choice: "Trắc nghiệm",
    fill_blank: "Điền vào chỗ trống",
    listening: "Nghe hiểu",
    matching: "Nối từ",
    speaking: "Luyện nói",
    reading: "Đọc hiểu",
  };

  const parsed = parseTaskData(lesson.taskData ?? null);
  const Renderer = lesson.taskType
    ? TASK_RENDERERS[lesson.taskType]
    : null;

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-6 md:p-8 relative z-0">
      {/* Interactive task renderer */}
      {Renderer && parsed ? (
        <Renderer data={parsed} />
      ) : (
        <div className="bg-muted/50 rounded-xl p-6 border border-border text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/50 mb-2 block">
            assignment
          </span>
          <p className="text-sm text-muted-foreground">
            {lesson.taskType
              ? "Chưa có dữ liệu bài tập"
              : "Hệ thống bài tập tương tác sẽ được cập nhật sớm"}
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
}: {
  lesson: LessonResponseDTO;
  isActive: boolean;
  courseId: number;
}) {
  const isVideo = lesson.lessonType === "video";

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
                Đang học
              </span>
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

  return (
    <Link
      href={`/course/${courseId}/lesson/${lesson.id}`}
      className={`p-4 border-l-[3px] border-transparent hover:bg-muted/30 flex gap-3 cursor-pointer group transition-all ${
        lesson.userCompleted ? "opacity-70" : ""
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
              ? "text-muted-foreground line-through"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {lesson.title}
        </h4>
        <div className="flex items-center gap-2">
          {lesson.userCompleted && (
            <span className="text-[10px] text-green-500 font-bold">
              Hoàn thành
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
  const router = useRouter();
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

  // Sorted lessons
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.lessonOrder - b.lessonOrder),
    [lessons],
  );

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

  // Loading
  if (courseLoading || lessonLoading || lessonsLoading) {
    return <LessonSkeleton />;
  }

  // Error
  if (lessonError || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-background text-center -mt-[1px]">
        <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
          error
        </span>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Không tìm thấy bài học
        </h2>
        <p className="text-muted-foreground mb-6">
          Bài học này không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href={`/course/${courseId}`}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          Quay về khóa học
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
            {course?.title || "Đang tải..."}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-secondary font-bold hidden sm:inline-block">
            {progressPercent}% Hoàn thành
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
      <div className="flex-1 flex overflow-hidden relative" style={{ isolation: 'isolate' }}>
        {/* ── Main Content ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Video / Task Area */}
          {lesson.lessonType === "video" ? (
            <VideoPlayer lesson={lesson} />
          ) : (
            <TaskContent lesson={lesson} />
          )}

          {/* Lesson Title & Info */}
          <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-border">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {currentIndex >= 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    Bài {currentIndex + 1}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    lesson.lessonType === "video"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {lesson.lessonType === "video" ? "Video" : "Bài tập"}
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
                Cập nhật lần cuối:{" "}
                {new Date(lesson.updatedAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lesson.duration > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-muted-foreground">
                  <span className="material-symbols-outlined text-secondary text-lg">
                    timer
                  </span>
                  {formatDurationReadable(lesson.duration)}
                </div>
              )}
              {lesson.completionCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-muted-foreground">
                  <span className="material-symbols-outlined text-green-500 text-lg">
                    group
                  </span>
                  {lesson.completionCount} đã hoàn thành
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
                Tổng quan
              </button>
              <button
                onClick={() => setActiveSubTab("qa")}
                className={`pb-3 px-2 transition-colors ${
                  activeSubTab === "qa"
                    ? "text-secondary border-b-2 border-secondary"
                    : "hover:text-foreground"
                }`}
              >
                Hỏi đáp
              </button>
              <button
                onClick={() => setActiveSubTab("notes")}
                className={`pb-3 px-2 transition-colors ${
                  activeSubTab === "notes"
                    ? "text-secondary border-b-2 border-secondary"
                    : "hover:text-foreground"
                }`}
              >
                Ghi chú cá nhân
              </button>
            </div>

            {/* Tab content */}
            {activeSubTab === "overview" && (
              <div className="prose prose-invert max-w-none text-muted-foreground">
                <h3 className="text-foreground font-bold text-lg mb-3">
                  Nội dung bài học
                </h3>
                {lesson.content ? (
                  <div className="whitespace-pre-line leading-relaxed">
                    {lesson.content}
                  </div>
                ) : (
                  <p className="text-muted-foreground/60 italic">
                    Chưa có mô tả cho bài học này.
                  </p>
                )}
              </div>
            )}

            {activeSubTab === "qa" && (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-5xl mb-3 block text-muted-foreground/40">
                  forum
                </span>
                <p className="font-medium mb-1">Chưa có câu hỏi nào</p>
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
                <p className="font-medium mb-1">Chưa có ghi chú nào</p>
                <p className="text-sm text-muted-foreground/60">
                  Tính năng ghi chú cá nhân sẽ sớm được cập nhật
                </p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 pb-4 border-t border-border">
            {prevLesson ? (
              <Link
                href={`/course/${courseId}/lesson/${prevLesson.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-card hover:bg-muted text-foreground rounded-xl border border-border transition-all font-medium text-sm group"
              >
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-secondary transition-colors">
                  arrow_back
                </span>
                <div className="text-left hidden sm:block">
                  <div className="text-xs text-muted-foreground">Bài trước</div>
                  <div className="text-sm font-bold truncate max-w-[180px]">
                    {prevLesson.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link
                href={`/course/${courseId}/lesson/${nextLesson.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-secondary/80 text-white rounded-xl transition-all font-medium text-sm group shadow-lg shadow-secondary/20"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-white/70">Bài tiếp theo</div>
                  <div className="text-sm font-bold truncate max-w-[180px]">
                    {nextLesson.title}
                  </div>
                </div>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            ) : (
              <Link
                href={`/course/${courseId}`}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-green-600/20"
              >
                <span className="material-symbols-outlined filled">
                  check_circle
                </span>
                Hoàn thành khóa học
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
              Nội dung khóa học
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
              />
            ))}
            {sortedLessons.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Chưa có bài học nào
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
                  Nội dung khóa học
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
