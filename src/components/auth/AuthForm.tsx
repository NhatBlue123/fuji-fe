"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AuthFloatingInput } from "./AuthFloatingInput";
import {
  useLoginMutation,
  useSendOtpRegisterMutation,
  useRegisterMutation,
  useVerifyOAuth2OtpMutation,
} from "@/store/services/authApi";

type AuthTab = "login" | "register";
type RegisterStep = "register" | "otp";

interface AuthFormProps {
  defaultTab?: AuthTab;
  onSuccess?: () => void;
}

type Errors = {
  username?: string;
  fullname?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  otp?: string;
};

/* ─────────── Animation Variants ─────────── */
const tabContentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -280 : 280,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  }),
};

/* ─────────── Google Icon ─────────── */
function GoogleIcon() {
  return (
    <svg
      className="w-5 h-5 group-hover:scale-110 transition-transform"
      viewBox="0 0 24 24"
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
  );
}

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
export default function AuthForm({
  defaultTab = "login",
  onSuccess,
}: AuthFormProps) {
  const router = useRouter();

  /* ─── Tab state ─── */
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);
  const [direction, setDirection] = useState(0);

  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const sessionEmail = searchParams.get("email");

  useEffect(() => {
    if (sessionId) {
      setActiveTab("register");
      setRegisterStep("otp");
      setDirection(1);
    } else {
      setActiveTab(defaultTab);
      setDirection(defaultTab === "register" ? 1 : -1);
    }
  }, [defaultTab, sessionId]);
  const switchTab = (tab: AuthTab) => {
    if (tab === activeTab) return;
    setDirection(tab === "register" ? 1 : -1);
    setActiveTab(tab);
    // Reset errors when switching
    setLoginError(null);
    setRegisterServerError(null);
    // Update URL to reflect current tab
    const newPath = tab === "login" ? "/login" : "/register";
    window.history.replaceState(null, "", newPath);
  };

  /* ─── Login state ─── */
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  /* ─── Register state ─── */
  const [sendOtpRegister, { isLoading: isSendingOtp }] =
    useSendOtpRegisterMutation();
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [verifyOAuth2Otp, { isLoading: isVerifyingOAuth2 }] =
    useVerifyOAuth2OtpMutation();
  const [registerStep, setRegisterStep] = useState<RegisterStep>("register");
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [regErrors, setRegErrors] = useState<Errors>({});
  const [registerServerError, setRegisterServerError] = useState<string | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ─── Login handler ─── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await login({
        username: loginEmail,
        password: loginPassword,
      }).unwrap();
      // Middleware sẽ tự động: lưu tokens → fetch /me → dispatch loginSuccess
      toast.success("Đăng nhập thành công!", {
        description: "Chào mừng bạn quay trở lại FUJI",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (err: any) {
      let msg = "Đăng nhập thất bại. Vui lòng thử lại!";
      if (err?.data?.message) msg = err.data.message;
      else if (err?.error) msg = "Không thể kết nối đến máy chủ";
      else if (typeof err?.data === "string") msg = err.data;
      setLoginError(msg);
      toast.error("Đăng nhập thất bại", { description: msg });
    }
  };

  /* ─── Register handlers ─── */
  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (regErrors[e.target.id as keyof Errors]) {
      setRegErrors({ ...regErrors, [e.target.id]: undefined });
    }
  };

  const validate = () => {
    const newErrors: Errors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.username.trim())
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    if (!formData.fullname.trim()) newErrors.fullname = "Vui lòng nhập họ tên";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Email không hợp lệ";
    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (formData.password.length < 6)
      newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    if (!formData.confirm_password)
      newErrors.confirm_password = "Vui lòng xác nhận mật khẩu";
    else if (formData.confirm_password !== formData.password)
      newErrors.confirm_password = "Mật khẩu không khớp";
    setRegErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setRegisterServerError(null);
    if (!validate()) return;

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      fullName: formData.fullname,
    };

    try {
      // Bước 1: Gửi OTP (không tạo user)
      await sendOtpRegister(payload).unwrap();
      toast.info("Mã OTP đã được gửi", {
        description: `Vui lòng kiểm tra email ${formData.email}`,
      });
      setRegisterStep("otp");
    } catch (err: any) {
      setRegisterServerError(
        err?.data?.message || "Gửi OTP thất bại. Vui lòng thử lại!",
      );
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterServerError(null);
    if (otpCode.length < 6) {
      setRegErrors({ ...regErrors, otp: "Vui lòng nhập đầy đủ 6 số" });
      return;
    }
    try {
      if (sessionId) {
        // Step 2 for OAuth2: Verify session + OTP
        await verifyOAuth2Otp({ sessionId, otpCode }).unwrap();
        toast.success("Xác thực Google thành công!", {
          description: "Chào mừng bạn gia nhập FUJI",
        });
        router.push("/");
        return;
      }

      // Bước 2: Đăng ký với OTP (tạo user active ngay)
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullname,
        otpCode: otpCode,
      }).unwrap();
      toast.success("Đăng ký thành công!", {
        description: "Bạn có thể đăng nhập ngay bây giờ.",
      });
      switchTab("login");
      setRegisterStep("register");
      setOtpCode("");
    } catch (err: any) {
      setRegisterServerError(
        err?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn!",
      );
    }
  };

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="relative z-10 w-full max-w-[460px] mx-4">
      {/* Logo */}
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

      {/* Card */}
      <div className="bg-card-bg/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50" />

        {/* Tab Switcher */}
        <div className="px-8 pt-8 pb-4">
          <div className="relative flex bg-slate-900/50 rounded-xl p-1 shadow-inner border border-white/5">
            {/* Animated Indicator */}
            <motion.div
              className="absolute inset-y-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm border border-white/10"
              animate={{ left: activeTab === "login" ? "4px" : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={clsx(
                "flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors",
                activeTab === "login"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchTab("register")}
              className={clsx(
                "flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors",
                activeTab === "register"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* Tab Content with Animation */}
        <div className="px-8 pt-4 pb-8">
          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === "login" ? (
              <motion.div
                key="login"
                custom={direction}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Login Error */}
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-red-500 text-xl">
                      error
                    </span>
                    <span className="text-red-400 text-sm font-medium">
                      {loginError}
                    </span>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Username */}
                  <AuthFloatingInput
                    id="login-email"
                    label="Tên đăng nhập"
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    rightIcon={
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-pink-500 transition-colors text-xl">
                        person
                      </span>
                    }
                  />

                  {/* Password */}
                  <AuthFloatingInput
                    id="login-password"
                    label="Mật khẩu"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoginLoading}
                    rightIcon={
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showLoginPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    }
                  />

                  {/* Submit */}
                  <button
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
                    type="submit"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? (
                      <>
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Đăng nhập
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider & Social Login */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-card-bg px-3 text-slate-500 font-bold tracking-widest">
                      Hoặc tiếp tục với
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href =
                      "http://localhost:8181/oauth2/authorization/google")
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group"
                >
                  <GoogleIcon />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                    Google
                  </span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                custom={direction}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Register Error */}
                {registerServerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400 text-sm text-center"
                  >
                    {registerServerError}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {registerStep === "register" ? (
                    <motion.div
                      key="reg-form"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        x: -40,
                        transition: { duration: 0.15 },
                      }}
                    >
                      <form className="space-y-4" onSubmit={handleRegister}>
                        {/* Username */}
                        <AuthFloatingInput
                          id="username"
                          label="Tên đăng nhập"
                          value={formData.username}
                          onChange={handleRegChange}
                          error={
                            submitted && regErrors.username
                              ? regErrors.username
                              : undefined
                          }
                          rightIcon={
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-pink-500 transition-colors text-xl">
                              person
                            </span>
                          }
                        />

                        {/* Fullname */}
                        <AuthFloatingInput
                          id="fullname"
                          label="Họ tên"
                          value={formData.fullname}
                          onChange={handleRegChange}
                          error={
                            submitted && regErrors.fullname
                              ? regErrors.fullname
                              : undefined
                          }
                          rightIcon={
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-pink-500 transition-colors text-xl">
                              badge
                            </span>
                          }
                        />

                        {/* Email */}
                        <AuthFloatingInput
                          id="email"
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={handleRegChange}
                          error={
                            submitted && regErrors.email
                              ? regErrors.email
                              : undefined
                          }
                          rightIcon={
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-pink-500 transition-colors text-xl">
                              mail
                            </span>
                          }
                        />

                        {/* Password */}
                        <AuthFloatingInput
                          id="password"
                          label="Mật khẩu"
                          type={showRegPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleRegChange}
                          error={
                            submitted && regErrors.password
                              ? regErrors.password
                              : undefined
                          }
                          rightIcon={
                            <button
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                              type="button"
                              onClick={() =>
                                setShowRegPassword(!showRegPassword)
                              }
                            >
                              <span className="material-symbols-outlined text-xl">
                                {showRegPassword
                                  ? "visibility"
                                  : "visibility_off"}
                              </span>
                            </button>
                          }
                        />

                        {/* Confirm Password */}
                        <AuthFloatingInput
                          id="confirm_password"
                          label="Xác nhận mật khẩu"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirm_password}
                          onChange={handleRegChange}
                          error={
                            submitted && regErrors.confirm_password
                              ? regErrors.confirm_password
                              : undefined
                          }
                          rightIcon={
                            <button
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              <span className="material-symbols-outlined text-xl">
                                {showConfirmPassword
                                  ? "visibility"
                                  : "visibility_off"}
                              </span>
                            </button>
                          }
                        />

                        {/* Submit */}
                        <button
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          type="submit"
                          disabled={isSendingOtp}
                        >
                          {isSendingOtp ? "Đang gửi OTP..." : "Tạo tài khoản"}
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                        </button>
                      </form>

                      {/* Divider & Google */}
                      <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-card-bg/50 backdrop-blur-sm px-3 text-slate-500 font-bold tracking-widest rounded">
                            Hoặc tiếp tục với
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          (window.location.href =
                            "http://localhost:8181/oauth2/authorization/google")
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group"
                      >
                        <GoogleIcon />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                          Google
                        </span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="otp-form"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        x: -40,
                        transition: { duration: 0.15 },
                      }}
                    >
                      <form className="space-y-6" onSubmit={handleVerifyOtp}>
                        <div className="text-center space-y-3">
                          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 shadow-lg shadow-pink-500/30 ring-1 ring-pink-400/30">
                            <span className="material-symbols-outlined text-3xl text-white">
                              shield_lock
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">
                              {sessionId
                                ? "Mã xác thực Google đã gửi đến"
                                : "Mã OTP đã được gửi đến email"}
                            </p>
                            <p className="text-sm font-bold text-white">
                              {sessionId ? sessionEmail : formData.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <InputOTP
                            maxLength={6}
                            value={otpCode}
                            onChange={(value) => setOtpCode(value)}
                            containerClassName="gap-3"
                          >
                            <InputOTPGroup>
                              <InputOTPSlot
                                index={0}
                                className="size-12 text-xl font-bold bg-slate-800/50 border-slate-600/50 text-white focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                              />
                              <InputOTPSlot
                                index={1}
                                className="size-12 text-xl font-bold bg-slate-800/50 border-slate-600/50 text-white focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                              />
                              <InputOTPSlot
                                index={2}
                                className="size-12 text-xl font-bold bg-slate-800/50 border-slate-600/50 text-white focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                              />
                              <InputOTPSlot
                                index={3}
                                className="size-12 text-xl font-bold bg-slate-800/50 border-slate-600/50 text-white focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                              />
                              <InputOTPSlot
                                index={4}
                                className="size-12 text-xl font-bold bg-slate-800/50 border-slate-600/50 text-white focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                              />
                              <InputOTPSlot
                                index={5}
                                className="size-12 text-xl font-bold bg-slate-800/50 border-slate-600/50 text-white focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                              />
                            </InputOTPGroup>
                          </InputOTP>
                          {regErrors.otp && (
                            <p className="text-xs text-rose-400 text-center animate-pulse">
                              {regErrors.otp}
                            </p>
                          )}
                        </div>
                        <button
                          className="w-full py-3.5 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                          type="submit"
                          disabled={isRegistering || isVerifyingOAuth2}
                        >
                          {isRegistering || isVerifyingOAuth2
                            ? "Đang xử lý..."
                            : "Xác nhận OTP"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegisterStep("register")}
                          className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          Quay lại chỉnh sửa thông tin
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-900/40 border-t border-white/5 text-center backdrop-blur-md">
          <p className="text-sm text-slate-400">
            {activeTab === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  Đăng nhập ngay
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Terms */}
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
