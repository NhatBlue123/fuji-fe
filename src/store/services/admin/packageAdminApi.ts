import { baseApi } from "../baseApi";

type ApiEnvelope<T> = { data?: T };

const unwrapData = <T,>(res: unknown, fallback: T): T => {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiEnvelope<T>).data ?? fallback;
  }
  return (res as T) ?? fallback;
};

export interface PackageFeature {
  id?: number;
  featureKey: string;
  enabled: boolean;
  quotaAmount?: number | null;
  quotaPeriod?: string | null;
  fairUseAmount?: number | null;
  metadataJson?: string | null;
}

export interface PackageCouponRule {
  id?: number;
  couponScope: string;
  discountType: string;
  discountValue: number;
  generatedCouponCount: number;
  usageLimitPerCoupon: number;
  usageLimitPerUser: number;
  expiresAfterDays: number;
  fundedBy: string;
  active: boolean;
}

export interface SystemPackage {
  id: number;
  code: string;
  name: string;
  description?: string;
  priceHoa: number;
  durationDays: number;
  active: boolean;
  visible: boolean;
  popular: boolean;
  sortOrder: number;
  features: PackageFeature[];
  couponRules: PackageCouponRule[];
}

export type SystemPackagePayload = Omit<SystemPackage, "id">;

export interface UserPackage {
  id: number;
  userId?: number | null;
  username?: string | null;
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  packageId: number;
  packageCode: string;
  packageName: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
  entitlements: PackageFeature[];
}

export const packageAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminPackages: builder.query<SystemPackage[], void>({
      query: () => "/admin/packages",
      transformResponse: (res: unknown) => unwrapData<SystemPackage[]>(res, []),
      providesTags: ["SystemPackage"],
    }),
    createSystemPackage: builder.mutation<SystemPackage, SystemPackagePayload>({
      query: (body) => ({ url: "/admin/packages", method: "POST", body }),
      transformResponse: (res: unknown) => unwrapData<SystemPackage>(res, res as SystemPackage),
      invalidatesTags: ["SystemPackage"],
    }),
    updateSystemPackage: builder.mutation<SystemPackage, { id: number; data: SystemPackagePayload }>({
      query: ({ id, data }) => ({ url: `/admin/packages/${id}`, method: "PUT", body: data }),
      transformResponse: (res: unknown) => unwrapData<SystemPackage>(res, res as SystemPackage),
      invalidatesTags: ["SystemPackage"],
    }),
    setSystemPackageActive: builder.mutation<SystemPackage, { id: number; active: boolean }>({
      query: ({ id, active }) => ({ url: `/admin/packages/${id}/active`, method: "PATCH", body: { active } }),
      transformResponse: (res: unknown) => unwrapData<SystemPackage>(res, res as SystemPackage),
      invalidatesTags: ["SystemPackage"],
    }),
    duplicateSystemPackage: builder.mutation<SystemPackage, number>({
      query: (id) => ({ url: `/admin/packages/${id}/duplicate`, method: "POST" }),
      transformResponse: (res: unknown) => unwrapData<SystemPackage>(res, res as SystemPackage),
      invalidatesTags: ["SystemPackage"],
    }),
    getPackageUsers: builder.query<UserPackage[], void>({
      query: () => "/admin/packages/users",
      transformResponse: (res: unknown) => unwrapData<UserPackage[]>(res, []),
      providesTags: ["SystemPackage"],
    }),
    getPackagePurchases: builder.query<UserPackage[], void>({
      query: () => "/admin/packages/purchases",
      transformResponse: (res: unknown) => unwrapData<UserPackage[]>(res, []),
      providesTags: ["SystemPackage"],
    }),
  }),
});

export const {
  useGetAdminPackagesQuery,
  useCreateSystemPackageMutation,
  useUpdateSystemPackageMutation,
  useSetSystemPackageActiveMutation,
  useDuplicateSystemPackageMutation,
  useGetPackageUsersQuery,
  useGetPackagePurchasesQuery,
} = packageAdminApi;
