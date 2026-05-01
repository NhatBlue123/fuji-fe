"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { RandomVideoCallExperience } from "@/features/video-call";

export default function VideoCallPage() {
  return (
    <AuthGuard redirectTo="/login?redirect=/video-call">
      <RandomVideoCallExperience />
    </AuthGuard>
  );
}
