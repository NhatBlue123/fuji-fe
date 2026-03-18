"use client";

import AuthForm from "@/components/auth/AuthForm";
import GuestGuard from "@/components/auth/GuestGuard";
import { Suspense } from "react";

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c]" />}>
        <AuthForm defaultTab="forgot_password" />
      </Suspense>
    </GuestGuard>
  );
}
