import { aiBaseApi } from "./aiBaseApi";

export interface AiConversation {
  id: number;
  userId: number;
  title: string | null;
  conversationType: string;
  contextData: unknown;
  messageCount: number;
  isArchived: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  tokensUsed: number | null;
  modelVersion: string | null;
  createdAt: string;
}

interface ListConversationsResponse {
  ok: boolean;
  conversations?: AiConversation[];
}

interface CreateConversationResponse {
  ok: boolean;
  conversation?: AiConversation | null;
}

interface ListMessagesResponse {
  ok: boolean;
  messages?: AiMessage[];
  pagination?: {
    limit?: number;
    beforeId?: number | null;
    hasMore?: boolean;
    nextBeforeId?: number | null;
  };
}

interface CreateMessageResponse {
  ok: boolean;
  message?: AiMessage | null;
}

export interface AiMessagesPage {
  messages: AiMessage[];
  hasMore: boolean;
  nextBeforeId: number | null;
}

export const aiChatHistoryApi = aiBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAiConversations: builder.query<
      AiConversation[],
      { includeArchived?: boolean; limit?: number } | void
    >({
      query: (params) => {
        const includeArchived = params?.includeArchived ? 1 : 0;
        const limit = params?.limit ?? 50;
        return `/ai/conversations?includeArchived=${includeArchived}&limit=${limit}`;
      },
      transformResponse: (response: ListConversationsResponse) =>
        Array.isArray(response?.conversations) ? response.conversations : [],
    }),

    createAiConversation: builder.mutation<
      AiConversation | null,
      {
        title?: string;
        conversationType?: string;
        contextData?: unknown;
      } | void
    >({
      query: (body) => ({
        url: "/ai/conversations",
        method: "POST",
        body: body ?? {},
      }),
      transformResponse: (response: CreateConversationResponse) =>
        response?.conversation ?? null,
    }),

    deleteAiConversation: builder.mutation<{ ok: boolean }, number>({
      query: (conversationId) => ({
        url: `/ai/conversations/${conversationId}`,
        method: "DELETE",
      }),
    }),

    getAiMessages: builder.query<
      AiMessagesPage,
      { conversationId: number; limit?: number; beforeId?: number | null }
    >({
      query: ({ conversationId, limit = 20, beforeId }) => {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        if (beforeId != null) {
          params.set("beforeId", String(beforeId));
        }
        return `/ai/conversations/${conversationId}/messages?${params.toString()}`;
      },
      transformResponse: (response: ListMessagesResponse) => {
        const list = Array.isArray(response?.messages) ? response.messages : [];
        const limit = Number(response?.pagination?.limit) || 20;
        const hasMore =
          typeof response?.pagination?.hasMore === "boolean"
            ? response.pagination.hasMore
            : list.length >= limit;
        const fallbackCursor =
          list.length > 0 ? Number(list[list.length - 1].id) : null;
        return {
          messages: [...list].reverse(),
          hasMore,
          nextBeforeId:
            typeof response?.pagination?.nextBeforeId === "number"
              ? response.pagination.nextBeforeId
              : fallbackCursor,
        };
      },
    }),

    createAiMessage: builder.mutation<
      AiMessage | null,
      {
        conversationId: number;
        role: "user" | "assistant";
        content: string;
        tokensUsed?: number;
        modelVersion?: string;
      }
    >({
      query: ({ conversationId, ...payload }) => ({
        url: `/ai/conversations/${conversationId}/messages`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: CreateMessageResponse) =>
        response?.message ?? null,
    }),
  }),
});

export const {
  useGetAiConversationsQuery,
  useCreateAiConversationMutation,
  useDeleteAiConversationMutation,
  useGetAiMessagesQuery,
  useLazyGetAiMessagesQuery,
  useCreateAiMessageMutation,
} = aiChatHistoryApi;
