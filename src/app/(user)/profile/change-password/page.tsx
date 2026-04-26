"use client";

import { useState, useEffect } from "react";
import {
  Eye, EyeOff, Lock, ArrowLeft, AlertCircle,
  KeyRound, ShieldCheck, CheckCircle2, Info,
  Save, ShieldAlert, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChangePasswordMutation } from "@/store/services/user/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tMsg } from "@/i18n";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { clearTokens } from "@/lib/token";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

export default function ChangePasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  useEffect(() => {
    if (!isSuccess) return;

    if (redirectCountdown <= 0) {
      router.replace("/login");
      return;
    }

    const timer = window.setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isSuccess, redirectCountdown, router]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthPercent = (strength / 5) * 100;

  const getStrengthConfig = () => {
    if (strength <= 2) return { label: "Yeu", color: "bg-rose-500", text: "text-rose-500", progress: "bg-rose-500/20 [&>div]:bg-rose-500" };
    if (strength <= 3) return { label: "Co ban", color: "bg-amber-500", text: "text-amber-500", progress: "bg-amber-500/20 [&>div]:bg-amber-500" };
    if (strength <= 4) return { label: "An toan", color: "bg-emerald-500", text: "text-emerald-500", progress: "bg-emerald-500/20 [&>div]:bg-emerald-500" };
    return { label: "Rat manh", color: "bg-cyan-500", text: "text-cyan-500", progress: "bg-cyan-500/20 [&>div]:bg-cyan-500" };
  };

  const { label: strengthLabel, text: strengthText, progress: progressColor } = getStrengthConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Thieu truong du lieu. Vui long dien day du tat ca.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mat khau moi qua ngan, toi thieu phai 8 ky tu.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mat khau nhap lai khong khop.");
      return;
    }

    try {
      const res = await changePassword({ currentPassword, newPassword }).unwrap();
      clearTokens();
      dispatch(logout());
      setIsSuccess(true);
      setRedirectCountdown(3);
      toast.success(
        tMsg(res) || "Doi mat khau thanh cong. Vui long dang nhap lai.",
      );
    } catch (err: unknown) {
      const apiError = err as { data?: { messageKey?: string } };
      setError(
        tMsg(apiError.data?.messageKey) ||
          tMsg("auth.invalidCredentials") ||
          "Mat khau hien tai khong dung. Xin thu lai.",
      );
    }
  };

  if (isSuccess) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-10 relative selection:bg-pink-500/30">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />

        <Card className="w-full max-w-xl shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 rounded-[2.5rem] dark:bg-[#0B1120]/60 dark:backdrop-blur-xl overflow-hidden">
          <CardHeader className="text-center border-b dark:border-white/5 px-8 py-10">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">
              Doi mat khau thanh cong
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-medium">
              Ban da doi mat khau thanh cong. He thong se dua ban toi trang dang nhap sau {redirectCountdown} giay.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 py-8">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Vi ly do bao mat, phien dang nhap hien tai da duoc ket thuc. Hay dang nhap lai bang mat khau moi.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-4 px-8 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace("/profile")}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-muted dark:border-white/10"
            >
              Ve profile
            </Button>
            <Button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[10px]"
            >
              Dang nhap ngay
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 selection:bg-pink-500/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-pink-500"
            >
              <ArrowLeft size={14} />
              {t("auto.changePassword_1")}
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
                {t("auto.changePassword_2")}
                <span className="text-pink-500 dark:text-pink-400">
                  {t("auto.changePassword_3")}
                </span>
              </h1>
              <p className="max-w-2xl text-sm font-medium text-muted-foreground">
                {t("auto.changePassword_4")}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit gap-2 border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400"
          >
            <ShieldCheck size={14} />
            {t("auto.changePassword_5")}
          </Badge>
        </header>

        <Card className="overflow-hidden rounded-2xl border-muted/70 bg-background shadow-xl shadow-black/5 dark:border-white/10 dark:bg-[#0B1120]/70">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex flex-col">
              <CardHeader className="border-b border-border/70 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-pink-500/20 bg-pink-500/10 text-pink-500 dark:text-pink-400">
                    <KeyRound size={22} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg font-bold uppercase tracking-tight text-foreground">
                      {t("auto.changePassword_6")}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      {t("auto.changePassword_7")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="space-y-3">
                  <label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Lock size={14} className="text-amber-500" />
                    {t("auto.changePassword_8")}
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("auto.changePassword_20")}
                      className="h-14 rounded-xl border-muted bg-muted/40 pr-12 font-bold text-foreground shadow-inner transition-all focus-visible:border-pink-500/50 focus-visible:ring-pink-500/30 dark:border-white/10 dark:bg-black/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 rounded-lg border bg-background p-1.5 text-muted-foreground shadow-sm transition-colors -translate-y-1/2 hover:text-pink-500 dark:border-white/10 dark:bg-[#111827]"
                      aria-label={showCurrent ? "Hide current password" : "Show current password"}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Sparkles size={14} className="text-pink-500" />
                      {t("auto.changePassword_9")}
                    </label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t("auto.changePassword_21")}
                        className={`h-14 rounded-xl border-muted bg-muted/40 pr-12 font-bold text-foreground shadow-inner transition-all focus-visible:border-pink-500/50 focus-visible:ring-pink-500/30 dark:border-white/10 dark:bg-black/20 ${
                          newPassword && strength <= 2
                            ? "border-rose-500/50 focus-visible:border-rose-500 focus-visible:ring-rose-500/20"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 rounded-lg border bg-background p-1.5 text-muted-foreground shadow-sm transition-colors -translate-y-1/2 hover:text-pink-500 dark:border-white/10 dark:bg-[#111827]"
                        aria-label={showNew ? "Hide new password" : "Show new password"}
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {newPassword && (
                    <div className="space-y-3 rounded-xl border bg-muted/20 p-4 shadow-inner dark:border-white/10 dark:bg-black/20">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">{t("auto.changePassword_10")}</span>
                        <span className={strengthText}>{strengthLabel}</span>
                      </div>
                      <Progress value={strengthPercent} className={`h-1.5 rounded-full ${progressColor}`} />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    {t("auto.changePassword_11")}
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("auto.changePassword_22")}
                      className={`h-14 rounded-xl border-muted bg-muted/40 pr-12 font-bold text-foreground shadow-inner transition-all focus-visible:border-pink-500/50 focus-visible:ring-pink-500/30 dark:border-white/10 dark:bg-black/20 ${
                        confirmPassword && newPassword && confirmPassword !== newPassword
                          ? "border-rose-500/50 focus-visible:border-rose-500 focus-visible:ring-rose-500/20"
                          : confirmPassword && newPassword && confirmPassword === newPassword
                            ? "border-emerald-500/50 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                            : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 rounded-lg border bg-background p-1.5 text-muted-foreground shadow-sm transition-colors -translate-y-1/2 hover:text-pink-500 dark:border-white/10 dark:bg-[#111827]"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword && (
                    <div
                      className={`flex items-center gap-2 rounded-lg p-2 text-[10px] font-black uppercase tracking-widest ${
                        confirmPassword === newPassword
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {confirmPassword === newPassword ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {confirmPassword === newPassword ? "Khop hoan toan" : "Chua hoan toan khop"}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold uppercase tracking-widest text-rose-600 shadow-inner dark:text-rose-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="mt-auto flex flex-col gap-3 border-t border-border/70 bg-muted/10 p-6 sm:flex-row sm:p-8 dark:bg-black/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="h-12 w-full rounded-xl border-muted text-[10px] font-black uppercase tracking-widest dark:border-white/10 sm:flex-1"
                >
                  {t("auto.changePassword_12")}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-500 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-pink-500/20 hover:bg-pink-600 sm:flex-[2]"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Doi mat khau moi
                </Button>
              </CardFooter>
            </section>

            <aside className="border-t border-border/70 bg-muted/20 p-6 sm:p-8 dark:bg-black/20 lg:border-l lg:border-t-0">
              <div className="sticky top-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={18} />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                      {t("auto.changePassword_13")}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Su dung toi thieu 8 ky tu",
                      "Ket hop chu HOA, thuong va so",
                      "Them dau cach ky tu dac biet",
                      "Khong dung chung voi app khac",
                      "Thay doi dinh ky 30 ngay/lan",
                    ].map((tip) => (
                      <div key={tip} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-3 dark:border-white/10 dark:bg-[#0B1120]/70">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span className="text-xs font-bold uppercase leading-relaxed tracking-wider text-muted-foreground">
                          {tip}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                        {t("auto.changePassword_14")}
                      </p>
                      <p className="text-xs font-medium leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                        {t("auto.changePassword_15")}
                        <span className="font-bold">{t("auto.changePassword_16")}</span>
                        {t("auto.changePassword_17")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
                    <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                      {t("auto.changePassword_18")}
                      <Link href="/support" className="ml-1 font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400">
                        {t("auto.changePassword_19")}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        </Card>
      </div>
    </main>
  );
}
