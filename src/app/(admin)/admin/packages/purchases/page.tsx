"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetPackagePurchasesQuery } from "@/store/services/admin/packageAdminApi";

const packageStatusLabel = (status: string) => {
  if (status === "ACTIVE") return "Đang dùng";
  if (status === "EXPIRED") return "Hết hạn";
  if (status === "PENDING_SYNC") return "Chờ đồng bộ";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
};

export default function PackagePurchasesPage() {
  const { data: purchases = [] } = useGetPackagePurchasesQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử mua gói</h1>
        <p className="text-sm text-muted-foreground">
          Các lần mua gói gần nhất và trạng thái cấp quyền.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giao dịch mua gói</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Gói</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Tự gia hạn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.packageName}</div>
                    <div className="text-xs text-muted-foreground">{item.packageCode}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
                      {packageStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(item.startsAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>{new Date(item.expiresAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>{item.autoRenew ? "Có" : "Không"}</TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có giao dịch mua gói.
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
