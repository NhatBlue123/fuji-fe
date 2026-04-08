import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse } from "@/types/api";
import type { FlashcardSet, Flashcard, FlashCardResponseDTO } from "@/types/flashcard";

const baseQuery = async (
  args:
    | string
    | {
        url: string;
        method?: string;
        body?: FormData | object;
      },
) => {
  const {
    url,
    method = "GET",
    body,
  } = typeof args === "string" ? { url: args } : args;

  const headers: HeadersInit = {};
  const isFormData = body instanceof FormData;
  if (!isFormData && body !== undefined) {
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

  if (body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      (error as { message?: string }).message || "Request failed",
    );
  }

  const data = await response.json();
  return { data };
};

/** Payload gửi lên POST /api/flashcards (multipart field "flashcard") */
function buildCreateFlashcardFormData(input: Partial<FlashcardSet>): FormData {
  const lesson = (input as { lesson?: string }).lesson?.trim() || "";
  const name = input.name?.trim() || "Bộ thẻ mới";
  const descParts = [input.description?.trim(), lesson ? `Phân loại: ${lesson}` : ""].filter(
    Boolean,
  );
  const description = descParts.join("\n\n") || undefined;

  const flashcardJson = JSON.stringify({
    name,
    description,
    isPublic: input.isPublic !== false,
    level: "N5",
    cards: [
      {
        vocabulary: "（空）",
        meaning: "Thẻ mẫu — xóa hoặc sửa sau khi mở chi tiết bộ.",
        pronunciation: "",
        exampleSentence: "",
      },
    ],
  });

  const formData = new FormData();
  formData.append("flashcard", flashcardJson);
  return formData;
}

function buildUpdateFlashcardFormData(
  data: Partial<FlashcardSet>,
): FormData {
  const lesson = (data as { lesson?: string }).lesson?.trim();
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (data.description != null || lesson) {
    const descParts = [data.description?.trim(), lesson ? `Phân loại: ${lesson}` : ""].filter(
      Boolean,
    );
    if (descParts.length) payload.description = descParts.join("\n\n");
  }
  if (data.isPublic != null) payload.isPublic = data.isPublic;

  const formData = new FormData();
  formData.append("flashcard", JSON.stringify(payload));
  return formData;
}

export const adminFlashcardApi = createApi({
  reducerPath: "adminFlashcardApi",
  baseQuery,
  tagTypes: ["AdminFlashcard"],
  endpoints: (builder) => ({
    getFlashcards: builder.query<FlashCardResponseDTO[], void>({
      query: () => ({
        url: "/flashcards?page=0&limit=100",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<unknown>) => {
        const d = response?.data as
          | FlashCardResponseDTO[]
          | { flashCards?: FlashCardResponseDTO[]; content?: FlashCardResponseDTO[] }
          | undefined;
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if ("flashCards" in d && Array.isArray(d.flashCards)) return d.flashCards;
        if ("content" in d && Array.isArray(d.content)) return d.content;
        return [];
      },
      providesTags: (result) => {
        const list = Array.isArray(result) ? result : [];
        return [
          ...list.map(({ id }) => ({ type: "AdminFlashcard" as const, id })),
          { type: "AdminFlashcard" as const, id: "LIST" },
        ];
      },
    }),

    deleteFlashcard: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: `/flashcards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    updateFlashcard: builder.mutation<
      ApiResponse<Flashcard>,
      { id: number; data: Partial<Flashcard> }
    >({
      query: ({ id, data }) => ({
        url: `/flashcards/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminFlashcard", id },
        { type: "AdminFlashcard", id: "LIST" },
      ],
    }),

    createFlashcardSet: builder.mutation<ApiResponse<unknown>, Partial<FlashcardSet>>({
      query: (body) => ({
        url: "/flashcards",
        method: "POST",
        body: buildCreateFlashcardFormData(body),
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    updateFlashcardSet: builder.mutation<
      ApiResponse<unknown>,
      { id: number; data: Partial<FlashcardSet> }
    >({
      query: ({ id, data }) => ({
        url: `/flashcards/${id}`,
        method: "PUT",
        body: buildUpdateFlashcardFormData(data),
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    deleteFlashcardSet: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/flashcards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminFlashcard", id: "LIST" }],
    }),

    importFlashcards: builder.mutation<
      ApiResponse<string>,
      { file: File; lesson: string }
    >({
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
