# 🚀 Frontend Implementation Plan — Dynamic Subscription System

## Mục tiêu

Tích hợp FE với backend subscription APIs đã triển khai, hiển thị feature access / quota / lock/unlock UI theo plan hiện tại của user.

---

## Backend APIs đã sẵn sàng

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/api/me/feature-access` | Toàn bộ features + remaining quota | ✅ |
| `GET` | `/api/me/usage-summary` | Alias cho feature-access | ✅ |
| `GET` | `/api/jlpt/remaining-attempts` | Số lượt thi JLPT còn lại | ✅ |
| `GET` | `/api/ai-sensei/remaining` | Số lượt AI Sensei còn lại hôm nay | ✅ |

### Response format

#### `GET /api/me/feature-access`
```json
{
  "success": true,
  "data": {
    "planCode": "PRO",
    "features": {
      "courseAccess": "trial",
      "flashcardMode": "full",
      "practiceEnabled": true,
      "progressMode": "simple",
      "videoCallEnabled": false,
      "prioritySupportEnabled": false,
      "jlptExamLimit": 50,
      "jlptRemaining": 42,
      "aiSenseiDailyLimit": 10,
      "aiSenseiRemainingToday": 3
    }
  }
}
```

#### `GET /api/jlpt/remaining-attempts`
```json
{
  "success": true,
  "data": {
    "planCode": "PRO",
    "remaining": 42,
    "unlimited": false
  }
}
```

#### `GET /api/ai-sensei/remaining`
```json
{
  "success": true,
  "data": {
    "planCode": "BASIC",
    "remaining": 0,
    "unlimited": false,
    "disabled": true
  }
}
```

### Error responses (khi user bị chặn)

```json
{
  "status": 403,
  "error": "FEATURE_NOT_AVAILABLE",
  "message": "AI Sensei không khả dụng trong gói BASIC. Nâng cấp lên PRO hoặc PREMIUM!"
}
```

```json
{
  "status": 403,
  "error": "QUOTA_EXCEEDED",
  "message": "Bạn đã dùng hết 10 lượt AI Sensei hôm nay. Quay lại vào ngày mai hoặc nâng cấp PREMIUM!"
}
```

---

## Cấu trúc hiện tại của FE (đã khảo sát)

```
src/
├── types/
│   ├── subscription.ts          ← types hiện có (SubscriptionTier, SubscriptionPlan, ...)
│   └── feature-access.ts       ← ĐÃ TẠO (FeatureAccessData, QuotaRemainingData)
├── store/
│   └── services/
│       ├── baseApi.ts           ← base RTK Query (baseUrl: /api, Bearer token)
│       └── subscriptionApi.ts   ← CẦN THÊM endpoints mới
├── hooks/
│   ├── useFeatureAccess.ts      ← CẦN REFACTOR (hiện chỉ check tier, cần thêm quota)
│   └── usePermissions.ts        ← reference pattern
├── app/(user)/
│   ├── ai-chat/page.tsx         ← CẦN TÍCH HỢP AI Sensei quota check
│   ├── jlpt/                    ← CẦN TÍCH HỢP JLPT quota check
│   ├── video-call/              ← CẦN TÍCH HỢP video call access check
│   └── premium/                 ← Trang mua gói
```

---

## Checklist triển khai

### 1. Types (đã tạo ✅)

File: `src/types/feature-access.ts`

```ts
export interface FeatureAccessData {
  planCode: SubscriptionTier;
  features: {
    courseAccess: string;
    flashcardMode: string;
    practiceEnabled: boolean;
    progressMode: string;
    videoCallEnabled: boolean;
    prioritySupportEnabled: boolean;
    jlptExamLimit: number;      // -1 = unlimited
    jlptRemaining: number;
    aiSenseiDailyLimit: number; // -1 = unlimited, 0 = disabled
    aiSenseiRemainingToday: number;
  };
}
```

---

### 2. RTK Query — Thêm endpoints vào `subscriptionApi.ts`

Thêm 3 endpoints mới vào file `src/store/services/subscriptionApi.ts`:

```ts
// Thêm vào endpoints trong subscriptionApi:

getFeatureAccess: builder.query<FeatureAccessData, void>({
  query: () => "/me/feature-access",
  transformResponse: (res: any) => res?.data || res,
  providesTags: ["Subscription"],
}),

getJlptRemainingAttempts: builder.query<QuotaRemainingData, void>({
  query: () => "/jlpt/remaining-attempts",
  transformResponse: (res: any) => res?.data || res,
  providesTags: ["Subscription"],
}),

