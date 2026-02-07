'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

type AuthLayoutProps = {
    mode: 'login' | 'register';
    children: ReactNode;
};

export default function AuthLayout({ mode, children }: AuthLayoutProps) {
    const isLogin = mode === 'login';

    return (
        <div className="w-full max-w-[460px] mx-4">
            <div className="flex flex-col items-center mb-2">
                <div className="flex items-center gap-3 mb-1">
                    <div className="relative flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                        <span className="material-symbols-outlined text-3xl">
                            landscape
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        FUJI
                    </h1>
                </div>

                {/* {!isLogin && (
                    <p className="text-slate-400 text-sm font-medium">
                        Nền tảng học tiếng Nhật số 1 Việt Nam
                    </p>
                )} */}
            </div>


            {/* Card */}
            <div className="bg-card-bg/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                {/* Tabs */}
                <div className="relative flex items-center border-b border-white/10 mb-8">


                    {/* Active underline */}
                    <div
                        className={`
      absolute bottom-0 h-[2px] w-1/2
      bg-blue-500
      transition-transform duration-300 ease-out
      ${isLogin ? 'translate-x-0' : 'translate-x-full'}
    `}
                    />

                    {/* Login */}
                    {isLogin ? (
                        <button className="flex-1 py-3 text-sm font-semibold text-white">
                            Đăng nhập
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="flex-1 py-3 text-sm font-medium text-slate-400 hover:text-white text-center transition-colors"
                        >
                            Đăng nhập
                        </Link>
                    )}

                    {/* Divider */}
                    <div className="w-px h-5 bg-white/10" />

                    {/* Register */}
                    {!isLogin ? (
                        <button className="flex-1 py-3 text-sm font-semibold text-white">
                            Đăng ký
                        </button>
                    ) : (
                        <Link
                            href="/register"
                            className="flex-1 py-3 text-sm font-medium text-slate-400 hover:text-white text-center transition-colors"
                        >
                            Đăng ký
                        </Link>
                    )}
                </div>


                {/* Content */}
                <div className="px-8 pb-8">{children}</div>

                {!isLogin && (
                    <div className="px-8 py-5 bg-slate-900/40 border-t border-white/5 text-center backdrop-blur-md">
                        <p className="text-sm text-slate-400">
                            Đã có tài khoản?
                            <Link
                                href="/login"
                                className="ml-2 font-bold text-secondary hover:text-pink-400 hover:underline"
                            >
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                )}

            </div>

            {/* Terms
            {!isLogin && (
                <div className="mt-6 text-center px-8">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Bằng việc đăng ký, bạn đồng ý với{' '}
                        <Link href="/terms" className="underline">
                            Điều khoản dịch vụ
                        </Link>{' '}
                        và{' '}
                        <Link href="/privacy" className="underline">
                            Chính sách quyền riêng tư
                        </Link>{' '}
                        của FUJI.
                    </p>
                </div>
            )} */}

        </div>
    );
}
