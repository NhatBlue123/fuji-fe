"use client";

import React, { useState } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bell, Send, Users, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { UserSearchCombobox } from "@/components/admin/notifications/UserSearchCombobox";

export default function NotificationsPage() {
  const [notificationType, setNotificationType] = useState<"global" | "specific">("global");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("system");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    if (notificationType === "specific" && !selectedUserId) {
      toast.error("Vui lòng chọn người dùng");
      return;
    }

    setIsSending(true);
    try {
      const response = await api.post("/notifications/admin/send", {
        title: title.trim(),
        content: content.trim(),
        type,
        linkUrl: linkUrl.trim() || null,
        userId: notificationType === "specific" ? selectedUserId : null,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Đã gửi thông báo thành công");
        // Reset form
        setTitle("");
        setContent("");
        setLinkUrl("");
        setSelectedUserId(null);
      } else {
        toast.error(response.data.error || "Gửi thông báo thất bại");
      }
    } catch (error) {
      console.error("Send notification error:", error);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error
          : "Không thể gửi thông báo";
      toast.error(errorMessage || "Không thể gửi thông báo");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gửi thông báo</h1>
          <p className="text-muted-foreground mt-1">
            Gửi thông báo realtime đến người dùng hoặc toàn bộ hệ thống
          </p>
        </div>
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold uppercase">
              Thông báo toàn cục
            </CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gửi đến tất cả</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Thông báo sẽ được gửi đến tất cả người dùng đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-semibold uppercase">
              Thông báo cá nhân
            </CardDescription>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gửi đến 1 người</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Tìm kiếm và gửi thông báo đến người dùng cụ thể
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Form */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Tạo thông báo mới
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Notification Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Loại gửi</Label>
            <RadioGroup
              value={notificationType}
              onValueChange={(value) => setNotificationType(value as "global" | "specific")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="global" id="global" />
                <Label htmlFor="global" className="font-normal cursor-pointer">
                  Gửi toàn cục (tất cả người dùng)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" className="font-normal cursor-pointer">
                  Gửi đến người dùng cụ thể
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* User Search (only for specific) */}
          {notificationType === "specific" && (
            <div className="space-y-2">
              <Label htmlFor="user" className="text-sm font-semibold">
                Chọn người dùng <span className="text-destructive">*</span>
              </Label>
              <UserSearchCombobox value={selectedUserId} onChange={setSelectedUserId} />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Tiêu đề <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề thông báo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{title.length}/200 ký tự</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-semibold">
              Nội dung <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Nhập nội dung thông báo..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{content.length}/1000 ký tự</p>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-semibold">
              Loại thông báo
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Hệ thống</SelectItem>
                <SelectItem value="course">Khóa học</SelectItem>
                <SelectItem value="reminder">Nhắc nhở</SelectItem>
                <SelectItem value="security">Bảo mật</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="linkUrl" className="text-sm font-semibold">
              Link URL (tùy chọn)
            </Label>
            <Input
              id="linkUrl"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Link sẽ được mở khi người dùng click vào thông báo
            </p>
          </div>

          {/* Send Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSend} disabled={isSending} className="gap-2">
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi thông báo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
