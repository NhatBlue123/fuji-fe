// RTK Query API cho FlashCard và FlashList
import { createApi } from "@reduxjs/toolkit/query/react";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { getAccessToken, setAccessToken } from "@/lib/token";
import type {
  FlashCardResponseDTO,
  FlashListResponseDTO,
  FlashListPageDTO,
  FlashCardSearchResult,
  FlashListSearchResult,
  FlashCardListParams,
  FlashListListParams,
  SearchParams,
  PaginationDTO,
  RatingRequestDTO,
  CardDTO,
} from "@/types/flashcard";

// ─── Response wrapper ──────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

// ─── Base query with auth ──────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (isRefreshing && refreshPromise) {
      const success = await refreshPromise;
      if (success) {
        result = await baseQuery(args, api, extraOptions);
      }
    } else {
      isRefreshing = true;
      refreshPromise = (async (): Promise<boolean> => {
        try {
          const refreshResult = await baseQuery(
            { url: "/auth/refresh", method: "POST" },
            api,
            extraOptions,
          );
          const apiResp = refreshResult.data as
            | { success?: boolean; data?: { accessToken: string } }
            | undefined;
          if (apiResp?.data?.accessToken) {
            setAccessToken(apiResp.data.accessToken);
            return true;
          }
          return false;
        } catch {
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
      const success = await refreshPromise;
      if (success) {
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

// ─── Helper: build query string ────────────────────────

function toQueryString(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
      );
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ─── API Definition ────────────────────────────────────

export const flashcardApi = createApi({
  reducerPath: "flashcardApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["FlashCard", "FlashList"],
  endpoints: (builder) => ({
    // ═══════════════════ FlashCard endpoints ═══════════════════

    // List all accessible flashcards (public + own)
    getFlashCards: builder.query<
      { flashCards: FlashCardResponseDTO[]; pagination: PaginationDTO },
      FlashCardListParams | void
    >({
      query: (params) => {
        const qs = toQueryString((params || {}) as Record<string, unknown>);
        return `${API_ENDPOINTS.FLASHCARDS.LIST}${qs}`;
      },
      transformResponse: (
        response: ApiResponse<{
          flashCards: FlashCardResponseDTO[];
          pagination: PaginationDTO;
        }>,
      ) => {
        return (
          response.data || { flashCards: [], pagination: {} as PaginationDTO }
        );
      },
      providesTags: (result) =>
        result
          ? [
              ...result.flashCards.map((fc) => ({
                type: "FlashCard" as const,
                id: fc.id,
              })),
              { type: "FlashCard", id: "LIST" },
            ]
          : [{ type: "FlashCard", id: "LIST" }],
    }),

    // Get single flashcard by ID
    getFlashCardById: builder.query<FlashCardResponseDTO, number | string>({
      query: (id) => API_ENDPOINTS.FLASHCARDS.GET_BY_ID(id),
      transformResponse: (response: ApiResponse<FlashCardResponseDTO>) =>
        response.data!,
      providesTags: (_result, _err, id) => [{ type: "FlashCard", id }],
    }),

    // Create flashcard (multipart: flashcard JSON + optional thumbnail file)
    createFlashCard: builder.mutation<
      FlashCardResponseDTO,
      {
        flashcard: {
          name: string;
          description?: string;
          level?: string;
          isPublic?: boolean;
          cards: CardDTO[];
        };
        thumbnail?: File;
      }
    >({
      query: ({ flashcard, thumbnail }) => {
        const formData = new FormData();
        formData.append(
          "flashcard",
          new Blob([JSON.stringify(flashcard)], { type: "application/json" }),
        );
        if (thumbnail) {
          formData.append("thumbnail", thumbnail);
        }
        return {
          url: API_ENDPOINTS.FLASHCARDS.CREATE,
          method: "POST",
          body: formData,
          // Let browser set Content-Type with boundary for multipart
          formData: true,
        };
      },
      transformResponse: (response: ApiResponse<FlashCardResponseDTO>) =>
        response.data!,
      invalidatesTags: [{ type: "FlashCard", id: "LIST" }],
    }),

    // Update flashcard
    updateFlashCard: builder.mutation<
      FlashCardResponseDTO,
      {
        id: number | string;
        flashcard: Record<string, unknown>;
        thumbnail?: File;
      }
    >({
      query: ({ id, flashcard, thumbnail }) => {
        const formData = new FormData();
        formData.append(
          "flashcard",
          new Blob([JSON.stringify(flashcard)], { type: "application/json" }),
        );
        if (thumbnail) {
          formData.append("thumbnail", thumbnail);
        }
        return {
          url: API_ENDPOINTS.FLASHCARDS.UPDATE(id),
          method: "PUT",
          body: formData,
          formData: true,
        };
      },
      transformResponse: (response: ApiResponse<FlashCardResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _err, { id }) => [
        { type: "FlashCard", id },
        { type: "FlashCard", id: "LIST" },
      ],
    }),

    // Delete flashcard (soft delete)
    deleteFlashCard: builder.mutation<void, number | string>({
      query: (id) => ({
        url: API_ENDPOINTS.FLASHCARDS.DELETE(id),
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "FlashCard", id: "LIST" }],
    }),

    // Add a card to a flashcard set
    addCardToFlashCard: builder.mutation<
      FlashCardResponseDTO,
      { flashCardId: number | string; card: CardDTO }
    >({
      query: ({ flashCardId, card }) => ({
        url: API_ENDPOINTS.FLASHCARDS.ADD_CARD(flashCardId),
        method: "POST",
        body: card,
      }),
      transformResponse: (response: ApiResponse<FlashCardResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _err, { flashCardId }) => [
        { type: "FlashCard", id: flashCardId },
      ],
    }),

    // Search flashcards
    searchFlashCards: builder.query<FlashCardSearchResult, SearchParams>({
      query: (params) => {
        const qs = toQueryString(params as Record<string, unknown>);
        return `${API_ENDPOINTS.FLASHCARDS.SEARCH}${qs}`;
      },
      transformResponse: (response: ApiResponse<FlashCardSearchResult>) =>
        response.data || { results: [], pagination: {} as PaginationDTO },
      providesTags: [{ type: "FlashCard", id: "SEARCH" }],
    }),

    // ═══════════════════ FlashList endpoints ═══════════════════

    // List all flashlists (returns publicLists + myLists)
    getFlashLists: builder.query<FlashListPageDTO, FlashListListParams | void>({
      query: (params) => {
        const qs = toQueryString((params || {}) as Record<string, unknown>);
        return `${API_ENDPOINTS.FLASHLISTS.LIST}${qs}`;
      },
      transformResponse: (response: ApiResponse<FlashListPageDTO>) =>
        response.data || {
          publicLists: [],
          myLists: [],
          pagination: {} as PaginationDTO,
        },
      providesTags: (result) =>
        result
          ? [
              ...[...result.publicLists, ...result.myLists].map((fl) => ({
                type: "FlashList" as const,
                id: fl.id,
              })),
              { type: "FlashList", id: "LIST" },
            ]
          : [{ type: "FlashList", id: "LIST" }],
    }),

    // Get single flashlist by ID
    getFlashListById: builder.query<FlashListResponseDTO, number | string>({
      query: (id) => API_ENDPOINTS.FLASHLISTS.GET_BY_ID(id),
      transformResponse: (response: ApiResponse<FlashListResponseDTO>) =>
        response.data!,
      providesTags: (_result, _err, id) => [{ type: "FlashList", id }],
    }),

    // Create flashlist (multipart: flashlist JSON + optional thumbnail)
    createFlashList: builder.mutation<
      FlashListResponseDTO,
      {
        flashlist: {
          title: string;
          description?: string;
          level?: string;
          isPublic?: boolean;
          flashcardIds?: number[];
        };
        thumbnail?: File;
      }
    >({
      query: ({ flashlist, thumbnail }) => {
        const formData = new FormData();
        formData.append(
          "flashlist",
          new Blob([JSON.stringify(flashlist)], { type: "application/json" }),
        );
        if (thumbnail) {
          formData.append("thumbnail", thumbnail);
        }
        return {
          url: API_ENDPOINTS.FLASHLISTS.CREATE,
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      transformResponse: (response: ApiResponse<FlashListResponseDTO>) =>
        response.data!,
      invalidatesTags: [{ type: "FlashList", id: "LIST" }],
    }),

    // Update flashlist
    updateFlashList: builder.mutation<
      FlashListResponseDTO,
      {
        id: number | string;
        flashlist: Record<string, unknown>;
        thumbnail?: File;
      }
    >({
      query: ({ id, flashlist, thumbnail }) => {
        const formData = new FormData();
        formData.append(
          "flashlist",
          new Blob([JSON.stringify(flashlist)], { type: "application/json" }),
        );
        if (thumbnail) {
          formData.append("thumbnail", thumbnail);
        }
        return {
          url: API_ENDPOINTS.FLASHLISTS.UPDATE(id),
          method: "PUT",
          body: formData,
          formData: true,
        };
      },
      transformResponse: (response: ApiResponse<FlashListResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _err, { id }) => [
        { type: "FlashList", id },
        { type: "FlashList", id: "LIST" },
      ],
    }),

    // Delete flashlist (soft delete)
    deleteFlashList: builder.mutation<void, number | string>({
      query: (id) => ({
        url: API_ENDPOINTS.FLASHLISTS.DELETE(id),
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "FlashList", id: "LIST" }],
    }),

    // Rate a flashlist
    rateFlashList: builder.mutation<
      FlashListResponseDTO,
      { listId: number | string; rating: RatingRequestDTO }
    >({
      query: ({ listId, rating }) => ({
        url: API_ENDPOINTS.FLASHLISTS.RATE(listId),
        method: "POST",
        body: rating,
      }),
      transformResponse: (response: ApiResponse<FlashListResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _err, { listId }) => [
        { type: "FlashList", id: listId },
      ],
    }),

    // Add flashcard to flashlist
    addFlashCardToList: builder.mutation<
      FlashListResponseDTO,
      { listId: number | string; cardId: number | string }
    >({
      query: ({ listId, cardId }) => ({
        url: API_ENDPOINTS.FLASHLISTS.ADD_CARD(listId, cardId),
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<FlashListResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _err, { listId }) => [
        { type: "FlashList", id: listId },
      ],
    }),

    // Remove flashcard from flashlist
    removeFlashCardFromList: builder.mutation<
      FlashListResponseDTO,
      { listId: number | string; cardId: number | string }
    >({
      query: ({ listId, cardId }) => ({
        url: API_ENDPOINTS.FLASHLISTS.REMOVE_CARD(listId, cardId),
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<FlashListResponseDTO>) =>
        response.data!,
      invalidatesTags: (_result, _err, { listId }) => [
        { type: "FlashList", id: listId },
      ],
    }),

    // Search flashlists
    searchFlashLists: builder.query<FlashListSearchResult, SearchParams>({
      query: (params) => {
        const qs = toQueryString(params as Record<string, unknown>);
        return `${API_ENDPOINTS.FLASHLISTS.SEARCH}${qs}`;
      },
      transformResponse: (response: ApiResponse<FlashListSearchResult>) =>
        response.data || { results: [], pagination: {} as PaginationDTO },
      providesTags: [{ type: "FlashList", id: "SEARCH" }],
    }),
  }),
});

// ─── Export hooks ──────────────────────────────────────

export const {
  // FlashCard
  useGetFlashCardsQuery,
  useGetFlashCardByIdQuery,
  useCreateFlashCardMutation,
  useUpdateFlashCardMutation,
  useDeleteFlashCardMutation,
  useAddCardToFlashCardMutation,
  useSearchFlashCardsQuery,
  // FlashList
  useGetFlashListsQuery,
  useGetFlashListByIdQuery,
  useCreateFlashListMutation,
  useUpdateFlashListMutation,
  useDeleteFlashListMutation,
  useRateFlashListMutation,
  useAddFlashCardToListMutation,
  useRemoveFlashCardFromListMutation,
  useSearchFlashListsQuery,
} = flashcardApi;
