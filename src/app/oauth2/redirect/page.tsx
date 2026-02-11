"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function OAuth2RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Save token to localStorage or cookies
      // Assuming the project uses 'token' key in localStorage
      localStorage.setItem("token", token);

      toast.success("Đăng nhập bằng Google thành công!");

      // Redirect to home page or dashboard
      router.push("/");
    } else {
      const error = searchParams.get("error");
      toast.error(error || "Đăng nhập thất bại. Vui lòng thử lại.");
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg">Đang xác thực thông tin đăng nhập...</p>
      </div>
    </div>
  );
}

export default function OAuth2Redirect() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Đang tải...</p>
          </div>
        </div>
      }
    >
      <OAuth2RedirectContent />
    </Suspense>
  );
}
