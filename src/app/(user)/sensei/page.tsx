import SenseiPanel from "@/components/user-component/ai/SenseiPanel";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SenseiPage() {
  return (
    <AuthGuard redirectTo="/login?redirect=/sensei">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <SenseiPanel />
      </div>
    </AuthGuard>
  );
}
