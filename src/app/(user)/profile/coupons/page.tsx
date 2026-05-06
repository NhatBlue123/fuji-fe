import AuthGuard from "@/components/auth/AuthGuard";
import { CouponWallet } from "@/components/user-component/monetization/CouponWallet";

export default function ProfileCouponsPage() {
  return (
    <AuthGuard redirectTo="/login?redirect=/profile/coupons">
      <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-5xl">
          <CouponWallet />
        </div>
      </main>
    </AuthGuard>
  );
}
