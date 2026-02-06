"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthFloatingInput } from "../ui/auth-ui/auth-floating-input";
import { AuthPasswordInput } from "../ui/auth-ui/auth-pass-input";
import { AuthPrimaryButton } from "../ui/auth-ui/auth-primary-button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
    // TODO: Implement login logic
  };

  return (
    <div className="relative z-10 w-full max-w-[460px] mx-4">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30">
            <span className="material-symbols-outlined text-3xl">
              landscape
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
            FUJI
          </h1>
        </div>
        <p className="text-slate-400 text-sm font-medium">
          Nền tảng học tiếng Nhật số 1 Việt Nam
        </p>
      </div>

      <div className="bg-card-bg/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

        <div className="px-8 pt-8 pb-4">
          <div className="relative flex bg-slate-900/50 rounded-xl p-1 shadow-inner border border-white/5">
            <div className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm border border-white/10 transition-all duration-300 ease-out"></div>
            <button className="flex-1 relative z-10 py-2.5 text-sm font-bold text-white transition-colors">
              Đăng nhập
            </button>
            <Link
              href="/register"
              className="flex-1 relative z-10 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors text-center"
            >
              Đăng ký
            </Link>
          </div>
        </div>

        <div className="px-8 pb-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-fade-in-right"
          >
            <AuthFloatingInput
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightIcon={
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">
                  mail
                </span>
              }
            />


            <AuthPasswordInput
              id="password"
              label="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <AuthPrimaryButton type="submit">
              Đăng nhập
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </AuthPrimaryButton>

          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card-bg px-3 text-slate-500 font-bold tracking-widest">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                Google
              </span>
            </button>
          </div>
        </div>

        <div className="px-8 py-5 bg-slate-900/40 border-t border-white/5 text-center backdrop-blur-md">
          <p className="text-sm text-slate-400">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 text-center px-8">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link
            href="/terms"
            className="text-slate-400 hover:text-blue-400 underline"
          >
            Điều khoản dịch vụ
          </Link>{" "}
          và{" "}
          <Link
            href="/privacy"
            className="text-slate-400 hover:text-blue-400 underline"
          >
            Chính sách quyền riêng tư
          </Link>{" "}
          của FUJI.
        </p>
      </div>
    </div>
  );
}
