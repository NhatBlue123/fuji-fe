"use client";

import React, { useMemo } from "react";
import { Brain, RefreshCw, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAiUsageSummaryQuery } from "@/store/services/admin/aiQuotaAdminApi";
import { featureLabel, formatDate } from "./helpers";

const chartKeyByFeature: Record<string, string> = {
  AI_CHAT_BASIC: "chat",
  AI_CHAT_DEEP: "deep",
  AI_SENSEI_SESSION: "sensei",
};

const chartLabelByKey: Record<string, string> = {
  chat: "Trò chuyện AI",
  deep: "Giải thích sâu",
  sensei: "Sensei",
};

export default function AiUsageOverviewPage() {
  const { data, isFetching, isLoading, isError, refetch } = useGetAiUsageSummaryQuery();
  const summary = data?.summary ?? [];
  const topUsers = data?.topUsers ?? [];
  const totalExternalCalls = summary.reduce(
    (total, item) => total + Number(item.externalCalls || 0),
    0,
  );

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    for (const item of data?.byDay ?? []) {
      const rawDate = String(item.usageDate);
      const row = byDate.get(rawDate) ?? {
        usageDate: rawDate,
        label: formatDate(rawDate),
        chat: 0,
        deep: 0,
        sensei: 0,
      };
      const chartKey = chartKeyByFeature[item.featureKey];
      if (chartKey) row[chartKey] = Number(item.externalCalls || 0);
      byDate.set(rawDate, row);
    }
    return Array.from(byDate.values());
  }, [data?.byDay]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Brain className="h-6 w-6" /> AI và quota</h1>
          <p className="text-sm text-muted-foreground">Tổng quan lượt gọi dịch vụ AI trong 30 ngày gần nhất.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Không tải được dữ liệu AI quota. Kiểm tra dịch vụ AI-FUJI hoặc quyền admin.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {summary.length === 0 && (isLoading || isFetching)
          ? [0, 1, 2].map((item) => (
              <Card key={item}>
                <CardHeader><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardHeader>
                <CardContent><div className="h-10 w-20 animate-pulse rounded bg-muted" /></CardContent>
              </Card>
            ))
          : summary.map((item) => (
          <Card key={item.featureKey}>
            <CardHeader><CardTitle className="text-sm">{featureLabel(item.featureKey)}</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{Number(item.externalCalls || 0).toLocaleString()}</CardContent>
          </Card>
        ))}
        {!isLoading && summary.length === 0 && (
          <Card className="md:col-span-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Chưa có lượt gọi dịch vụ AI trong 30 ngày gần nhất.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lượt gọi theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Chưa đủ dữ liệu để vẽ biểu đồ.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend formatter={(value) => chartLabelByKey[String(value)] ?? value} />
                    <Bar dataKey="chat" stackId="ai" fill="#2563eb" name="chat" />
                    <Bar dataKey="deep" stackId="ai" fill="#7c3aed" name="deep" />
                    <Bar dataKey="sensei" stackId="ai" fill="#059669" name="sensei" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Người dùng gọi nhiều
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID người dùng</TableHead>
                  <TableHead className="text-right">Lượt gọi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((item) => (
                  <TableRow key={item.userId}>
                    <TableCell>
                      <Badge variant="secondary">#{item.userId}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(item.externalCalls || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {topUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tổng hợp theo tính năng</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Tính năng</TableHead><TableHead>Lượt gọi dịch vụ ngoài</TableHead><TableHead>Tỷ trọng</TableHead></TableRow></TableHeader>
            <TableBody>
              {summary.map((item) => {
                const calls = Number(item.externalCalls || 0);
                const ratio = totalExternalCalls ? Math.round((calls / totalExternalCalls) * 100) : 0;
                return (
                  <TableRow key={item.featureKey}>
                    <TableCell>{featureLabel(item.featureKey)}</TableCell>
                    <TableCell>{calls.toLocaleString()}</TableCell>
                    <TableCell>{ratio}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
