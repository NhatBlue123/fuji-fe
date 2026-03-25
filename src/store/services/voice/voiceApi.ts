import { aiBaseApi } from "../aiBaseApi";
import { baseApi } from "../baseApi";
import type {
  VoiceChatRequest,
  VoiceChatResponse,
  VoiceSessionHistory,
} from "@/types/voice";

export const voiceApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/voice/chat → 202 { success, jobId }
     * Kết quả thực sẽ nhận qua Socket event `voice:job:completed`.
     */
    voiceChat: builder.mutation<
      { success: boolean; jobId: string },
      VoiceChatRequest
    >({
      query: (data) => ({
        url: "/api/voice/chat",
        method: "POST",
        body: data,
      }),
    }),

    endVoiceSession: builder.mutation<
      { success: boolean; session: string },
      string
    >({
      query: (sessionCode) => ({
        url: `/api/voice/session/${sessionCode}/end`,
        method: "POST",
      }),
    }),

    getVoiceSessions: builder.query<VoiceSessionHistory[], void>({
      query: () => "/api/voice/sessions",
    }),

    getVoiceSessionDetail: builder.query<VoiceSessionHistory, string>({
      query: (sessionCode) => `/api/voice/sessions/${sessionCode}`,
    }),

    startVoiceSession: builder.mutation<
      { success: boolean },
      { openingLine: string; preferredVoice?: string; session?: string | null }
    >({
      query: (data) => ({
        url: "/api/voice/start-session",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const userVoiceTopicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublishedTopics: builder.query<any[], void>({
      query: () => "/voice/topics",
    }),
  }),
});

export const {
  useVoiceChatMutation,
  useEndVoiceSessionMutation,
  useGetVoiceSessionsQuery,
  useGetVoiceSessionDetailQuery,
  useStartVoiceSessionMutation,
} = voiceApi;

export const { useGetPublishedTopicsQuery } = userVoiceTopicApi;
