// ─── Course Types (aligned with backend DTOs) ─────────

export interface UserSummaryDTO {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
}
export interface InstructorDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}
export interface CourseResponseDTO {
  id: number;
  title: string;
  description: string;
  instructor: UserSummaryDTO;
  author: UserSummaryDTO;
  thumbnailUrl: string | null;
  price: number;
  studentCount: number;
  lessonCount: number;
  totalDuration: number;
  averageRating: number;
  ratingCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRequestDTO {
  title: string;
  description: string;
  instructorId: number;
  price: number;
  isPublished?: boolean;
}

export interface CourseUpdateDTO {
  title?: string;
  description?: string;
  instructorId?: number;
  price?: number;
  isPublished?: boolean;
}

export interface RatingRequestDTO {
  rating: number;
}

export interface RatingResponseDTO {
  id: number;
  courseId: number;
  rating: number;
  review: string | null;
  user: UserSummaryDTO;
  createdAt: string;
  updatedAt: string;
}

// ─── Lesson Types ──────────────────────────────────────

export type LessonType = "video" | "task";
export type VideoType = "youtube" | "upload";
export type TaskType =
  | "multiple_choice"
  | "fill_blank"
  | "listening"
  | "matching"
  | "speaking"
  | "reading";

export interface LessonResponseDTO {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  lessonOrder: number;
  lessonType: LessonType;
  videoUrl: string | null;
  videoType: VideoType | null;
  duration: number;
  taskType: TaskType | null;
  taskData: string | null;
  content: string | null;
  completionCount: number;
  userCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonRequestDTO {
  courseId: number;
  title: string;
  lessonType: LessonType;
  videoUrl?: string;
  videoType?: VideoType;
  duration?: number;
  taskType?: TaskType;
  taskData?: string;
  content?: string;
  lessonOrder?: number;
}

export interface LessonUpdateDTO {
  title?: string;
  lessonType?: LessonType;
  videoUrl?: string;
  videoType?: VideoType;
  duration?: number;
  taskType?: TaskType;
  taskData?: string;
  content?: string;
  lessonOrder?: number;
}

// ─── API Response ──────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ─── Query Params ──────────────────────────────────────

export interface CourseListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

// ─── Legacy (keep for user-facing pages) ───────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  levelLabel: string;
  thumbnail: string;
  progress: number;
  isEnrolled: boolean;
  featured?: boolean;
}

export const FEATURED_COURSES: Course[] = [
  {
    id: "1",
    title: "Tiếng Nhật N5 Tổng Quát",
    description:
      "Nắm vững bảng chữ cái Hiragana, Katakana và các mẫu câu giao tiếp cơ bản.",
    level: "N5",
    levelLabel: "N5 - Sơ cấp",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE",
    progress: 35,
    isEnrolled: true,
  },
  {
    id: "2",
    title: "Luyện thi JLPT N4",
    description:
      "Ôn tập ngữ pháp, từ vựng và Kanji cho kỳ thi năng lực tiếng Nhật N4.",
    level: "N4",
    levelLabel: "N4 - Sơ trung cấp",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04",
    progress: 12,
    isEnrolled: true,
  },
];
