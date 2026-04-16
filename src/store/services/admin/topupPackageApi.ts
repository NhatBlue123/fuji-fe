import { baseApi } from "../baseApi";

export interface AdminTopupPackage {
  id: number;
  price: number;
  flowers: number;
  bonusFlowers: number;
  isPopular: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface TopupPackagePayload {
  price: number;
  flowers: number;
  bonusFlowers?: number;
  isPopular?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export const adminTopupPackageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminTopupPackages: builder.query<AdminTopupPackage[], void>({
      query: () => "/admin/topup-packages",
      transformResponse: (res: any) => res?.data || res || [],
      providesTags: ["TopupPackage"],
    }),
    createTopupPackage: builder.mutation<AdminTopupPackage, TopupPackagePayload>({
      query: (body) => ({
        url: "/admin/topup-packages",
        method: "POST",
        body,
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: ["TopupPackage"],
    }),
    updateTopupPackage: builder.mutation<AdminTopupPackage, { id: number; data: TopupPackagePayload }>({
      query: ({ id, data }) => ({
        url: "/admin/topup-packages/" + id,
        method: "PUT",
        body: data,
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: ["TopupPackage"],
    }),
    deleteTopupPackage: builder.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({
        url: "/admin/topup-packages/" + id,
        method: "DELETE",
      }),
      invalidatesTags: ["TopupPackage"],
    }),
  }),
});

export const {
  useGetAdminTopupPackagesQuery,
  useCreateTopupPackageMutation,
  useUpdateTopupPackageMutation,
  useDeleteTopupPackageMutation,
} = adminTopupPackageApi;
