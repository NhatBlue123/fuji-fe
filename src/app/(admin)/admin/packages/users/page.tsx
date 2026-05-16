"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetPackageUsersQuery,
  type UserPackage,
} from "@/store/services/admin/packageAdminApi";

const packageStatusLabel = (status: string) => {
  if (status === "ACTIVE") return "Đang dùng";
  if (status === "EXPIRED") return "Hết hạn";
  if (status === "PENDING_SYNC") return "Chờ đồng bộ";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
};

const featureLabel = (featureKey: string) => {
  if (featureKey === "AI_CHAT_BASIC") return "Trò chuyện AI";
  if (featureKey === "AI_CHAT_DEEP") return "Suy luận";
  if (featureKey === "AI_SENSEI_SESSION") return "Buổi Sensei";
  if (featureKey === "FLASHCARD_IMAGE_OPERATION") return "Ảnh thẻ ghi nhớ";
  return featureKey;
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const userDisplayName = (item: UserPackage) =>
  item.fullName || item.username || item.email || "Người dùng";

const userInitial = (item: UserPackage) =>
  userDisplayName(item).trim().charAt(0).toUpperCase() || "U";

function PackageUserCell({ item }: { item: UserPackage }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarImage
          src={item.avatarUrl || undefined}
          alt={userDisplayName(item)}
        />
        <AvatarFallback className="text-xs font-semibold">
          {userInitial(item)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-medium">{userDisplayName(item)}</div>
        <div className="truncate text-xs text-muted-foreground">
          {item.email || item.username || "-"}
        </div>
      </div>
    </div>
  );
}

export default function PackageUsersPage() {
  const { data: users = [] } = useGetPackageUsersQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Người dùng gói hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi gói đang dùng, hạn dùng và trạng thái đồng bộ quyền gói.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng gói</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Gói</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Quyền gói</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <PackageUserCell item={item} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.packageName}</div>
                    <div className="text-xs text-muted-foreground">{item.packageCode}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
                      {packageStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.startsAt)}</TableCell>
                  <TableCell>{formatDateTime(item.expiresAt)}</TableCell>
                  <TableCell className="text-xs">
                    {item.entitlements
                      .map((feature) => `${featureLabel(feature.featureKey)}: ${feature.quotaAmount ?? "-"}`)
                      .join(" | ")}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có người dùng nào mua gói.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
