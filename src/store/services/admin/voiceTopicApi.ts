import { baseApi } from "../baseApi";

// ── Types ──

export interface VoiceTopic {
  id: number;
  title: string;
  titleJp?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  sortOrder: number;
  createdBy?: number;
  scenarioCount?: number;
  scenarios?: VoiceScenario[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceTopicRequest {
  title: string;
  titleJp?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface VoiceScenario {
  id: number;
  topicId: number;
  title: string;
  level: string;
  situation: string;
  aiRole?: string;
  aiPersonality?: string;
  openingLine?: string;
  sampleConversation?: string;
  keyVocabulary?: string;
  keyGrammar?: string;
  expectedTurns: number;
  difficultyNotes?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceScenarioRequest {
  title: string;
  level: string;
  situation: string;
  aiRole?: string;
  aiPersonality?: string;
  openingLine?: string;
  sampleConversation?: string;
  keyVocabulary?: string;
  keyGrammar?: string;
  expectedTurns?: number;
  difficultyNotes?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── API ──

export const adminVoiceTopicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Topics ──
    getAdminVoiceTopics: builder.query<PageResponse<VoiceTopic>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 20 }) => `/admin/voice-topics?page=${page}&size=${size}`,
      providesTags: ["VoiceTopic"],
    }),

    getAdminVoiceTopic: builder.query<VoiceTopic, number>({
      query: (id) => `/admin/voice-topics/${id}`,
      providesTags: (_r, _e, id) => [{ type: "VoiceTopic" as const, id }],
    }),

    createVoiceTopic: builder.mutation<VoiceTopic, VoiceTopicRequest>({
      query: (data) => ({ url: "/admin/voice-topics", method: "POST", body: data }),
      invalidatesTags: ["VoiceTopic"],
    }),

    updateVoiceTopic: builder.mutation<VoiceTopic, { id: number; data: VoiceTopicRequest }>({
      query: ({ id, data }) => ({ url: `/admin/voice-topics/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["VoiceTopic"],
    }),

    deleteVoiceTopic: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/admin/voice-topics/${id}`, method: "DELETE" }),
      invalidatesTags: ["VoiceTopic"],
    }),

    // ── Scenarios ──
    getScenarios: builder.query<VoiceScenario[], number>({
      query: (topicId) => `/admin/voice-topics/${topicId}/scenarios`,
      providesTags: (_r, _e, topicId) => [{ type: "VoiceTopic" as const, id: topicId }],
    }),

    createScenario: builder.mutation<VoiceScenario, { topicId: number; data: VoiceScenarioRequest }>({
      query: ({ topicId, data }) => ({
        url: `/admin/voice-topics/${topicId}/scenarios`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_r, _e, { topicId }) => [{ type: "VoiceTopic" as const, id: topicId }, "VoiceTopic"],
    }),

    updateScenario: builder.mutation<VoiceScenario, { topicId: number; scenarioId: number; data: VoiceScenarioRequest }>({
      query: ({ topicId, scenarioId, data }) => ({
        url: `/admin/voice-topics/${topicId}/scenarios/${scenarioId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { topicId }) => [{ type: "VoiceTopic" as const, id: topicId }],
    }),

    deleteScenario: builder.mutation<{ success: boolean }, { topicId: number; scenarioId: number }>({
      query: ({ topicId, scenarioId }) => ({
        url: `/admin/voice-topics/${topicId}/scenarios/${scenarioId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { topicId }) => [{ type: "VoiceTopic" as const, id: topicId }, "VoiceTopic"],
    }),

    // ── AI Generate (AI-FUJI) ──
    generateScenarioAI: builder.mutation<VoiceScenarioRequest, {
      topicTitle: string;
      title: string;
      situation: string;
      aiRole: string;
      aiPersonality: string;
      level: string;
      expectedTurns: number;
    }>({
      queryFn: async (args) => {
        try {
          const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:3005";
          const res = await fetch(`${aiUrl}/api/ai/generate-scenario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { error: { status: res.status, data: err.message || "AI generate failed" } };
          }
          const data = await res.json();
          return { data };
        } catch (e: any) {
          return { error: { status: 500, data: e.message } };
        }
      },
    }),
  }),
});

export const {
  useGetAdminVoiceTopicsQuery,
  useGetAdminVoiceTopicQuery,
  useCreateVoiceTopicMutation,
  useUpdateVoiceTopicMutation,
  useDeleteVoiceTopicMutation,
  useGetScenariosQuery,
  useCreateScenarioMutation,
  useUpdateScenarioMutation,
  useDeleteScenarioMutation,
  useGenerateScenarioAIMutation,
} = adminVoiceTopicApi;
