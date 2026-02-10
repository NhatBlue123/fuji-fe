import { Suspense } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function LoginInterceptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthModal defaultTab="login" />
    </Suspense>
  );
}
