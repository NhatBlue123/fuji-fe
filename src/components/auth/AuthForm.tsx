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
  useForgotPasswordMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
} from "@/store/services/authApi";
import { useTranslation } from "react-i18next";
import { tMsg } from "@/i18n";
import { getGoogleOAuthAuthorizationUrl } from "@/lib/backendOrigin";

type AuthTab = "login" | "register" | "forgot_password";
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
  const { t } = useTranslation();

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
    const tabParam = tab === "login" ? "" : `?tab=${tab}`;
    const newPath = tab === "login" ? "/login" : (tab === "register" ? "/register" : `/login${tabParam}`);
    window.history.replaceState(null, "", newPath);
  };

  /* ─── Forgot password state ─── */
  const [sendForgotOtp, { isLoading: isSendingForgotOtp }] = useForgotPasswordMutation();
  const [verifyForgotOtp, { isLoading: isVerifyingForgotOtp }] = useVerifyForgotPasswordOtpMutation();
  const [resetPwd, { isLoading: isResettingPwd }] = useResetPasswordMutation();
  const [forgotStep, setForgotStep] = useState<"EMAIL" | "VERIFY" | "RESET">("EMAIL");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotServerError, setForgotServerError] = useState<string | null>(null);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);

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
      const res = await login({
        username: loginEmail,
        password: loginPassword,
      }).unwrap();
      // Middleware sẽ tự động: lưu tokens → fetch /me → dispatch loginSuccess
      // Nếu backend trả về messageKey ở wrapper ApiResponse, ta không dùng ở đây
      // vì mutation login transformResponse đã unwrap data accessToken.
      toast.success(t("auth.loginSuccess"), {
        description: t("auth.loginWelcome"),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (err: any) {
      let msg = tMsg("auth.loginFailed");
      // Backend error handler: { messageKey: "auth.invalidCredentials" }
      if (err?.data?.messageKey) msg = tMsg(err.data.messageKey);
      else if (err?.error) msg = tMsg("api.networkError");
      else if (typeof err?.data === "string") msg = err.data;
      setLoginError(msg);
      toast.error(tMsg("auth.loginFail"), { description: msg });
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
      newErrors.username = t("auth.validation.usernameRequired");
    if (!formData.fullname.trim())
      newErrors.fullname = t("auth.validation.fullnameRequired");
    if (!formData.email.trim()) newErrors.email = t("auth.validation.emailRequired");
    else if (!emailRegex.test(formData.email))
      newErrors.email = t("auth.validation.emailInvalid");
    if (!formData.password) newErrors.password = t("auth.validation.passwordRequired");
    else if (formData.password.length < 6)
      newErrors.password = t("auth.validation.passwordMin");
    if (!formData.confirm_password)
      newErrors.confirm_password = t("auth.validation.confirmPasswordRequired");
    else if (formData.confirm_password !== formData.password)
      newErrors.confirm_password = t("auth.validation.passwordsNotMatch");
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
      const res = await sendOtpRegister(payload).unwrap();
      const msg = tMsg((res as any)?.messageKey) || tMsg("auth.sendOtpSuccess");
      toast.info(msg, {
        description: tMsg("auth.sendOtpCheckEmail", { email: formData.email }),
      });
      setRegisterStep("otp");
    } catch (err: any) {
      const msg = tMsg(err?.data?.messageKey) || tMsg("auth.sendOtpFailed");
      setRegisterServerError(msg);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterServerError(null);
    if (otpCode.length < 6) {
      setRegErrors({ ...regErrors, otp: t("auth.validation.otpRequired") });
      return;
    }
    try {
      if (sessionId) {
        // Step 2 for OAuth2: Verify session + OTP
        await verifyOAuth2Otp({ sessionId, otpCode }).unwrap();
        toast.success(tMsg("auth.googleVerifySuccess"), {
          description: tMsg("auth.googleWelcome"),
        });
        router.push("/");
        return;
      }

      // Step 2: Register with OTP
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullname,
        otpCode: otpCode,
      }).unwrap();
      toast.success(tMsg("auth.registerSuccess"), {
        description: tMsg("auth.registerCanLogin"),
      });
      switchTab("login");
      setRegisterStep("register");
      setOtpCode("");
    } catch (err: any) {
      const msg = tMsg(err?.data?.messageKey) || tMsg("auth.otpInvalidOrExpired");
      setRegisterServerError(msg);
    }
  };

  /* ─── Forgot password handlers ─── */
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotServerError(null);
    if (!forgotEmail) {
      setForgotServerError("Vui lòng nhập email");
      return;
    }
    try {
      const res = await sendForgotOtp({ email: forgotEmail }).unwrap();
      toast.success(tMsg(res.messageKey) || tMsg("auth.forgotPasswordOtpSent"));
      setForgotStep("VERIFY");

      // Bắt đầu đếm ngược 60s
      setForgotCountdown(60);
      const timer = setInterval(() => {
        setForgotCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setForgotServerError(tMsg(err?.data?.messageKey) || tMsg("api.error"));
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotServerError(null);
    if (forgotOtp.length < 6) {
      setForgotServerError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    try {
      const res = await verifyForgotOtp({
        email: forgotEmail,
        otpCode: forgotOtp,
      }).unwrap();
      toast.success(tMsg(res.messageKey) || tMsg("auth.checkOtpSuccess"));
      setForgotStep("RESET");
    } catch (err: any) {
      setForgotServerError(tMsg(err?.data?.messageKey) || tMsg("auth.otpInvalidOrExpired"));
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotServerError(null);
    if (forgotOtp.length < 6) {
      setForgotServerError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotServerError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotServerError("Mật khẩu không khớp");
      return;
    }

    try {
      const res = await resetPwd({
        email: forgotEmail,
        otpCode: forgotOtp,
        newPassword: forgotNewPassword,
      }).unwrap();
      
      toast.success(tMsg(res.messageKey) || tMsg("auth.resetPasswordSuccess"));
      
      // Thành công thì quay lại màn đăng nhập
      setForgotStep("EMAIL");
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      switchTab("login");
      setLoginEmail(forgotEmail); // Lấy luôn email vừa quên mk để điền sẵn
      setLoginPassword("");
    } catch (err: any) {
      setForgotServerError(tMsg(err?.data?.messageKey) || tMsg("api.error"));
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
          {t("auth.subTitle")}
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
              {t("common.login")}
            </button>
            <button
              type="button"
              onClick={() => switchTab(activeTab === "forgot_password" ? "forgot_password" : "register")}
              className={clsx(
                "flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors",
                activeTab === "register" || activeTab === "forgot_password"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              {activeTab === "forgot_password" ? "Quên mật khẩu" : t("common.register")}
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
                    label={t("auth.username")}
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
                  <div className="space-y-1">
                    <AuthFloatingInput
                      id="login-password"
                      label={t("auth.password")}
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
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchTab("forgot_password")}
                        className="text-xs text-slate-400 hover:text-pink-400 transition-colors font-medium cursor-pointer"
                      >{t('auto.authform_1')}</button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
                    type="submit"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? (
                      <>
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        {t("auth.processing")}
                      </>
                    ) : (
                      <>
                        {t("common.login")}
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
                      {t("auth.orContinueWith")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = getGoogleOAuthAuthorizationUrl())
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group"
                >
                  <GoogleIcon />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                    {t("auth.google")}
                  </span>
                </button>
              </motion.div>
            ) : activeTab === "register" ? (
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
                          label={t("auth.username")}
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
                          label={t("auth.fullname")}
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
                          label={t("auth.email")}
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
                          label={t("auth.password")}
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
                          label={t("auth.confirmPassword")}
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
                          {isSendingOtp ? t("auth.processing") : t("common.register")}
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
                            {t("auth.orContinueWith")}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          (window.location.href = getGoogleOAuthAuthorizationUrl())
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all group"
                      >
                        <GoogleIcon />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                          {t("auth.google")}
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
                                ? t("auth.oauth2OtpSentTo")
                                : t("auth.otpSentTo")}
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
                            ? t("auth.processing")
                            : t("auth.confirmOtp")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegisterStep("register")}
                          className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          {t("auth.backToEdit")}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                custom={direction}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Forgot Password Error */}
                {forgotServerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-red-500 text-xl">
                      error
                    </span>
                    <span className="text-red-400 text-sm font-medium">
                      {forgotServerError}
                    </span>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {forgotStep === "EMAIL" ? (
                    <motion.div
                      key="forgot-email"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { type: "spring", stiffness: 300, damping: 25 },
                      }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
                    >
                      <form className="space-y-5" onSubmit={handleForgotEmail}>
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold text-white tracking-tight mb-2">{t('auto.authform_2')}</h2>
                          <p className="text-sm text-slate-400">{t('auto.authform_3')}</p>
                        </div>

                        <AuthFloatingInput
                          id="forgot-email"
                          label={t("auth.email")}
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          rightIcon={
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-pink-500 transition-colors text-xl">
                              mail
                            </span>
                          }
                        />

                        <button
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                          type="submit"
                          disabled={isSendingForgotOtp || forgotCountdown > 0}
                        >
                          {isSendingForgotOtp ? (
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            "Gửi mã xác nhận"
                          )}
                        </button>

                        {forgotCountdown > 0 && (
                          <p className="text-center text-sm text-slate-400 mt-4">
                            Bạn có thể yêu cầu gửi lại sau {forgotCountdown}s
                          </p>
                        )}
                      </form>
                    </motion.div>
                  ) : forgotStep === "VERIFY" ? (
                    <motion.div
                      key="forgot-verify"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { type: "spring", stiffness: 300, damping: 25 },
                      }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
                    >
                      <form className="space-y-5" onSubmit={handleForgotVerify}>
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold text-white tracking-tight mb-2">{t('auto.authform_4')}</h2>
                          <p className="text-sm text-slate-400">{t('auto.authform_10')}<br />{" "}
                            <span className="text-white font-bold">
                              {forgotEmail}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 mb-4">
                          <InputOTP
                            maxLength={6}
                            value={forgotOtp}
                            onChange={(value) => setForgotOtp(value)}
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
                        </div>

                        <button
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                          type="submit"
                          disabled={isVerifyingForgotOtp}
                        >
                          {isVerifyingForgotOtp ? (
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            "Xác nhận mã"
                          )}
                        </button>

                        <div className="flex items-center justify-between mt-4">
                          <button
                            type="button"
                            onClick={() => setForgotStep("EMAIL")}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                          >{t('auto.authform_5')}</button>
                          {forgotCountdown === 0 ? (
                            <button
                              type="button"
                              onClick={(e) => handleForgotEmail(e as any)}
                              className="text-sm text-pink-400 hover:text-pink-300 font-semibold transition-colors"
                              disabled={isSendingForgotOtp}
                            >{t('auto.authform_6')}</button>
                          ) : (
                            <p className="text-sm text-slate-500">
                              Có thể gửi lại sau {forgotCountdown}s
                            </p>
                          )}
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="forgot-reset"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { type: "spring", stiffness: 300, damping: 25 },
                      }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
                    >
                      <form className="space-y-5" onSubmit={handleForgotReset}>
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold text-white tracking-tight mb-2">{t('auto.authform_7')}</h2>
                          <p className="text-sm text-slate-400">{t('auto.authform_11')}<br />{" "}
                            <span className="text-white font-bold">
                              {forgotEmail}
                            </span>
                          </p>
                        </div>

                        <AuthFloatingInput
                          id="forgot-new-password"
                          label="Mật khẩu mới (ít nhất 6 ký tự)"
                          type={showForgotNewPassword ? "text" : "password"}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          required
                          rightIcon={
                            <button
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                              type="button"
                              onClick={() =>
                                setShowForgotNewPassword(!showForgotNewPassword)
                              }
                            >
                              <span className="material-symbols-outlined text-xl">
                                {showForgotNewPassword
                                  ? "visibility"
                                  : "visibility_off"}
                              </span>
                            </button>
                          }
                        />

                        <AuthFloatingInput
                          id="forgot-confirm-password"
                          label="Xác nhận mật khẩu"
                          type={showForgotConfirmPassword ? "text" : "password"}
                          value={forgotConfirmPassword}
                          onChange={(e) =>
                            setForgotConfirmPassword(e.target.value)
                          }
                          required
                          rightIcon={
                            <button
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                              type="button"
                              onClick={() =>
                                setShowForgotConfirmPassword(
                                  !showForgotConfirmPassword,
                                )
                              }
                            >
                              <span className="material-symbols-outlined text-xl">
                                {showForgotConfirmPassword
                                  ? "visibility"
                                  : "visibility_off"}
                              </span>
                            </button>
                          }
                        />

                        <button
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-secondary to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                          type="submit"
                          disabled={isResettingPwd}
                        >
                          {isResettingPwd ? (
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            "Đặt lại mật khẩu"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setForgotStep("VERIFY")}
                          className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors mt-4"
                        >{t('auto.authform_8')}</button>
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
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  {t("auth.registerNow")}
                </button>
              </>
            ) : activeTab === "register" ? (
              <>
                {t("auth.haveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  {t("auth.loginNow")}
                </button>
              </>
            ) : (
              <>
                Đã nhớ mật khẩu?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-bold text-secondary hover:text-pink-400 hover:underline decoration-2 underline-offset-4 transition-all"
                >{t('auto.authform_9')}</button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-6 text-center px-8">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {t("auth.termsPrefix")}{" "}
          <Link
            href="/terms"
            className="text-slate-400 hover:text-blue-400 underline"
          >
            {t("auth.termsOfService")}
          </Link>{" "}
          {t("auth.and")}{" "}
          <Link
            href="/privacy"
            className="text-slate-400 hover:text-blue-400 underline"
          >
            {t("auth.privacyPolicy")}
          </Link>{" "}
          {t("auth.fujiFooter")}
        </p>
      </div>
    </div>
  );
}
