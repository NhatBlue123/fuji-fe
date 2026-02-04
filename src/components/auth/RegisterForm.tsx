'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useRegisterMutation, useVerifyOtpMutation } from '@/lib/authAPI';

type Errors = {
    fullname?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
};
export default function RegisterForm() {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [otp, setOtp] = useState('');
    const [register, { isLoading: isRegistering }] = useRegisterMutation();
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        setFormData(prev => ({ ...prev, [id]: value }));

        if (submitted) {
            setErrors(prev => ({ ...prev, [id]: undefined }));
        }
    };
    const validate = () => {
        const newErrors: Errors = {};


        if (!formData.fullname.trim()) {
            newErrors.fullname = 'Vui lòng nhập họ tên';
        }

        const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
        if (!validate()) return;

        try {
            const result = await register({
                username: formData.email, // assuming username is email
                email: formData.email,
                password: formData.password,
                fullName: formData.fullname,
            }).unwrap();
            console.log('Registration successful:', result);
            setStep('verify');
        } catch (error) {
            console.error('Registration failed:', error);
            // Handle error, perhaps set error message
        }
    };
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) return;

        try {
            const result = await verifyOtp({
                email: formData.email,
                otpCode: otp,
            }).unwrap();
            console.log('Verification successful:', result);
            // Redirect to login or dashboard
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Verification failed:', error);
            // Handle error
        }
    };
    const inputClass = (error?: string) =>
        clsx(
            'block w-full px-4 py-3.5 text-white bg-slate-800/50 rounded-xl border transition-all focus:outline-none focus:ring-1',
            submitted && error
                ? 'border-rose-500 ring-rose-500'
                : 'border-slate-600/50 focus:border-blue-500 focus:ring-blue-500'
        );
    return (
        <div className="w-full max-w-[460px] mx-4">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30">
                        <span className="material-symbols-outlined text-3xl">landscape</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                        FUJI
                    </h1>
                </div>
                <p className="text-slate-400 text-sm font-medium">
                    Nền tảng học tiếng Nhật số 1 Việt Nam
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-card-bg/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative group ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                <div className="px-8 pt-8 pb-4">
                    <div className="relative flex bg-slate-900/50 rounded-xl p-1 shadow-inner border border-white/5">
                        {/* Indicator nằm bên PHẢI */}
                        <div className="absolute inset-y-1 left-1/2 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm border border-white/10 transition-all duration-300 ease-out"></div>


                        {/* LOGIN */}
                        <Link
                            href="/login"
                            className="flex-1 relative z-10 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-200 text-center"
                        >        Đăng nhập
                        </Link>


                        {/* REGISTER */}
                        <button
                            type="button"
                            className="flex-1 relative z-10 py-2.5 text-sm font-bold text-white transition-colors"
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="px-8 pb-8">
                    {step === 'register' ? (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Fullname */}
                            <div>
                                <input
                                    id="fullname"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    className={inputClass(errors.fullname)}
                                    placeholder="Họ tên"
                                />
                                {submitted && errors.fullname && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.fullname}</p>
                                )}
                            </div>
                            {/* Email Input */}
                            <div className="relative group">
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={clsx(
                                        inputClass(errors.email),
                                        'peer placeholder-transparent'
                                    )}
                                    placeholder="Email"
                                />
                                {submitted && errors.email && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
                                )}
                                <label
                                    className="absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-90 top-2 z-10 origin-[0] bg-transparent px-2 peer-focus:px-2 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-90 peer-focus:-translate-y-4 left-3 rounded-full pointer-events-none backdrop-blur-md"
                                    htmlFor="email"
                                >
                                    Email
                                </label>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-blue-500 transition-colors text-xl">
                                    mail
                                </span>
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={inputClass(errors.password)}
                                    placeholder="Mật khẩu"
                                />
                                {submitted && errors.password && (
                                    <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
                                )}
                                <label
                                    className="absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-90 top-2 z-10 origin-[0] bg-transparent px-2 peer-focus:px-2 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-90 peer-focus:-translate-y-4 left-3 rounded-full pointer-events-none backdrop-blur-md"
                                    htmlFor="password"
                                >
                                </label>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="relative group">
                                <input
                                    id="confirm_password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className={inputClass(errors.confirm_password)}
                                    placeholder="Xác nhận mật khẩu"
                                />
                                {submitted && errors.confirm_password && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {errors.confirm_password}
                                    </p>
                                )}
                                <label
                                    className="absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-90 top-2 z-10 origin-[0] bg-transparent px-2 peer-focus:px-2 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-90 peer-focus:-translate-y-4 left-3 rounded-full pointer-events-none backdrop-blur-md"
                                    htmlFor="confirm_password"
                                >
                                </label>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                                type="submit"
                                disabled={isRegistering}
                            >
                                {isRegistering ? 'Đang tạo...' : 'Tạo tài khoản'}
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-white">Xác nhận email</h3>
                                <p className="text-slate-400 text-sm">Nhập mã OTP đã gửi đến email của bạn</p>
                            </div>
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    value={otp}
                                    onChange={setOtp}
                                >
                                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-white *:data-[slot=input-otp-slot]:bg-slate-800/50 *:data-[slot=input-otp-slot]:border-slate-600/50 *:data-[slot=input-otp-slot]:rounded-xl *:data-[slot=input-otp-slot]:text-xl">
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otp.length !== 6 || isVerifying}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isVerifying ? 'Đang xác nhận...' : 'Xác nhận'}
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-card-bg/50 backdrop-blur-sm px-3 text-slate-500 font-bold tracking-widest rounded">
                                Hoặc tiếp tục với
                            </span>
                        </div>
                    </div>

                    {/* Google OAuth Button */}
                    <div className="grid grid-cols-1 gap-4">
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group">
                            <svg
                                className="w-5 h-5 group-hover:scale-110 transition-transform"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                ></path>
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                ></path>
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                ></path>
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                ></path>
                            </svg>
                            <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                                Google
                            </span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-900/40 border-t border-white/5 text-center backdrop-blur-md">
                    <p className="text-sm text-slate-400">
                        Đã có tài khoản?
                        <Link
                            className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all ml-2"
                            href="/auth/login"
                        >
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center px-8">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                    Bằng việc đăng ký, bạn đồng ý với{' '}
                    <a className="text-slate-400 hover:text-blue-400 underline" href="#">
                        Điều khoản dịch vụ
                    </a>{' '}
                    và{' '}
                    <a className="text-slate-400 hover:text-blue-400 underline" href="#">
                        Chính sách quyền riêng tư
                    </a>{' '}
                    của FUJI.
                </p>
            </div>
        </div>
    );
}
