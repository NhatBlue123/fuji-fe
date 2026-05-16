import { baseApi } from "./baseApi";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LessonRoomResponse {
  lessonId: number;
  bookingId: number;
  roomUrl: string;
  roomName: string;
  token: string;
  status: string;
  teacherName: string;
  studentName: string;
  subject: string | null;
  remainingSeconds: number;
}

export interface LessonTokenResponse {
  token: string;
  roomUrl: string;
  roomName: string;
}

export interface ChatMessageResponse {
  id: number;
  lessonId: number;
  senderId: number;
  senderName: string;
  senderRole: "TEACHER" | "STUDENT";
  type: "TEXT" | "FILE" | "VOCABULARY" | "SYSTEM";
  content: string;
  fileUrl: string | null;
  reactions: string;
  seenBy: string;
  createdAt: string;
}

export interface NoteResponse {
  id: number | null;
  lessonId: number;
  userId: number;
  content: string;
  updatedAt: string | null;
  createdAt: string | null;
}

export interface MaterialResponse {
  id: number;
  lessonId: number;
  name: string;
  url: string;
  type: string | null;
  size: number | null;
  uploadedBy: number;
  createdAt: string;
}

/** Quiz type enum - defines the category of quiz */
export type QuizType = "VOCAB" | "LISTENING" | "READING";

/** Question type enum - defines the format of individual questions */
export type QuestionType = "MULTIPLE_CHOICE" | "FILL_BLANK" | "MATCHING" | "ORDERING";

export interface QuizQuestionItem {
  type: QuestionType;
  questionText: string;
  optionsJson?: string;
  correctAnswer: string;
  explanation?: string;
  orderIndex?: number;
  /** Audio URL for LISTENING type */
  mediaContent?: string;
  /** Passage text for READING type (usually on first question of a passage group) */
  passageText?: string;
  /** Groups questions sharing the same passage (READING type) */
  groupKey?: string;
}

export interface QuizResponse {
  id: number;
  lessonId: number;
  title: string;
  quizType: QuizType;
  createdByUserId: number;
  createdAt: string;
  questionCount: number;
  questions?: {
    id: number;
    questionType: QuestionType;
    questionText: string;
    optionsJson?: string | null;
    correctAnswer?: string;
    explanation?: string | null;
    orderIndex: number;
    mediaContent?: string | null;
    passageText?: string | null;
    groupKey?: string | null;
  }[];
}

export interface SubmissionResponse {
  questionId: number;
  correct: boolean;
  scorePoints: number;
}

export interface QuizSubmissionResultDto {
  userId: number;
  userName: string;
  questionId: number;
  userAnswer?: string;
  correctAnswer?: string;
  correct: boolean;
  scorePoints: number;
}

export interface QuizResultResponse {
  quizId: number;
  totalQuestions: number;
  scoresByUser: Record<string, number>;
  submissions: QuizSubmissionResultDto[];
}

export interface LessonSummaryResponse {
  id: number;
  lessonId: number;
  teacherNote: string | null;
  homework: string | null;
  quizScore: number | null;
  vocabularyList: string[];
  sentAt: string | null;
  createdAt: string | null;
}

function normalizeWhiteboardSnapshot(raw: unknown): unknown[] {
  if (raw == null) return [];

  let payload = raw;
  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(payload)) return payload;
  return [payload];
}

