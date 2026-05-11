import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { ChatBan, ChatViolation } from "@/types/chat-moderation";

// Base query with authentication (matches other admin APIs)
const baseQuery = async (args: any) => {
  const { url, method = "GET", body } =
    typeof args === "string" ? { url: args } : args;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) config.body = JSON.stringify(body);

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

export const adminChatModerationApi = createApi({
  reducerPath: "adminChatModerationApi",
  baseQuery,
  tagTypes: ["ChatViolation", "ChatBan"],
  endpoints: (builder) => ({
    getViolations: builder.query<
      PaginatedResponse<ChatViolation>,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 20 } = {}) => {
        const sp = new URLSearchParams();
        sp.set("page", String(page));
        sp.set("size", String(size));
        return `/admin/violations?${sp.toString()}`;
      },
      transformResponse: (
        response: ApiResponse<PaginatedResponse<ChatViolation>>,
      ) => response.data,
      providesTags: ["ChatViolation"],
    }),

    getBans: builder.query<
      PaginatedResponse<ChatBan>,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 20 } = {}) => {
        const sp = new URLSearchParams();
        sp.set("page", String(page));
        sp.set("size", String(size));
        return `/admin/bans?${sp.toString()}`;
      },
      transformResponse: (
        response: ApiResponse<PaginatedResponse<ChatBan>>,
      ) => response.data,
      providesTags: ["ChatBan"],
    }),

    deleteBan: builder.mutation<void, { userId: string }>({
      query: ({ userId }) => ({
        url: `/admin/bans/${encodeURIComponent(userId)}`,
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: ["ChatBan"],
    }),

    deleteAllBans: builder.mutation<void, void>({
      query: () => ({
        url: "/admin/bans",
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: ["ChatBan"],
    }),

    deleteViolation: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `/admin/violations/${id}`,
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: ["ChatViolation"],
    }),

    deleteAllViolations: builder.mutation<void, void>({
      query: () => ({
        url: "/admin/violations",
        method: "DELETE",
      }),
      transformResponse: () => undefined,
      invalidatesTags: ["ChatViolation"],
    }),
  }),
});

export const {
  useGetViolationsQuery,
  useGetBansQuery,
  useDeleteBanMutation,
  useDeleteAllBansMutation,
  useDeleteViolationMutation,
  useDeleteAllViolationsMutation,
} = adminChatModerationApi;

