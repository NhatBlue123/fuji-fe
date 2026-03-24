import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { FlashcardSet, Flashcard } from "@/types/flashcard";

// Base query with authentication
const baseQuery = async (args: any) => {
  const {
    url,
    method = "GET",
    body,
  } = typeof args === "string" ? { url: args } : args;

  const headers: HeadersInit = {};

  // Only set Content-Type for JSON, let browser set it for FormData
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  const data = await response.json();
  return { data };
};

export const adminFlashcardApi = createApi({
  reducerPath: "adminFlashcardApi",
  baseQuery: baseQuery,
  tagTypes: ["AdminFlashcard"],
  endpoints: (builder) => ({
    getFlashcards: builder.query<Flashcard[], void>({
      query: () => "/flashcards",
      transformResponse: (response: ApiResponse<Flashcard[]>) => response.data,
      providesTags: (result) => 
        result 
          ? [...result.map(({ id }) => ({ type: "AdminFlashcard" as const, id })), { type: "AdminFlashcard", id: "LIST" }]
          : [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    // --- Card CRUD (Individual) ---
    deleteFlashcard: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/flashcards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    updateFlashcard: builder.mutation<ApiResponse<Flashcard>, { id: number; data: Partial<Flashcard> }>({
      query: ({ id, data }) => ({
        url: `/flashcards/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdminFlashcard", id }, { type: "AdminFlashcard", id: "LIST" }],
    }),

    // --- Flashcard Set CRUD ---
    createFlashcardSet: builder.mutation<ApiResponse<any>, Partial<FlashcardSet>>({
      query: (body) => ({
        url: "/flashcards/sets",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    updateFlashcardSet: builder.mutation<ApiResponse<any>, { id: number; data: Partial<FlashcardSet> }>({
      query: ({ id, data }) => ({
        url: `/flashcards/sets/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    deleteFlashcardSet: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/flashcards/sets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    importFlashcards: builder.mutation<ApiResponse<string>, { file: File; lesson: string }>({
      query: ({ file, lesson }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("lesson", lesson);
        return {
          url: "/flashcards/import",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFlashcardsQuery,
  useCreateFlashcardSetMutation,
  useUpdateFlashcardSetMutation,
  useDeleteFlashcardSetMutation,
  useImportFlashcardsMutation,
  useDeleteFlashcardMutation,
  useUpdateFlashcardMutation,
} = adminFlashcardApi;