getAiSenseiRemaining: builder.query<QuotaRemainingData, void>({
  query: () => "/ai-sensei/remaining",
  transformResponse: (res: any) => res?.data || res,
  providesTags: ["Subscription"],
}),
```

Export hooks:
```ts
export const {
  // ... existing exports
  useGetFeatureAccessQuery,
  useGetJlptRemainingAttemptsQuery,
  useGetAiSenseiRemainingQuery,
} = subscriptionApi;
```

---

### 3. Refactor `useFeatureAccess.ts` hook

Hiện tại hook chỉ check tier level. Cần refactor để:
- Gọi `/api/me/feature-access` lấy full data
- Expose quota info (remaining JLPT, remaining AI Sensei)
- Expose boolean checks (canUseVideoCall, canUseAiSensei, etc.)

```ts
export const useFeatureAccess = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: featureAccess, isLoading } = useGetFeatureAccessQuery(undefined, {
    skip: !user,
  });

  const planCode = featureAccess?.planCode || user?.subscriptionTier || "BASIC";
  const features = featureAccess?.features;

  return {
    // Plan info
    planCode,
    isPro: planCode === "PRO" || planCode === "PREMIUM",
    isPremium: planCode === "PREMIUM",
    isLoading,

    // Feature booleans
    canUseVideoCall: features?.videoCallEnabled ?? false,
    canUseAiSensei: (features?.aiSenseiDailyLimit ?? 0) !== 0,
    hasPrioritySupport: features?.prioritySupportEnabled ?? false,
    flashcardMode: features?.flashcardMode ?? "basic",

    // Quota
    jlptRemaining: features?.jlptRemaining ?? 0,
    jlptLimit: features?.jlptExamLimit ?? 5,
    jlptUnlimited: features?.jlptExamLimit === -1,

    aiSenseiRemaining: features?.aiSenseiRemainingToday ?? 0,
    aiSenseiDailyLimit: features?.aiSenseiDailyLimit ?? 0,
    aiSenseiUnlimited: features?.aiSenseiDailyLimit === -1,

    // Raw data
    features,

    // Legacy compat
    hasAccess: (requiredTier: SubscriptionTier) => { ... },
  };
};
```

---

### 4. Tích hợp vào các trang

#### 4.1 AI Chat (`src/app/(user)/ai-chat/page.tsx`)

- Gọi `useFeatureAccess()` kiểm tra `canUseAiSensei`
- Nếu `false` → hiển thị upgrade banner
- Nếu `true` → hiển thị remaining: "Còn 3/10 lượt hôm nay"
- Handle error `FEATURE_NOT_AVAILABLE` / `QUOTA_EXCEEDED` từ API response

#### 4.2 JLPT Exam (`src/app/(user)/jlpt/` hoặc `src/app/Exam/`)

- Trước khi start exam, check `jlptRemaining`
- Nếu `0` → hiển thị "Bạn đã hết lượt. Nâng cấp gói!"
- Nếu có lượt → hiển thị "Còn X/Y lượt"
- Handle error `QUOTA_EXCEEDED` khi submit

#### 4.3 Video Call (`src/app/(user)/video-call/`)

- Check `canUseVideoCall`
- Nếu `false` → lock UI + hiển thị "PREMIUM only"

#### 4.4 Flashcard

- Check `flashcardMode`
- Nếu `"basic"` → ẩn advanced features
- Nếu `"full"` → hiển thị đầy đủ

#### 4.5 Premium Page (`src/app/(user)/premium/`)

- Hiển thị feature comparison table dựa trên feature-access data
- Highlight features user chưa có

---

### 5. Error Handling — Xử lý FEATURE_NOT_AVAILABLE / QUOTA_EXCEEDED

Tạo utility function hoặc hook để xử lý lỗi từ API:

```ts
// src/lib/subscription-errors.ts

export function isFeatureError(error: any): boolean {
  const code = error?.data?.error || error?.data?.code;
  return code === 'FEATURE_NOT_AVAILABLE' || code === 'QUOTA_EXCEEDED';
}

export function getFeatureErrorMessage(error: any): string {
  return error?.data?.message || 'Tính năng không khả dụng trong gói hiện tại.';
}

export function getFeatureErrorCode(error: any): string | null {
  return error?.data?.error || error?.data?.code || null;
}
```

---

### 6. UI Components cần tạo/sửa

#### [NEW] `FeatureGate` component
```tsx
// Wrapper component tự động lock/unlock UI theo feature
<FeatureGate feature="videoCall" fallback={<UpgradeBanner />}>
  <VideoCallUI />
</FeatureGate>
```

#### [NEW] `QuotaBadge` component
```tsx
// Hiển thị remaining quota
<QuotaBadge remaining={3} limit={10} label="AI Sensei" />
// Output: "3/10 lượt còn lại"

<QuotaBadge remaining={-1} unlimited label="JLPT" />
// Output: "Không giới hạn"
```

#### [NEW] `UpgradeBanner` component
```tsx
// Banner khuyến khích nâng cấp khi feature bị lock
<UpgradeBanner
  feature="AI Sensei"
  requiredPlan="PRO"
  message="Nâng cấp lên PRO để sử dụng AI Sensei!"
/>
```

---

## Thứ tự triển khai đề xuất

```
1. subscriptionApi.ts   — thêm 3 endpoints mới
2. useFeatureAccess.ts  — refactor hook để dùng feature-access API
3. subscription-errors.ts — error handling utility
4. FeatureGate component — wrapper component
5. QuotaBadge component  — quota display
6. UpgradeBanner component — upgrade CTA
7. Tích hợp AI Chat     — quota check + error handling
8. Tích hợp JLPT        — quota check before exam
9. Tích hợp Video Call   — premium lock
10. Tích hợp Flashcard   — mode check
```

---

## Lưu ý quan trọng

> **Cache invalidation**: Khi user upgrade plan (qua `/api/subscription/subscribe`), cần invalidate tag `"Subscription"` để refetch feature-access data. Hiện tại `subscriptionApi.subscribe` đã có `invalidatesTags: ["Wallet", "Subscription", "User"]` nên sẽ tự động refetch.

> **Quota real-time**: Sau mỗi lần dùng AI Sensei hoặc start JLPT exam, cần invalidate `"Subscription"` tag hoặc refetch feature-access để cập nhật remaining.

> **Fallback**: Nếu API feature-access lỗi, luôn fallback về BASIC features.
