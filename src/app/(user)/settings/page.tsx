"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Globe,
  Monitor,
  Moon,
  Sun,
  Save,
  User,
  Lock,
  ChevronRight,
  Check,
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

const TABS = [
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "language", label: "Ngôn ngữ", icon: Globe },
  { id: "security", label: "Bảo mật", icon: Shield },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("appearance");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [notificationSettings, setNotificationSettings] = useState({
    courseUpdates: true,
    newMessages: true,
    examReminders: true,
    systemAlerts: false,
    emailDigest: false,
  });

  const handleSave = () => {
    toast.success("Đã lưu cài đặt thành công!");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] transition-colors duration-500">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 font-sans">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-pink-500/10 flex items-center justify-center">
            <Settings className="size-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Cài đặt</h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Tùy chỉnh trải nghiệm học tập của bạn</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Sidebar Nav */}
          <nav className="md:w-52 flex-shrink-0 space-y-1">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-2 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-all text-[13px] font-semibold",
                      isActive
                        ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                        : "text-muted-foreground hover:bg-pink-500/5 hover:text-pink-500"
                    )}
                  >
                    <Icon className="size-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Links */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-2 space-y-1 mt-2">
              <p className="px-3 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Liên kết nhanh</p>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full transition-all text-[13px] font-semibold text-muted-foreground hover:bg-pink-500/5 hover:text-pink-500"
              >
                <User className="size-4 flex-shrink-0" />
                Hồ sơ cá nhân
                <ChevronRight className="size-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/profile/change-password"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full transition-all text-[13px] font-semibold text-muted-foreground hover:bg-pink-500/5 hover:text-pink-500"
              >
                <Lock className="size-4 flex-shrink-0" />
                Đổi mật khẩu
                <ChevronRight className="size-3 ml-auto opacity-50" />
              </Link>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 space-y-4">

            {/* === APPEARANCE === */}
            {activeTab === "appearance" && (
              <Card className="rounded-2xl border-border shadow-sm bg-card">
                <CardHeader className="px-6 py-4 border-b border-border/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-pink-500" />
                    Giao diện & Màu sắc
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Chế độ màn hình</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Sáng", icon: Sun },
                      { value: "dark", label: "Tối", icon: Moon },
                      { value: "system", label: "Hệ thống", icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => {
                      const isSelected = theme === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setTheme(value as any)}
                          className={cn(
                            "relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all text-[13px] font-semibold",
                            isSelected
                              ? "border-pink-500 bg-pink-500/5 text-pink-600 dark:text-pink-400 shadow-sm shadow-pink-500/10"
                              : "border-border hover:border-pink-400/40 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          )}
                        >
                          {/* Active check icon */}
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-pink-500 flex items-center justify-center">
                              <Check className="size-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                          <Icon className={cn("size-6", isSelected ? "text-pink-500" : "")} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* === NOTIFICATIONS === */}
            {activeTab === "notifications" && (
              <Card className="rounded-2xl border-border shadow-sm bg-card">
                <CardHeader className="px-6 py-4 border-b border-border/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-pink-500" />
                    Tùy chỉnh thông báo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-1">
                  {[
                    { key: "courseUpdates", label: "Cập nhật khóa học", desc: "Nhận thông báo khi khóa học có bài mới" },
                    { key: "newMessages", label: "Tin nhắn mới", desc: "Thông báo khi có tin nhắn từ giảng viên" },
                    { key: "examReminders", label: "Nhắc lịch thi", desc: "Nhắc nhở trước kỳ thi JLPT" },
                    { key: "systemAlerts", label: "Cảnh báo hệ thống", desc: "Thông báo từ quản trị viên" },
                    { key: "emailDigest", label: "Tóm tắt qua email", desc: "Gửi bản tóm tắt hoạt động hàng tuần" },
                  ].map(({ key, label, desc }, i, arr) => (
                    <div key={key}>
                      <div className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[key as keyof typeof notificationSettings]}
                          onCheckedChange={(v) =>
                            setNotificationSettings((prev) => ({ ...prev, [key]: v }))
                          }
                          className="data-[state=checked]:bg-pink-500"
                        />
                      </div>
                      {i < arr.length - 1 && <Separator className="opacity-30" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* === LANGUAGE === */}
            {activeTab === "language" && (
              <Card className="rounded-2xl border-border shadow-sm bg-card">
                <CardHeader className="px-6 py-4 border-b border-border/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-pink-500" />
                    Ngôn ngữ hiển thị
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ngôn ngữ giao diện</p>
                    <Select
                      value={i18n.language}
                      onValueChange={(val) => {
                        i18n.changeLanguage(val);
                        toast.success("Đã chuyển ngôn ngữ!");
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border text-[13px] font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi" className="text-[13px] font-semibold">🇻🇳 Tiếng Việt</SelectItem>
                        <SelectItem value="en" className="text-[13px] font-semibold">🇺🇸 English</SelectItem>
                        <SelectItem value="ja" className="text-[13px] font-semibold">🇯🇵 日本語</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">Thay đổi ngôn ngữ sẽ áp dụng ngay lập tức cho toàn bộ giao diện.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* === SECURITY === */}
            {activeTab === "security" && (
              <Card className="rounded-2xl border-border shadow-sm bg-card">
                <CardHeader className="px-6 py-4 border-b border-border/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-pink-500" />
                    Bảo mật tài khoản
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-auto justify-between py-3.5 px-4 rounded-xl border-border hover:border-pink-400/50 hover:bg-pink-500/5 transition-all group"
                  >
                    <Link href="/profile/change-password">
                      <div className="text-left">
                        <p className="text-[13px] font-semibold group-hover:text-pink-500 transition-colors">Đổi mật khẩu</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">Cập nhật mật khẩu đăng nhập của bạn</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-pink-500 transition-colors flex-shrink-0" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    disabled
                    className="w-full h-auto justify-between py-3.5 px-4 rounded-xl border-border"
                  >
                    <div className="text-left">
                      <p className="text-[13px] font-semibold">Xác thực 2 yếu tố</p>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">Sắp ra mắt trong phiên bản tiếp theo</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold flex-shrink-0">Sắp có</Badge>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Save Button for notifications */}
            {activeTab === "notifications" && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  size="lg"
                  className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-[13px] shadow-md shadow-pink-500/20 transition-all"
                >
                  <Save className="size-4 mr-2" />
                  Lưu cài đặt
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
