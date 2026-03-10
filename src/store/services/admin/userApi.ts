import { baseApi } from "../baseApi";

export const adminUserApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query({
      query: (params) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: ["AdminUsers"],
    }),
    getAdminUserDetail: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminUsers", id }],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/admin/users/${id}/status`,
        method: "PATCH",
        params: { isActive },
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PATCH",
        params: { role },
      }),
      invalidatesTags: ["AdminUsers"],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetAdminUserDetailQuery,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
} = adminUserApi;
