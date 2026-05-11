"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Brain, Cpu, RefreshCw, Route, Timer, Users, Wrench } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type AiUsagePeriod,
  useGetAiUsageSummaryQuery,
  useGetChatbotMetricsQuery,
} from "@/store/services/admin/aiQuotaAdminApi";
import {
  featureLabel,
  formatDate,
  formatDateTime,
  formatNumber,
  formatUsd,
  userDisplayName,
  userInitial,
} from "./helpers";

const chartKeyByFeature: Record<string, string> = {
  AI_CHAT_BASIC: "chat",
  AI_CHAT_DEEP: "deep",
  AI_SENSEI_SESSION: "sensei",
};

const chartLabelByKey: Record<string, string> = {
  chat: "Trò chuyện AI",
  deep: "Suy luận",
  sensei: "Sensei",
};

const periodOptions: Array<{ value: AiUsagePeriod; label: string; title: string }> = [
  { value: "day", label: "Ngày", title: "Lượt gọi theo ngày" },
  { value: "week", label: "Tuần", title: "Lượt gọi theo tuần" },
  { value: "month", label: "Tháng", title: "Lượt gọi theo tháng" },
  { value: "year", label: "Năm", title: "Lượt gọi theo năm" },
];

function formatMs(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "-";
  return `${formatNumber(Math.round(Number(value)))}ms`;
}

function metricRows(data?: Record<string, number>, limit = 6) {
  return Object.entries(data ?? {})
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit);
}

