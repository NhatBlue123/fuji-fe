import { baseApi } from "./baseApi";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface TeacherWithPermissions {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  permissions: string[];
}

interface AdminUserListItem {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
}

interface AdminUserPage {
  content: AdminUserListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: lấy tất cả teachers kèm permissions
    getTeachersWithPermissions: builder.query<TeacherWithPermissions[], void>({
      query: () => "/admin/permissions/teachers",
      transformResponse: (response: ApiResponse<TeacherWithPermissions[]>) =>
        response.data,
      providesTags: [{ type: "AdminUser", id: "TEACHERS" }],
    }),

    // Admin: lấy permissions của một user
    getUserPermissions: builder.query<string[], number>({
      query: (userId) => `/admin/permissions/users/${userId}`,
      transformResponse: (response: ApiResponse<string[]>) => response.data,
      providesTags: (_r, _e, userId) => [
        { type: "AdminUser", id: `PERMS_${userId}` },
      ],
    }),

    // Admin: cập nhật permissions cho teacher
    updateTeacherPermissions: builder.mutation<
      string[],
      { userId: number; permissions: string[] }
    >({
      query: ({ userId, permissions }) => ({
        url: `/admin/permissions/users/${userId}`,
        method: "PUT",
        body: permissions,
      }),
      transformResponse: (response: ApiResponse<string[]>) => response.data,
      invalidatesTags: (_r, _e, { userId }) => [
        { type: "AdminUser", id: `PERMS_${userId}` },
        { type: "AdminUser", id: "TEACHERS" },
      ],
    }),

    // Admin: nâng cấp user lên teacher
    promoteToTeacher: builder.mutation<
      string[],
      { userId: number; permissions: string[] }
    >({
      query: ({ userId, permissions }) => ({
        url: `/admin/permissions/users/${userId}/promote`,
        method: "POST",
        body: permissions,
      }),
      transformResponse: (response: ApiResponse<string[]>) => response.data,
      invalidatesTags: [
        { type: "AdminUser", id: "LIST" },
        { type: "AdminUser", id: "TEACHERS" },
      ],
    }),

    // Admin: hạ cấp teacher về student
    demoteToStudent: builder.mutation<void, number>({
      query: (userId) => ({
        url: `/admin/permissions/users/${userId}/demote`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "AdminUser", id: "LIST" },
        { type: "AdminUser", id: "TEACHERS" },
      ],
    }),

    // Admin: cập nhật role trực tiếp (dùng cho nâng cấp ADMIN)
    updateUserRole: builder.mutation<
      void,
      { userId: number; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" }
    >({
      query: ({ userId, role }) => ({
        url: `/users/me/${userId}`,
        method: "PUT",
        body: { role },
      }),
      transformResponse: () => undefined,
      invalidatesTags: [
        { type: "AdminUser", id: "LIST" },
        { type: "AdminUser", id: "TEACHERS" },
      ],
    }),

    // User-facing: lấy permissions của chính mình
    getMyPermissions: builder.query<string[], void>({
      query: () => "/permissions/me",
      transformResponse: (response: ApiResponse<string[]>) => response.data,
      providesTags: ["MyPermissions"],
    }),

    // Admin: lấy tất cả users để promote
    getAdminAllUsers: builder.query<
      AdminUserPage,
      { page?: number; size?: number } | void
    >({
      query: (params) => {
        const p = params || {};
        const qs = new URLSearchParams();
        if (p.page !== undefined) qs.set("page", String(p.page));
        if (p.size !== undefined) qs.set("size", String(p.size));
        const q = qs.toString();
        return `/users/me/all${q ? `?${q}` : ""}`;
      },
      transformResponse: (response: ApiResponse<AdminUserPage>) => response.data,
      providesTags: [{ type: "AdminUser", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTeachersWithPermissionsQuery,
  useGetUserPermissionsQuery,
  useUpdateTeacherPermissionsMutation,
  usePromoteToTeacherMutation,
  useDemoteToStudentMutation,
  useUpdateUserRoleMutation,
  useGetMyPermissionsQuery,
  useGetAdminAllUsersQuery,
} = permissionApi;
