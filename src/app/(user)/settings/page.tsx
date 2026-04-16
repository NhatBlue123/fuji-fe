"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Palette,
  Bell,
  Globe,
  Moon,
  Sun,
  Save,
  User,
  Lock,
  ChevronRight,
  Check,
  Info,
  LifeBuoy,
  MessageCircle,
  HelpCircle,
  Bug,
  HeartHandshake,
  Sparkles,
  Shield,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { toast } from "sonner";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { useGetMePreferencesQuery, useUpdateMePreferencesMutation } from "@/store/services/user/userPreferenceApi";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("appearance");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const TABS = useMemo(() => [
    { id: "appearance", label: t("settings.tabs.appearance"), icon: Palette },
    { id: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
    { id: "language", label: t("settings.tabs.language"), icon: Globe },
    { id: "security", label: t("settings.tabs.security"), icon: Shield },
    { id: "support", label: t("settings.tabs.support"), icon: LifeBuoy },
  ], [t]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, TABS]);

  const { data: prefs, isLoading: isPrefsLoading } = useGetMePreferencesQuery();
  const [updatePrefs, { isLoading: isUpdating }] = useUpdateMePreferencesMutation();

  const [notificationSettings, setNotificationSettings] = useState({
    courseUpdates: true,
    newMessages: true,
    examReminders: true,
    bookingReminders: true,
    systemAlerts: true,
    emailDigest: false,
  });

  useEffect(() => {
    if (prefs) {
      setNotificationSettings({
        courseUpdates: prefs.courseUpdates ?? true,
        newMessages: prefs.newMessages ?? true,
        examReminders: prefs.examReminders ?? true,
        bookingReminders: prefs.bookingReminders ?? true,
        systemAlerts: prefs.systemAlerts ?? true,
        emailDigest: prefs.emailDigest ?? false,
      });
    }
  }, [prefs]);

  const handleSave = async () => {
    try {
      await updatePrefs(notificationSettings).unwrap();
      toast.success(t("settings.notifications.saveSuccess") || "Đã lưu cài đặt thành công!");
    } catch (err) {
      toast.error(t("settings.notifications.saveError") || "Không thể lưu cài đặt. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500 selection:bg-pink-500/30 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-pink-500/10 dark:bg-pink-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-muted/50 pb-8">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-[1.25rem] bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-inner">
              <Settings className="size-7 text-pink-500" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground dark:text-white drop-shadow-sm">
                {t("settings.page.title_part1")} <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">{t("settings.page.title_part2")}</span>
              </h1>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {t("settings.page.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Nav */}
          <nav className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2rem] p-4 space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-muted/50 dark:border-white/5 mb-2">
                {t("settings.sidebar.category")}
              </p>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl text-left w-full transition-all text-xs font-black uppercase tracking-widest",
                      isActive
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                        : "text-muted-foreground dark:text-slate-400 hover:bg-pink-500/10 hover:text-pink-500 dark:hover:text-pink-400"
                    )}
                  >
                    <Icon className="size-4 flex-shrink-0" strokeWidth={2.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Links */}
            <div className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2rem] p-4 space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-muted/50 dark:border-white/5 mb-2">
                {t("settings.sidebar.shortcuts")}
              </p>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-4 rounded-xl w-full transition-all text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-500"
              >
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-500">
                  <User className="size-4 flex-shrink-0" strokeWidth={2.5} />
                </div>
                {t("profile.badge")}
                <ChevronRight className="size-3 ml-auto opacity-50" strokeWidth={3} />
              </Link>
              <Link
                href="/profile/change-password"
                className="flex items-center gap-3 px-4 py-4 rounded-xl w-full transition-all text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 hover:bg-amber-500/10 hover:text-amber-500"
              >
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                  <Lock className="size-4 flex-shrink-0" strokeWidth={2.5} />
                </div>
                {t("profile.actions.security")}
                <ChevronRight className="size-3 ml-auto opacity-50" strokeWidth={3} />
              </Link>
            </div>
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">

            {/* === APPEARANCE === */}
            {activeTab === "appearance" && (
              <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted dark:border-white/5 bg-muted/20 dark:bg-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-pink-500">
                    <Palette className="size-5" />
                    {t("settings.appearance.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-[11px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">
                    {t("settings.appearance.mode")}
                  </p>
                  {!mounted ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-20">
                       <div className="h-40 rounded-[1.5rem] bg-muted animate-pulse" />
                       <div className="h-40 rounded-[1.5rem] bg-muted animate-pulse" />
                       <div className="h-40 rounded-[1.5rem] bg-muted animate-pulse" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[
                        { value: "light", label: t("settings.appearance.light"), icon: Sun, color: "hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-amber-500/10" },
                        { value: "dark", label: t("settings.appearance.dark"), icon: Moon, color: "hover:text-indigo-400 hover:border-indigo-400/40 hover:bg-indigo-400/10 hover:shadow-indigo-500/10" },
                        { value: "system", label: t("settings.appearance.system"), icon: Monitor, color: "hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:shadow-emerald-500/10" },
                      ].map(({ value, label, icon: Icon, color }) => {
                        const isSelected = theme === value;
                        return (
                          <button
                            key={value}
                            onClick={() => setTheme(value as any)}
                            className={cn(
                              "relative flex flex-col items-center gap-4 p-8 rounded-[1.5rem] border-2 transition-all duration-300 text-xs font-black uppercase tracking-widest shadow-inner",
                              isSelected
                                ? "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 shadow-md shadow-pink-500/20 scale-[1.02]"
                                : `border-muted dark:border-white/10 dark:bg-black/20 text-muted-foreground dark:text-slate-400 ${color}`
                            )}
                          >
                            {/* Active check icon */}
                            {isSelected && (
                              <div className="absolute top-4 right-4 size-6 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                                <Check className="size-3.5 text-white" strokeWidth={3.5} />
                              </div>
                            )}
                            <div className={cn("p-4 rounded-2xl border bg-background shadow-sm transition-colors", isSelected ? "border-pink-500/30 text-pink-500" : "border-muted dark:border-white/10 dark:bg-white/5")}>
                              <Icon className="size-8" strokeWidth={2} />
                            </div>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* === NOTIFICATIONS === */}
            {activeTab === "notifications" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="px-8 py-6 border-b border-muted dark:border-white/5 bg-muted/20 dark:bg-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-pink-500">
                      <Bell className="size-5" />
                      {t("settings.notifications.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-1">
                      {[
                        { key: "courseUpdates", label: t("settings.notifications.items.courseUpdates.label"), desc: t("settings.notifications.items.courseUpdates.desc"), color: "text-blue-500" },
                        { key: "newMessages", label: t("settings.notifications.items.newMessages.label"), desc: t("settings.notifications.items.newMessages.desc"), color: "text-emerald-500" },
                        { key: "examReminders", label: t("settings.notifications.items.examReminders.label"), desc: t("settings.notifications.items.examReminders.desc"), color: "text-amber-500" },
                        { key: "bookingReminders", label: t("settings.notifications.items.bookingReminders.label"), desc: t("settings.notifications.items.bookingReminders.desc"), color: "text-orange-500" },
                        { key: "systemAlerts", label: t("settings.notifications.items.systemAlerts.label"), desc: t("settings.notifications.items.systemAlerts.desc"), color: "text-rose-500" },
                        { key: "emailDigest", label: t("settings.notifications.items.emailDigest.label"), desc: t("settings.notifications.items.emailDigest.desc"), color: "text-purple-500" },
                      ].map(({ key, label, desc, color }, i, arr) => (
                        <div key={key}>
                          <div className="flex items-center justify-between py-5 group hover:bg-muted/30 dark:hover:bg-white/5 px-4 rounded-2xl transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={cn("size-2 rounded-full", notificationSettings[key as keyof typeof notificationSettings] ? color : "bg-muted dark:bg-white/10")} />
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-foreground dark:text-white">{label}</p>
                                <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-400 mt-1">{desc}</p>
                              </div>
                            </div>
                            <Switch
                              checked={notificationSettings[key as keyof typeof notificationSettings]}
                              onCheckedChange={(v) =>
                                setNotificationSettings((prev) => ({ ...prev, [key]: v }))
                              }
                              className="data-[state=checked]:bg-pink-500 scale-110"
                            />
                          </div>
                          {i < arr.length - 1 && <Separator className="opacity-50 dark:opacity-20 mx-4 w-auto" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end pr-2">
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating || isPrefsLoading}
                    className="h-14 px-8 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-pink-500/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Save className="size-5" />
                    )}
                    {isUpdating ? t("settings.notifications.saving") : t("settings.notifications.save")}
                  </Button>
                </div>
              </div>
            )}

            {/* === LANGUAGE === */}
            {activeTab === "language" && (
              <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
                <CardHeader className="px-8 py-6 border-b border-muted dark:border-white/5 bg-muted/20 dark:bg-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-cyan-500">
                    <Globe className="size-5" />
                    {t("settings.language.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 ml-1">
                      {t("settings.language.display")}
                    </label>
                    {mounted ? (
                      <Select
                        value={i18n.language}
                        onValueChange={(val) => {
                          i18n.changeLanguage(val);
                          toast.success(t("settings.language.changeSuccess"));
                        }}
                      >
                        <SelectTrigger className="h-16 rounded-2xl bg-muted/40 dark:bg-black/20 border-muted dark:border-white/5 focus:ring-cyan-500/30 text-xs font-black uppercase tracking-widest shadow-inner px-6 text-foreground dark:text-white">
                          <SelectValue placeholder={t("settings.language.placeholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-background dark:bg-[#0f1218] border border-muted dark:border-white/10 rounded-2xl shadow-2xl p-2">
                          <SelectItem value="vi" className="text-xs font-black uppercase tracking-widest py-4 px-4 hover:bg-cyan-500/10 focus:bg-cyan-500/10 focus:text-cyan-500 rounded-xl cursor-pointer transition-colors">🇻🇳 Tiếng Việt</SelectItem>
                          <SelectItem value="en" className="text-xs font-black uppercase tracking-widest py-4 px-4 hover:bg-cyan-500/10 focus:bg-cyan-500/10 focus:text-cyan-500 rounded-xl cursor-pointer transition-colors">🇺🇸 English</SelectItem>
                          <SelectItem value="ja" className="text-xs font-black uppercase tracking-widest py-4 px-4 hover:bg-cyan-500/10 focus:bg-cyan-500/10 focus:text-cyan-500 rounded-xl cursor-pointer transition-colors">🇯🇵 日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-16 w-full rounded-2xl bg-muted/40 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="p-5 rounded-2xl border bg-cyan-500/5 dark:bg-black/20 flex items-start gap-4 border-cyan-500/20 shadow-inner">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                      <Info className="size-5 text-cyan-500" />
                    </div>
                    <div className="space-y-1 mt-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">{t("settings.language.infoTitle")}</p>
                      <p className="text-[11px] font-bold text-muted-foreground dark:text-slate-400">
                        {t("settings.language.infoDesc")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
                <CardHeader className="px-8 py-6 border-b border-muted dark:border-white/5 bg-muted/20 dark:bg-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-amber-500">
                    <Shield className="size-5" />
                    {t("settings.security.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-5">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-auto justify-between p-6 rounded-[1.5rem] border-muted dark:border-white/10 dark:bg-black/20 hover:border-amber-500/50 hover:bg-amber-500/10 hover:shadow-lg shadow-amber-500/20 transition-all group shadow-inner"
                  >
                    <Link href="/profile/change-password">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-muted dark:bg-white/5 border border-muted dark:border-white/10 group-hover:bg-amber-500/20 group-hover:text-amber-500 group-hover:border-amber-500/30 flex items-center justify-center transition-all">
                          <Lock className="size-5 text-muted-foreground dark:text-slate-400 group-hover:text-amber-500" />
                        </div>
                        <div className="text-left space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest text-foreground dark:text-white group-hover:text-amber-500 transition-colors">{t("settings.security.resetPassword")}</p>
                          <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase">{t("settings.security.resetPasswordDesc")}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-6 text-muted-foreground group-hover:text-amber-500 transition-colors flex-shrink-0" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    disabled
                    className="w-full h-auto justify-between p-6 rounded-[1.5rem] border-muted dark:border-white/5 dark:bg-black/40 opacity-70"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-muted/50 dark:bg-white/5 flex items-center justify-center">
                        <Monitor className="size-5 text-muted-foreground" />
                      </div>
                      <div className="text-left space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-foreground dark:text-slate-300">{t("settings.security.twoFactor")}</p>
                        <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase">{t("settings.security.twoFactorDesc")}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted dark:bg-white/5 border-muted dark:border-white/10 px-3 py-1">{t("settings.security.comingSoon")}</Badge>
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "support" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="px-8 py-6 border-b border-muted dark:border-white/5 bg-muted/20 dark:bg-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-secondary">
                      <LifeBuoy className="size-5" />
                      {t("settings.support.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-[1.5rem] bg-muted/20 border border-muted dark:border-white/5 space-y-4 hover:border-secondary/30 transition-all group">
                        <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                          <HelpCircle className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-tight text-foreground">{t("settings.support.helpCenter")}</h4>
                          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                            {t("settings.support.helpCenterDesc")}
                          </p>
                        </div>
                        <Button asChild className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] bg-secondary/10 hover:bg-secondary/20 text-secondary border-none h-10">
                          <Link href="/help">{t("settings.support.accessNow")}</Link>
                        </Button>
                      </div>

                      <div className="p-5 rounded-[1.5rem] bg-muted/20 border border-muted dark:border-white/5 space-y-4 hover:border-indigo-500/30 transition-all group">
                        <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                          <Bug className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-tight text-foreground">{t("settings.support.reportBug")}</h4>
                          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                            {t("settings.support.reportBugDesc")}
                          </p>
                        </div>
                        <Button 
                          className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20 h-10"
                          onClick={() => setIsFeedbackOpen(true)}
                        >
                          {t("settings.support.reportNow")}
                        </Button>
                      </div>
                    </div>

                    <Separator className="opacity-50 dark:opacity-20" />

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("settings.support.contactChannels")}</p>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { label: t("settings.support.channels.hotline"), value: "1900 8888", icon: HeartHandshake, color: "text-amber-500" },
                          { label: t("settings.support.channels.email"), value: "support@fuji.edu.vn", icon: MessageCircle, color: "text-pink-500" },
                          { label: t("settings.support.channels.messenger"), value: "fb.com/fuji.jlpt", icon: Sparkles, color: "text-blue-500" },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-muted/30 border border-muted/50">
                              <Icon className={cn("size-4", item.color)} />
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                                <p className="text-xs font-bold text-foreground">{item.value}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      <FeedbackDialog isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