export default function AiUsageOverviewPage() {
  const [chartPeriod, setChartPeriod] = useState<AiUsagePeriod>("day");
  const { data, isFetching, isLoading, isError, refetch } = useGetAiUsageSummaryQuery({ period: chartPeriod });
  const {
    data: chatbotMetrics,
    isFetching: isMetricsFetching,
    refetch: refetchMetrics,
  } = useGetChatbotMetricsQuery({ days: 7 });
  const summary = data?.summary ?? [];
  const topUsers = data?.topUsers ?? [];
  const tokenStats = data?.tokenStats ?? [];
  const tokenTotals = data?.tokenTotals ?? { externalCalls: 0, totalTokens: 0, estimatedCostUsd: 0 };
  const routeRows = metricRows(chatbotMetrics?.routeDistribution);
  const toolRows = metricRows(chatbotMetrics?.toolUsage);
  const workerRows = metricRows(chatbotMetrics?.workerDistribution);
  const failures = chatbotMetrics?.failures;
  const firstToken = chatbotMetrics?.latency?.firstTokenMs;
  const workerLatency = chatbotMetrics?.latency?.workerMs;
  const totalExternalCalls = summary.reduce(
    (total, item) => total + Number(item.externalCalls || 0),
    0,
  );

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    for (const item of data?.byDay ?? []) {
      const periodKey = String(item.periodKey || item.usageDate);
      const row = byDate.get(periodKey) ?? {
        usageDate: String(item.usageDate),
        periodKey,
        label: item.periodLabel || formatDate(item.usageDate),
        chat: 0,
        deep: 0,
        sensei: 0,
      };
      const chartKey = chartKeyByFeature[item.featureKey];
      if (chartKey) row[chartKey] = Number(item.externalCalls || 0);
      byDate.set(periodKey, row);
    }
    return Array.from(byDate.values());
  }, [data?.byDay]);
  const chartTitle = periodOptions.find((item) => item.value === chartPeriod)?.title ?? "Lượt gọi";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Brain className="h-6 w-6" /> AI và quota</h1>
          <p className="text-sm text-muted-foreground">Tổng quan lượt gọi dịch vụ AI trong 30 ngày gần nhất.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetch();
            refetchMetrics();
          }}
          disabled={isFetching || isMetricsFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching || isMetricsFetching ? "animate-spin" : ""}`} />
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

      <div className="grid gap-4 md:grid-cols-4">
        {summary.length === 0 && (isLoading || isFetching)
          ? [0, 1, 2, 3].map((item) => (
              <Card key={item}>
                <CardHeader><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardHeader>
                <CardContent><div className="h-10 w-20 animate-pulse rounded bg-muted" /></CardContent>
              </Card>
            ))
          : (
            <>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Lượt gọi ngoài</CardTitle></CardHeader>
                <CardContent className="text-3xl font-bold">{formatNumber(totalExternalCalls)}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Token hệ thống</CardTitle></CardHeader>
                <CardContent className="text-3xl font-bold">{formatNumber(tokenTotals.totalTokens)}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Chi phí ước tính</CardTitle></CardHeader>
                <CardContent className="text-3xl font-bold">{formatUsd(tokenTotals.estimatedCostUsd)}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Người dùng nổi bật</CardTitle></CardHeader>
                <CardContent className="text-3xl font-bold">{formatNumber(topUsers.length)}</CardContent>
              </Card>
            </>
          )}
        {!isLoading && summary.length === 0 && (
          <Card className="md:col-span-4">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Chưa có lượt gọi dịch vụ AI trong 30 ngày gần nhất.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4" />
              First token p95
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMs(firstToken?.p95)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              p50 {formatMs(firstToken?.p50)} · {formatNumber(firstToken?.count ?? 0)} mẫu
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4" />
              Worker p95
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMs(workerLatency?.p95)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              max {formatMs(workerLatency?.max)} · {formatNumber(workerLatency?.count ?? 0)} mẫu
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Route className="h-4 w-4" />
              Route events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(chatbotMetrics?.events?.total ?? 0)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Cửa sổ {formatNumber(chatbotMetrics?.windowDays ?? 7)} ngày
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Lỗi runtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(failures?.total ?? 0)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Qdrant {formatNumber(failures?.qdrant ?? 0)} · timeout {formatNumber(failures?.openaiTimeout ?? 0)} · quota {formatNumber(failures?.quotaExhausted ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {!chatbotMetrics?.available && (
        <Card className="border-amber-300/50 bg-amber-50/50">
          <CardContent className="py-4 text-sm text-amber-800">
            Chưa đọc được metrics runtime chatbot từ Redis{chatbotMetrics?.reason ? `: ${chatbotMetrics.reason}` : "."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routeRows.map(([route, count]) => (
                  <TableRow key={route}>
                    <TableCell className="font-mono text-xs">{route}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(count)}</TableCell>
                  </TableRow>
                ))}
                {routeRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu route.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tool usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolRows.map(([tool, count]) => (
                  <TableRow key={tool}>
                    <TableCell className="font-mono text-xs">{tool}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(count)}</TableCell>
                  </TableRow>
                ))}
                {toolRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có tool call được ghi nhận.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Worker distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerRows.map(([worker, count]) => (
                  <TableRow key={worker}>
                    <TableCell className="font-mono text-xs">{worker}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(count)}</TableCell>
                  </TableRow>
                ))}
                {workerRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có worker event.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="gap-3 md:flex md:flex-row md:items-center md:justify-between">
            <CardTitle>{chartTitle}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={chartPeriod === option.value ? "default" : "outline"}
                  onClick={() => setChartPeriod(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Chưa đủ dữ liệu để vẽ biểu đồ.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend formatter={(value) => chartLabelByKey[String(value)] ?? value} />
                    <Line type="monotone" dataKey="chat" stroke="#2563eb" strokeWidth={2} dot={false} name="chat" />
                    <Line type="monotone" dataKey="deep" stroke="#7c3aed" strokeWidth={2} dot={false} name="deep" />
                    <Line type="monotone" dataKey="sensei" stroke="#059669" strokeWidth={2} dot={false} name="sensei" />
                  </LineChart>
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
                  <TableHead>Người dùng</TableHead>
                  <TableHead className="text-right">Lượt gọi</TableHead>
                  <TableHead className="text-right">Token</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((item) => (
                  <TableRow key={item.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={item.avatarUrl || ""} alt={userDisplayName(item)} />
                          <AvatarFallback>{userInitial(item)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{userDisplayName(item)}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.username ? `@${item.username}` : item.email || `#${item.userId}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(item.externalCalls)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.totalTokens)}
                    </TableCell>
                  </TableRow>
                ))}
                {topUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
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
            <TableHeader>
              <TableRow>
                <TableHead>Tính năng</TableHead>
                <TableHead>Lượt gọi dịch vụ ngoài</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Tỷ trọng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((item) => {
                const calls = Number(item.externalCalls || 0);
                const ratio = totalExternalCalls ? Math.round((calls / totalExternalCalls) * 100) : 0;
                return (
                  <TableRow key={item.featureKey}>
                    <TableCell>{featureLabel(item.featureKey)}</TableCell>
                    <TableCell>{formatNumber(calls)}</TableCell>
                    <TableCell>{formatNumber(item.totalTokens)}</TableCell>
                    <TableCell>{ratio}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Token theo model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tính năng</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Lượt gọi</TableHead>
                <TableHead className="text-right">Token</TableHead>
                <TableHead className="text-right">Ước tính</TableHead>
                <TableHead>Lần cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokenStats.map((item) => (
                <TableRow key={`${item.featureKey}-${item.model}`}>
                  <TableCell>{featureLabel(item.featureKey)}</TableCell>
                  <TableCell className="font-mono text-xs">{item.model || "unknown"}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.externalCalls)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatNumber(item.totalTokens)}</TableCell>
                  <TableCell className="text-right">{formatUsd(item.estimatedCostUsd)}</TableCell>
                  <TableCell>{formatDateTime(item.lastUsedAt)}</TableCell>
                </TableRow>
              ))}
              {tokenStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có token được ghi nhận.
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
