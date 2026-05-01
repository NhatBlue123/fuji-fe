import { baseApi } from "./baseApi";

// ============================================
// NEW SIMPLE STREAK SYSTEM
// ============================================
export interface UserStreakResponse {
  userId: number;
  streakCount: number;
  lastLoginDate: string | null;
  loggedInToday: boolean;
}

// ============================================
// DEPRECATED - Will be removed
// ============================================
export interface DailyStatsResponse {
  id: number;
  userId: number;
  date: string;
  totalStudyTime: number;
  lessonsCompleted: number;
  cardsReviewed: number;
  cardsLearned: number;
  correctRate: number;
  streakDays: number;
}

export interface WeeklyProgressSummary {
  totalStudyMinutes: number;
  totalCardsReviewed: number;
  totalLessonsCompleted: number;
  averageCorrectRate: number;
  daysStudied: number;
  progressComparedToLastWeek: number;
  encouragingMessage: string;
}

export interface LearningInsightResponse {
  id: number;
  userId: number;
  analysisDate: string;
  overallLevel: string;
  weeklyProgress: number;
  consistencyScore: number;
  retentionRate: number;
  listeningLevel: number;
  speakingLevel: number;
  readingLevel: number;
  writingLevel: number;
  bestStudyTime: string;
  avgSessionLength: number;
  studyFrequency: number;
  aiMessage: string;
  aiTone: string;
  aiGeneratedAt: string;
  confidenceScore: number;
  dataPointsAnalyzed: number;
}

export interface UserProgressOverviewResponse {
  streak: UserStreakResponse;
  weeklyStats: DailyStatsResponse[];
  latestInsight: LearningInsightResponse | null;
  weeklySummary: WeeklyProgressSummary;
}

export interface RecordActivityRequest {
  activityType: string;
  durationMinutes?: number;
  cardsReviewed?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  source?: string;
}

export interface StreakProgressResponse {
  qualified: boolean;
  progressPercent: number;
  remainingMinutes: number;
  remainingCards: number;
  message: string;
  almostQualified: boolean;
  justQualified: boolean;
  studiedToday: boolean;
  currentStreak: number;
}

export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // ACTIVE ENDPOINTS
    // ============================================
    getStreak: builder.query<UserStreakResponse, void>({
      query: () => "/progress/streak",
      providesTags: ["Streak"],
    }),

    // ============================================
    // DEPRECATED ENDPOINTS - Will be removed
    // ============================================
    getProgressOverview: builder.query<UserProgressOverviewResponse, void>({
      query: () => "/progress/overview",
      providesTags: ["Progress"],
    }),

    getStreakProgress: builder.query<StreakProgressResponse, void>({
      query: () => "/streak/progress",
      providesTags: ["StreakProgress"],
    }),

    getWeeklyStats: builder.query<DailyStatsResponse[], void>({
      query: () => "/progress/weekly-stats",
      providesTags: ["WeeklyStats"],
    }),

    getWeeklySummary: builder.query<WeeklyProgressSummary, void>({
      query: () => "/progress/weekly-summary",
      providesTags: ["WeeklySummary"],
    }),

    getTodayStats: builder.query<DailyStatsResponse | null, void>({
      query: () => "/progress/today",
      providesTags: ["TodayStats"],
    }),

    getLatestInsight: builder.query<LearningInsightResponse | null, void>({
      query: () => "/progress/insight",
      providesTags: ["Insight"],
    }),

    generateInsight: builder.mutation<LearningInsightResponse, void>({
      query: () => ({
        url: "/progress/insight/generate",
        method: "POST",
      }),
      invalidatesTags: ["Insight"],
    }),

    recordActivity: builder.mutation<UserStreakResponse, RecordActivityRequest>({
      query: (body) => ({
        url: "/progress/activity",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedStreak } = await queryFulfilled;
          dispatch(
            progressApi.util.updateQueryData("getStreak", undefined, () => {
              return updatedStreak;
            })
          );
          dispatch(
            progressApi.util.updateQueryData("getProgressOverview", undefined, (draft) => {
              if (draft) {
                draft.streak = updatedStreak;
              }
              return draft;
            })
          );
        } catch (error) {
          console.error("Failed to update streak cache:", error);
        }
      },
      invalidatesTags: ["Streak", "StreakProgress", "WeeklyStats", "TodayStats"],
    }),
  }),
});

export const {
  useGetProgressOverviewQuery,
  useGetStreakQuery,
  useGetStreakProgressQuery,
  useGetWeeklyStatsQuery,
  useGetWeeklySummaryQuery,
  useGetTodayStatsQuery,
  useGetLatestInsightQuery,
  useGenerateInsightMutation,
  useRecordActivityMutation,
} = progressApi;
