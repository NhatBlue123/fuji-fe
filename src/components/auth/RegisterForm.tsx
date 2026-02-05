'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useRegisterMutation, useVerifyOtpMutation  } from '@/store/services/authApi';
import * as authApiHooks from '@/store/services/authApi';

console.log(authApiHooks);

type Errors = {
    username?: string;
    fullname?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
    otp?: string;
};

export default function RegisterForm() {
    const router = useRouter();

    // API Mutations
    const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

    // State quản lý luồng
    const [step, setStep] = useState<"register" | "otp">("register");

    // State Form
    const [formData, setFormData] = useState({
        username: '',
        fullname: '',
        email: '',
        password: '',
        confirm_password: '',
    });

    const [otpCode, setOtpCode] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        if (errors[e.target.id as keyof Errors]) {
            setErrors({ ...errors, [e.target.id]: undefined });
        }
    };

    const validate = () => {
        const newErrors: Errors = {};
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!formData.username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
        if (!formData.fullname.trim()) newErrors.fullname = 'Vui lòng nhập họ tên';
        
        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Vui lòng xác nhận mật khẩu';
        } else if (formData.confirm_password !== formData.password) {
            newErrors.confirm_password = 'Mật khẩu không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Bước 1: Xử lý Đăng ký
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
        setServerError(null);

        if (!validate()) return;

        try {
            await registerUser({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                fullName: formData.fullname // Map với DTO fullName của Backend
            }).unwrap();

            setStep("otp");
        } catch (err: any) {
            setServerError(err?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!");
        }
    };

    // Bước 2: Xử lý Xác thực OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);

        if (otpCode.length < 6) {
            setErrors({ ...errors, otp: "Vui lòng nhập đầy đủ 6 số" });
            return;
        }

        try {
            await verifyOtp({
                email: formData.email,
                otpCode: otpCode
            }).unwrap();

            alert("Xác thực thành công! Bạn hiện có thể đăng nhập.");
            router.push("/login");
        } catch (err: any) {
            setServerError(err?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn!");
        }
    };

    const inputClass = (error?: string) =>
        clsx(
            'block w-full px-4 py-3 text-white bg-slate-800/50 rounded-xl border transition-all',
            'focus:outline-none focus:ring-1',
            submitted && error
                ? 'border-rose-500 ring-rose-500'
                : 'border-slate-600/50 focus:border-blue-500 focus:ring-blue-500'
        );

    return (
        <div className="w-full max-w-[460px] mx-4">
            {/* Header Logo */}
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30">
                        <span className="material-symbols-outlined text-3xl">landscape</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">FUJI</h1>
                </div>
                <p className="text-slate-400 text-sm font-medium">Nền tảng học tiếng Nhật số 1 Việt Nam</p>
            </div>

            {/* Form Card */}
            <div className="bg-card-bg/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative group ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                <div className="px-8 pt-8 pb-4">
                    <div className="relative flex bg-slate-900/50 rounded-xl p-1 shadow-inner border border-white/5">
                        <div className={clsx(
                            "absolute inset-y-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm border border-white/10 transition-all duration-300 ease-out",
                            step === "register" ? "left-1/2" : "left-1"
                        )}></div>
                        <Link href="/login" className="flex-1 relative z-10 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-200 text-center">Đăng nhập</Link>
                        <button type="button" onClick={() => setStep("register")} className="flex-1 relative z-10 py-2.5 text-sm font-bold text-white transition-colors">Đăng ký</button>
                    </div>
                </div>

                <div className="px-8 pb-8">
                    {serverError && (
                        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400 text-sm text-center">
                            {serverError}
                        </div>
                    )}

                    {step === "register" ? (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Username */}
                            <div>
                                <input id="username" value={formData.username} onChange={handleChange} className={inputClass(errors.username)} placeholder="Tên đăng nhập" />
                                {submitted && errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username}</p>}
                            </div>

                            {/* Fullname */}
                            <div>
                                <input id="fullname" value={formData.fullname} onChange={handleChange} className={inputClass(errors.fullname)} placeholder="Họ tên" />
                                {submitted && errors.fullname && <p className="mt-1 text-xs text-rose-400">{errors.fullname}</p>}
                            </div>

                            {/* Email */}
                            <div className="relative group">
                                <input id="email" type="email" value={formData.email} onChange={handleChange} className={clsx(inputClass(errors.email), 'peer placeholder-transparent')} placeholder="Email" />
                                <label className="absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-90 top-2 z-10 origin-[0] bg-transparent px-2 peer-focus:px-2 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-90 peer-focus:-translate-y-4 left-3 rounded-full pointer-events-none backdrop-blur-md" htmlFor="email">Email</label>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-blue-500 transition-colors text-xl">mail</span>
                                {submitted && errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div className="relative group">
                                <input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className={inputClass(errors.password)} placeholder="Mật khẩu" />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" type="button" onClick={() => setShowPassword(!showPassword)}>
                                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                </button>
                                {submitted && errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="relative group">
                                <input id="confirm_password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirm_password} onChange={handleChange} className={inputClass(errors.confirm_password)} placeholder="Xác nhận mật khẩu" />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <span className="material-symbols-outlined text-xl">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
                                </button>
                                {submitted && errors.confirm_password && <p className="mt-1 text-xs text-rose-400">{errors.confirm_password}</p>}
                            </div>

                            <button className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50" type="submit" disabled={isRegistering}>
                                {isRegistering ? "Đang xử lý..." : "Tạo tài khoản"}
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-6 animate-fade-in-right" onSubmit={handleVerifyOtp}>
                            <div className="text-center">
                                <p className="text-sm text-slate-400">Mã OTP đã được gửi đến email</p>
                                <p className="text-sm font-bold text-white">{formData.email}</p>
                            </div>
                            <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3.5 bg-slate-800/50 rounded-xl border border-slate-600/50 text-white focus:border-blue-500 outline-none"
                                placeholder="000000"
                            />
                            {errors.otp && <p className="text-xs text-rose-400 text-center">{errors.otp}</p>}
                            <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50" type="submit" disabled={isVerifying}>
                                {isVerifying ? "Đang xác thực..." : "Xác nhận OTP"}
                            </button>
                            <button type="button" onClick={() => setStep("register")} className="w-full text-sm text-slate-400 hover:text-white">Quay lại chỉnh sửa thông tin</button>
                        </form>
                    )}

                    {/* Divider & Google */}
                    {step === "register" && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-card-bg/50 backdrop-blur-sm px-3 text-slate-500 font-bold tracking-widest rounded">Hoặc tiếp tục với</span>
                                </div>
                            </div>
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group">
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                <span className="text-sm font-bold text-slate-300 group-hover:text-white">Google</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-900/40 border-t border-white/5 text-center backdrop-blur-md">
                    <p className="text-sm text-slate-400">Đã có tài khoản?
                        <Link className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 ml-2" href="/login">Đăng nhập ngay</Link>
                    </p>
                </div>
            </div>

            <div className="mt-6 text-center px-8">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                    Bằng việc đăng ký, bạn đồng ý với <a className="text-slate-400 hover:text-blue-400 underline" href="#">Điều khoản dịch vụ</a> và <a className="text-slate-400 hover:text-blue-400 underline" href="#">Chính sách quyền riêng tư</a> của FUJI.
                </p>
            </div>
        </div>
    );
}