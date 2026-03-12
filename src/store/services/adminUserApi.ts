import { baseApi } from "./baseApi";
import type { PageResponse, ApiResponse } from "@/types/course";

export interface AdminUserDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export const adminUserApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<
      PageResponse<AdminUserDTO>,
      AdminUserListParams | void
    >({
      query: (params) => {
        const p = params || {};
        const qs = new URLSearchParams();
        if (p.page !== undefined) qs.set("page", String(p.page));
        if (p.size !== undefined) qs.set("size", String(p.size));
        if (p.sortBy) qs.set("sortBy", p.sortBy);
        if (p.sortDir) qs.set("sortDir", p.sortDir);
        const q = qs.toString();
        return `/users/me/all${q ? `?${q}` : ""}`;
      },
      transformResponse: (response: ApiResponse<PageResponse<AdminUserDTO>>) =>
        response.data!,
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({
                type: "AdminUser" as const,
                id,
              })),
              { type: "AdminUser", id: "LIST" },
            ]
          : [{ type: "AdminUser", id: "LIST" }],
    }),

    updateUserRole: builder.mutation<
      AdminUserDTO,
      { userId: number; role: string }
    >({
      query: ({ userId, role }) => ({
        url: `/users/me/${userId}`,
        method: "PUT",
        body: { role },
      }),
      transformResponse: (response: ApiResponse<AdminUserDTO>) =>
        response.data!,
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "AdminUser", id: userId },
        { type: "AdminUser", id: "LIST" },
      ],
    }),
  }),
});

export const { useGetAdminUsersQuery, useUpdateUserRoleMutation } =
  adminUserApi;
