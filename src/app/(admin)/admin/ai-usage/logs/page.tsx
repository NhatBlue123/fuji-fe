"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAiUsageQuery } from "@/store/services/admin/aiQuotaAdminApi";

const featureLabel = (featureKey: string) => {
  if (featureKey === "AI_CHAT_BASIC") return "Trò chuyện AI";
  if (featureKey === "AI_CHAT_DEEP") return "Giải thích chuyên sâu";
  if (featureKey === "AI_SENSEI_SESSION") return "Buổi Sensei";
  return featureKey;
};

const quotaSourceLabel = (source: string) => {
  if (source === "DAILY") return "Quota ngày";
  if (source === "SYSTEM_PACKAGE") return "Gói hệ thống";
  if (source === "PACK") return "Gói mua thêm";
  if (source === "FREE") return "Miễn phí";
  return source;
};

export default function AiUsageLogsPage() {
  const { data: usage = [] } = useGetAiUsageQuery();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Lịch sử sử dụng AI</h1>
      <Card>
        <CardHeader><CardTitle>Gần nhất</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Tính năng</TableHead><TableHead>Nguồn quota</TableHead><TableHead>Mô hình</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader>
            <TableBody>
              {usage.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.userId}</TableCell>
                  <TableCell>{featureLabel(item.featureKey)}</TableCell>
                  <TableCell>{quotaSourceLabel(item.quotaSource)}</TableCell>
                  <TableCell>{item.model || "-"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString("vi-VN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
