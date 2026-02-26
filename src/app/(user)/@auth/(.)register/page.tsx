import { Suspense } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function RegisterInterceptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthModal defaultTab="register" />
    </Suspense>
  );
}
