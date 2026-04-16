import { baseApi } from "./baseApi";

export interface TopupPackage {
  id: number;
  price: number;
  flowers: number;
  bonusFlowers: number;
  isPopular: boolean;
  sortOrder: number;
  isActive: boolean;
}

export const topupPackageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTopupPackages: builder.query<TopupPackage[], void>({
      query: () => "/topup-packages",
      transformResponse: (res: any) => res?.data || res || [],
      providesTags: ["TopupPackage"],
    }),
  }),
});

export const { useGetTopupPackagesQuery } = topupPackageApi;
