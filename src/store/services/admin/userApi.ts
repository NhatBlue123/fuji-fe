import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

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
    // Don't stringify FormData
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserAdminDTO {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    status: "ACTIVE" | "LOCKED" | "BANNED";
    score?: number;
    antiCheatViolations?: number;
    createdAt: string;
}

export interface UserDetailAdminDTO extends UserAdminDTO {
    phoneNumber?: string;
    address?: string;
    avatarUrl?: string;
    examHistory?: {
        testTitle: string;
        score: number;
        date: string;
    }[];
}

// ============================================================================
// API SERVICE
// ============================================================================

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getAllUsers: builder.query<
      PaginatedResponse<UserAdminDTO>,
      {
        page?: number;
        size?: number;
        search?: string;
        role?: string;
        status?: string;
      }
    >({
      query: ({ page = 0, size = 10, search = "", role = "", status = "" }) =>
        `/admin/users?page=${page}&size=${size}&search=${search}&role=${role}&status=${status}`,
      transformResponse: (
        response: ApiResponse<PaginatedResponse<UserAdminDTO>>,
      ) => response.data,
      providesTags: ["User"],
    }),

    getUserById: builder.query<UserDetailAdminDTO, number>({
      query: (id) => `/admin/users/${id}`,
      transformResponse: (response: ApiResponse<UserDetailAdminDTO>) =>
        response.data,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    updateUserStatus: builder.mutation<
        UserAdminDTO,
        { id: number; data: { status?: string; role?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: ApiResponse<UserAdminDTO>) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        "User",
      ],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserStatusMutation,
} = userApi;
