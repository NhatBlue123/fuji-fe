import { baseApi } from "./baseApi";

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
  description?: string | null;
  priceHoa: number;
  durationDays: number;
  active: boolean;
  visible: boolean;
  popular: boolean;
  sortOrder: number;
  features: PackageFeature[];
  couponRules: PackageCouponRule[];
}

export interface UserPackage {
  id: number;
  packageId: number;
  packageCode: string;
  packageName: string;
  priceHoa?: number | null;
  sortOrder?: number | null;
  status: string;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
  entitlements: PackageFeature[];
}

export interface UserCoupon {
  id: number;
  code: string;
  scope: string;
  discountType: string;
  discountValue: number;
  usageLimitTotal: number;
  usageUsed: number;
  usageRemaining: number;
  usageLimitPerUser: number;
  expiresAt?: string | null;
  fundedBy: string;
  status: string;
}

export interface PackagePurchaseResponse {
  userPackageId: number;
  packageId: number;
  packageName: string;
  priceHoa: number;
  chargedHoa?: number;
  upgradeCreditHoa?: number;
  upgradeFromPackageName?: string | null;
  upgraded?: boolean;
  walletBalanceAfter: number;
  startsAt: string;
  expiresAt: string;
  status: string;
  generatedCoupons: UserCoupon[];
}

export interface FlashcardImageQuota {
  tier: string;
  dailyQuota: number;
  dailyUsed: number;
  dailyRemaining: number;
  hardCapDaily: number;
  packRemaining: number;
  totalRemaining: number;
  packEnabled: boolean;
}

export interface FlashcardImagePack {
  id: number;
  code: string;
  name: string;
  operationAmount: number;
  priceHoa: number;
  active: boolean;
  sortOrder: number;
}

export interface CouponValidationRequest {
  code: string;
  targetType: "COURSE" | "BOOKING";
  targetId?: number | null;
  originalAmountHoa: number;
}

export interface CouponValidationResponse {
  valid: boolean;
  message: string;
  code?: string | null;
  scope?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  originalAmountHoa?: number | null;
  discountAmountHoa?: number | null;
  finalAmountHoa?: number | null;
  fundedBy?: string | null;
  adminCommissionWaived?: boolean;
  teacherDiscountAmountHoa?: number | null;
  platformDiscountAmountHoa?: number | null;
}

export const userMonetizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveSystemPackages: builder.query<SystemPackage[], void>({
      query: () => "/packages/active",
      transformResponse: (res: unknown) => unwrapData<SystemPackage[]>(res, []),
      providesTags: ["UserMonetization", "SystemPackage"],
    }),
    getMySystemPackage: builder.query<UserPackage | null, void>({
      query: () => "/me/package",
      transformResponse: (res: unknown) => unwrapData<UserPackage | null>(res, null),
      providesTags: ["UserMonetization", "SystemPackage"],
    }),
    purchaseSystemPackage: builder.mutation<PackagePurchaseResponse, number>({
      query: (id) => ({ url: `/packages/${id}/purchase`, method: "POST" }),
      transformResponse: (res: unknown) =>
        unwrapData<PackagePurchaseResponse>(res, res as PackagePurchaseResponse),
      invalidatesTags: ["UserMonetization", "SystemPackage", "Wallet"],
    }),
    getMyCoupons: builder.query<UserCoupon[], void>({
      query: () => "/me/coupons",
      transformResponse: (res: unknown) => unwrapData<UserCoupon[]>(res, []),
      providesTags: ["UserMonetization"],
    }),
    validateCoupon: builder.mutation<CouponValidationResponse, CouponValidationRequest>({
      query: (body) => ({ url: "/coupons/validate", method: "POST", body }),
      transformResponse: (res: unknown) =>
        unwrapData<CouponValidationResponse>(res, res as CouponValidationResponse),
    }),
    getFlashcardImageQuota: builder.query<FlashcardImageQuota, void>({
      query: () => "/me/flashcard-image-quota",
      transformResponse: (res: unknown) =>
        unwrapData<FlashcardImageQuota>(res, {
          tier: "BASIC",
          dailyQuota: 0,
          dailyUsed: 0,
          dailyRemaining: 0,
          hardCapDaily: 0,
          packRemaining: 0,
          totalRemaining: 0,
          packEnabled: true,
        }),
      providesTags: ["UserMonetization", "FlashcardImageBilling"],
    }),
    getActiveFlashcardImagePacks: builder.query<FlashcardImagePack[], void>({
      query: () => "/flashcard-image-packs",
      transformResponse: (res: unknown) => unwrapData<FlashcardImagePack[]>(res, []),
      providesTags: ["UserMonetization", "FlashcardImageBilling"],
    }),
    purchaseFlashcardImagePack: builder.mutation<FlashcardImageQuota, number>({
      query: (packId) => ({
        url: `/flashcard-image-packs/${packId}/purchase`,
        method: "POST",
      }),
      transformResponse: (res: unknown) =>
        unwrapData<FlashcardImageQuota>(res, res as FlashcardImageQuota),
      invalidatesTags: ["UserMonetization", "FlashcardImageBilling", "Wallet"],
    }),
  }),
});

export const {
  useGetActiveSystemPackagesQuery,
  useGetMySystemPackageQuery,
  usePurchaseSystemPackageMutation,
  useGetMyCouponsQuery,
  useValidateCouponMutation,
  useGetFlashcardImageQuotaQuery,
  useGetActiveFlashcardImagePacksQuery,
  usePurchaseFlashcardImagePackMutation,
} = userMonetizationApi;
