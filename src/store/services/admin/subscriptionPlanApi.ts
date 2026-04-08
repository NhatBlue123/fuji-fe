import { baseApi } from "../baseApi";

// ── Types ──

export type SubscriptionTier = "BASIC" | "PRO" | "PREMIUM";

export interface AdminSubscriptionPlan {
  id: number;
  tier: SubscriptionTier;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  active: boolean;
  popular: boolean;
  sortOrder: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  tier: SubscriptionTier;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  active?: boolean;
  popular?: boolean;
  sortOrder?: number;
  features?: string[];
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  active?: boolean;
  popular?: boolean;
  sortOrder?: number;
  features?: string[];
}

// ── API ──

export const adminSubscriptionPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminPlans: builder.query<AdminSubscriptionPlan[], void>({
      query: () => "/admin/plans",
      transformResponse: (res: any) => {
        const rawPlans = res?.data || res;
        if (Array.isArray(rawPlans)) {
          return rawPlans.map(plan => {
            let features = [];
            if (Array.isArray(plan.features)) {
              features = plan.features;
            } else if (typeof plan.features === "string") {
              try {
                features = JSON.parse(plan.features);
              } catch (e) {
                features = [plan.features];
              }
            }
            
            // Fix React child error: if features contain objects, extract their text description
            features = features.map((f: any) => {
              if (f !== null && typeof f === 'object') {
                return f.description || f.featureCode || f.name || JSON.stringify(f);
              }
              return String(f);
            });

            // Safely determine tier based on available fields or parse it from `name`
            let detectedTier = plan.tier || plan.planTier || plan.currentTier || plan.planType || plan.subscriptionType;
            if (!detectedTier && plan.name) {
              const upperName = plan.name.toUpperCase();
              if (upperName.includes("PREMIUM")) detectedTier = "PREMIUM";
              else if (upperName.includes("PRO")) detectedTier = "PRO";
            }
            const normalizedTier = (detectedTier || "BASIC").toString().toUpperCase();
            
            // Check all common boolean variations for 'active'
            const activeStatus = 
              plan.active === true || plan.active === 'true' || plan.active === 1 ||
              plan.isActive === true || plan.isActive === 'true' || plan.isActive === 1 ||
              plan.status === 'ACTIVE';

            return { ...plan, features, tier: normalizedTier, active: activeStatus };
          });
        }
        return rawPlans;
      },
      providesTags: ["AdminPlan"],
    }),

    createPlan: builder.mutation<AdminSubscriptionPlan, CreatePlanRequest>({
      query: (data) => ({
        url: "/admin/plans",
        method: "POST",
        body: data,
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: ["AdminPlan", "Subscription"],
    }),

    updatePlan: builder.mutation<AdminSubscriptionPlan, { id: number; data: UpdatePlanRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/plans/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: ["AdminPlan", "Subscription"],
    }),

    deletePlan: builder.mutation<{ success: boolean; message?: string }, number>({
      query: (id) => ({
        url: `/admin/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminPlan", "Subscription"],
    }),
  }),
});

export const {
  useGetAdminPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = adminSubscriptionPlanApi;
