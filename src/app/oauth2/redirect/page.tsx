"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { setAccessToken } from "@/lib/token";
import { useAppDispatch } from "@/store/hooks";
import { loginSuccess } from "@/store/slices/authSlice";
import { useLazyGetCurrentUserQuery } from "@/store/services/authApi";
import type { User } from "@/types/auth";
import type { AuthUser } from "@/types/auth-user";

function mapAuthUserToUser(authUser: AuthUser): User {
  const resolvedRole = authUser.role || "STUDENT";

  return {
    _id: String(authUser.id || ""),
    id: authUser.id,
    email: authUser.email || "",
    username: authUser.username || "",
    fullname: authUser.fullName || authUser.username || "",
    fullName: authUser.fullName || "",
    avatar: authUser.avatarUrl || "",
    avatarUrl: authUser.avatarUrl || "",
    avatarFrameUrl: authUser.avatarFrameUrl || null,
    gender: authUser.gender || "",
    role: resolvedRole,
    level: (authUser.jlptLevel || "N5") as User["level"],
    subscriptionTier: authUser.subscriptionTier,
    isActive: authUser.active ?? true,
    isAdmin: resolvedRole === "ADMIN",
    isOnline: true,
    posts: 0,
    followers: [],
    following: [],
    lastActiveAt: new Date().toISOString(),
    createdAt: authUser.createdAt || new Date().toISOString(),
    updatedAt: authUser.createdAt || new Date().toISOString(),
  };
}

function OAuth2RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
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
      .then((authUser) => {
        dispatch(loginSuccess({ user: mapAuthUserToUser(authUser), accessToken: token }));
        toast.success("Đăng nhập bằng Google thành công!");
        router.replace("/");
      })
      .catch(() => {
        toast.error("Không tải được thông tin tài khoản. Vui lòng đăng nhập lại.");
        router.replace("/login");
      });
  }, [dispatch, router, searchParams, getCurrentUser]);

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
