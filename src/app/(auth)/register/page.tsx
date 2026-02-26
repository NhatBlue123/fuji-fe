"use client";

import AuthForm from "@/components/auth/AuthForm";
import GuestGuard from "@/components/auth/GuestGuard";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <GuestGuard>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c]" />}>
        <AuthForm defaultTab="register" />
      </Suspense>
    </GuestGuard>
  );
}
