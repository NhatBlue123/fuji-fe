"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function OAuth2SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      setToken(token);
      router.push("/dashboard");
    } else {
      router.push("/login?error=oauth");
    }
  }, [searchParams, router]);

  return (
    <div className="h-screen flex items-center justify-center text-white">
      Đang xử lý đăng nhập Google...
    </div>
  );
}
