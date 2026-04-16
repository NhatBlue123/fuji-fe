"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { setAccessToken } from "@/lib/token";
import { useLazyGetCurrentUserQuery } from "@/store/services/authApi";

function OAuth2RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error(
        error === "oauth_failed"
          ? "Đăng nhập Google thất bại. Vui lòng thử lại."
          : decodeURIComponent(error),
      );
      router.replace("/login");
      return;
    }

    if (!token) {
      toast.error("Thiếu token đăng nhập.");
      router.replace("/login");
      return;
    }

    setAccessToken(token);

    getCurrentUser()
      .unwrap()
      .then(() => {
        toast.success("Đăng nhập bằng Google thành công!");
        router.replace("/");
      })
      .catch(() => {
        toast.error("Không tải được thông tin tài khoản. Vui lòng đăng nhập lại.");
        router.replace("/login");
      });
  }, [router, searchParams, getCurrentUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4" />
        <p className="text-lg text-slate-300">Đang hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
}

export default function OAuth2Redirect() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4" />
            <p className="text-lg text-slate-300">Đang tải...</p>
          </div>
        </div>
      }
    >
      <OAuth2RedirectContent />
    </Suspense>
  );
}
