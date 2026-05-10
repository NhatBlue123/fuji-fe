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
  keyword?: string;
  role?: string;
  isActive?: boolean;
  hasViolations?: boolean;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface AdminHoaGrantRequest {
  userId: number;
  amountHoa: number;
  reason?: string;
}

export interface AdminHoaGrantResponse {
  targetUserId: number;
  username: string;
  email: string;
  fullName: string;
  amountHoa: number;
  balanceBeforeHoa: number;
  balanceAfterHoa: number;
  transactionId: number;
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
        if (p.keyword) qs.set("keyword", p.keyword);
        if (p.role) qs.set("role", p.role);
        if (p.isActive !== undefined) qs.set("isActive", String(p.isActive));
        if (p.hasViolations !== undefined)
          qs.set("hasViolations", String(p.hasViolations));
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

    grantAdminHoa: builder.mutation<
      AdminHoaGrantResponse,
      AdminHoaGrantRequest
    >({
      query: (body) => ({
        url: "/admin/secret-wallet/grant",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<AdminHoaGrantResponse>) =>
        response.data!,
      invalidatesTags: (_result, _error, { userId }) => [
        "Wallet",
        "AdminRevenue",
        { type: "AdminUser", id: userId },
        { type: "AdminUser", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useGrantAdminHoaMutation,
} = adminUserApi;
