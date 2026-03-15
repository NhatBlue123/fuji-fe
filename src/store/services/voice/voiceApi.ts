import { baseApi } from "../baseApi";
import { API_ENDPOINTS } from "@/config/api";
import type {
  VoiceChatRequest,
  VoiceChatResponse,
  VoiceSessionHistory,
} from "@/types/voice";

export const voiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    voiceChat: builder.mutation<VoiceChatResponse, VoiceChatRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.VOICE.CHAT,
        method: "POST",
        body: data,
      }),
    }),

    endVoiceSession: builder.mutation<
      { success: boolean; session: string },
      string
    >({
      query: (sessionCode) => ({
        url: API_ENDPOINTS.VOICE.END_SESSION(sessionCode),
        method: "POST",
      }),
    }),

    getVoiceSessions: builder.query<VoiceSessionHistory[], void>({
      query: () => API_ENDPOINTS.VOICE.LIST_SESSIONS,
    }),

    getVoiceSessionDetail: builder.query<VoiceSessionHistory, string>({
      query: (sessionCode) => API_ENDPOINTS.VOICE.GET_SESSION(sessionCode),
    }),
  }),
});

export const {
  useVoiceChatMutation,
  useEndVoiceSessionMutation,
  useGetVoiceSessionsQuery,
  useGetVoiceSessionDetailQuery,
} = voiceApi;