export const lessonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLessonRoom: builder.mutation<LessonRoomResponse, { bookingId: number }>({
      query: (body) => ({
        url: "/lessons/rooms/create",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<LessonRoomResponse>) => res.data,
    }),

    getLessonToken: builder.query<LessonTokenResponse, { lessonId: number }>({
      query: ({ lessonId }) => `/lessons/${lessonId}/token`,
      transformResponse: (res: ApiEnvelope<LessonTokenResponse>) => res.data,
    }),

    endLesson: builder.mutation<void, { lessonId: number }>({
      query: ({ lessonId }) => ({
        url: `/lessons/${lessonId}/end`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Booking", id: "MY_BOOKINGS" }],
    }),

    markLessonActive: builder.mutation<void, { lessonId: number }>({
      query: ({ lessonId }) => ({
        url: `/lessons/${lessonId}/active`,
        method: "POST",
      }),
    }),

    markLessonPresence: builder.mutation<void, { lessonId: number; present: boolean }>({
      query: ({ lessonId, present }) => ({
        url: `/lessons/${lessonId}/presence/${present ? "join" : "leave"}`,
        method: "POST",
      }),
    }),

    getLessonByBooking: builder.query<LessonRoomResponse | null, { bookingId: number }>({
      query: ({ bookingId }) => `/lessons/by-booking/${bookingId}`,
      transformResponse: (res: ApiEnvelope<LessonRoomResponse | null>) => res.data,
    }),

    getChatHistory: builder.query<ChatMessageResponse[], { lessonId: number; limit?: number }>({
      query: ({ lessonId, limit = 100 }) =>
        `/lessons/${lessonId}/chat/history?limit=${limit}`,
      transformResponse: (res: ApiEnvelope<ChatMessageResponse[]>) => res.data,
    }),

    sendChatMessage: builder.mutation<
      ChatMessageResponse,
      { lessonId: number; content: string; type?: string; fileUrl?: string | null; senderName?: string }
    >({
      query: ({ lessonId, content, type = "TEXT", fileUrl, senderName }) => ({
        url: `/lessons/${lessonId}/chat/send`,
        method: "POST",
        body: { content, type, fileUrl: fileUrl ?? null, senderName },
      }),
      transformResponse: (res: ApiEnvelope<ChatMessageResponse>) => res.data,
    }),

    getMyNote: builder.query<NoteResponse, { lessonId: number }>({
      query: ({ lessonId }) => `/lessons/${lessonId}/notes/me`,
      transformResponse: (res: ApiEnvelope<NoteResponse>) => res.data,
      providesTags: (_result, _error, { lessonId }) => [
        { type: "LessonNote" as const, id: lessonId },
      ],
    }),

    saveMyNote: builder.mutation<NoteResponse, { lessonId: number; content: string }>({
      query: ({ lessonId, content }) => ({
        url: `/lessons/${lessonId}/notes/me`,
        method: "PUT",
        body: { content },
      }),
      transformResponse: (res: ApiEnvelope<NoteResponse>) => res.data,
    }),

    getMaterials: builder.query<MaterialResponse[], { lessonId: number }>({
      query: ({ lessonId }) => `/lessons/${lessonId}/materials`,
      transformResponse: (res: ApiEnvelope<MaterialResponse[]>) => res.data,
    }),

    saveMaterial: builder.mutation<
      MaterialResponse,
      { lessonId: number; name: string; url: string; type?: string; size?: number }
    >({
      query: ({ lessonId, ...body }) => ({
        url: `/lessons/${lessonId}/materials`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<MaterialResponse>) => res.data,
    }),

    deleteMaterial: builder.mutation<void, { lessonId: number; materialId: number }>({
      query: ({ lessonId, materialId }) => ({
        url: `/lessons/${lessonId}/materials/${materialId}`,
        method: "DELETE",
      }),
    }),

    createQuiz: builder.mutation<
      QuizResponse,
      { lessonId: number; title: string; quizType: QuizType; mediaContent?: string; passageText?: string; questions: QuizQuestionItem[] }
    >({
      query: ({ lessonId, ...body }) => ({
        url: `/lessons/${lessonId}/quizzes`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<QuizResponse>) => res.data,
    }),

    listQuizzes: builder.query<QuizResponse[], { lessonId: number }>({
      query: ({ lessonId }) => `/lessons/${lessonId}/quizzes`,
      transformResponse: (res: ApiEnvelope<QuizResponse[]>) => res.data,
    }),

    submitQuizAnswer: builder.mutation<
      SubmissionResponse,
      { lessonId: number; quizId: number; questionId: number; answer: string }
    >({
      query: ({ lessonId, quizId, questionId, answer }) => ({
        url: `/lessons/${lessonId}/quizzes/${quizId}/submit`,
        method: "POST",
        body: { questionId, answer },
      }),
      transformResponse: (res: ApiEnvelope<SubmissionResponse>) => res.data,
    }),

    getQuizResults: builder.query<QuizResultResponse, { lessonId: number; quizId: number }>({
      query: ({ lessonId, quizId }) => `/lessons/${lessonId}/quizzes/${quizId}/results`,
      transformResponse: (res: ApiEnvelope<QuizResultResponse>) => res.data,
    }),

    createLessonSummary: builder.mutation<
      LessonSummaryResponse,
      { lessonId: number; teacherNote?: string; homework?: string; quizScore?: number; vocabularyList?: string[] }
    >({
      query: ({ lessonId, ...body }) => ({
        url: `/lessons/${lessonId}/summary`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<LessonSummaryResponse>) => res.data,
    }),

    getLessonSummary: builder.query<LessonSummaryResponse | null, { lessonId: number }>({
      query: ({ lessonId }) => `/lessons/${lessonId}/summary`,
      transformResponse: (res: ApiEnvelope<LessonSummaryResponse | null>) => res.data,
    }),

    getWhiteboardSnapshot: builder.query<unknown[], { lessonId: number }>({
      query: ({ lessonId }) => `/lessons/${lessonId}/whiteboard/snapshot`,
      transformResponse: (res: ApiEnvelope<unknown>) =>
        normalizeWhiteboardSnapshot(res.data),
    }),

    // ==================== MEDIA ====================

    uploadAudio: builder.mutation<{ url: string; publicId: string }, FormData>({
      query: (formData) => ({
        url: "/media/upload/audio",
        method: "POST",
        body: formData,
      }),
      transformResponse: (res: ApiEnvelope<{ url: string; publicId: string }>) => res.data,
    }),
  }),
});

export const {
  useCreateLessonRoomMutation,
  useGetLessonTokenQuery,
  useEndLessonMutation,
  useMarkLessonActiveMutation,
  useMarkLessonPresenceMutation,
  useGetLessonByBookingQuery,
  useGetChatHistoryQuery,
  useSendChatMessageMutation,
  useGetMyNoteQuery,
  useSaveMyNoteMutation,
  useGetMaterialsQuery,
  useSaveMaterialMutation,
  useDeleteMaterialMutation,
  useCreateQuizMutation,
  useListQuizzesQuery,
  useSubmitQuizAnswerMutation,
  useGetQuizResultsQuery,
  useCreateLessonSummaryMutation,
  useGetLessonSummaryQuery,
  useGetWhiteboardSnapshotQuery,
  useUploadAudioMutation,
} = lessonApi;
