import AuthGuard from "@/components/auth/AuthGuard";
import { PackageStore } from "@/components/user-component/monetization/PackageStore";

export default function PackagesPage() {
  return (
    <AuthGuard redirectTo="/login?redirect=/packages">
      <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-7xl">
          <PackageStore />
        </div>
      </main>
    </AuthGuard>
  );
}
