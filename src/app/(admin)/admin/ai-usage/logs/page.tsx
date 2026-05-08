"use client";

import React, { useMemo, useState } from "react";
import { RefreshCw, RotateCcw, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAiUsageQuery } from "@/store/services/admin/aiQuotaAdminApi";
import {
  AI_FEATURE_OPTIONS,
  QUOTA_SOURCE_OPTIONS,
  featureLabel,
  formatDateTime,
  formatNumber,
  formatUsd,
  isEnabled,
  quotaSourceLabel,
  userDisplayName,
  userInitial,
} from "../helpers";

type FilterState = {
  keyword: string;
  featureKey: string;
  quotaSource: string;
  from: string;
  to: string;
  limit: string;
};

const defaultFilters: FilterState = {
  keyword: "",
  featureKey: "ALL",
  quotaSource: "ALL",
  from: "",
  to: "",
  limit: "100",
};

const statusText = (value: boolean | number | undefined | null, yes: string, no: string) =>
  isEnabled(value) ? yes : no;

export default function AiUsageLogsPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const queryArgs = useMemo(
    () => ({
      keyword: filters.keyword,
      featureKey: filters.featureKey,
      quotaSource: filters.quotaSource,
      limit: Math.max(1, Math.min(Number(filters.limit) || 100, 200)),
      from: filters.from ? `${filters.from}T00:00:00` : undefined,
      to: filters.to ? `${filters.to}T23:59:59` : undefined,
    }),
    [filters],
  );

  const { data, isFetching, isLoading, isError, refetch } = useGetAiUsageQuery(queryArgs);
  const usage = useMemo(() => data?.usage ?? [], [data?.usage]);
  const tokenStats = data?.tokenStats ?? [];
  const tokenTotals = data?.tokenTotals ?? { externalCalls: 0, totalTokens: 0, estimatedCostUsd: 0 };

  const activeUsers = useMemo(
    () => new Set(usage.map((item) => item.userId).filter(Boolean)).size,
    [usage],
  );

  const updateFilter = (patch: Partial<FilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử sử dụng AI</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi người dùng, lượt gọi dịch vụ ngoài, token thực tế đã ghi nhận và chi phí ước tính.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,2fr)_repeat(5,minmax(140px,1fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.keyword}
              onChange={(event) => updateFilter({ keyword: event.target.value })}
              placeholder="Tìm tên, email, mã học viên hoặc ID..."
              className="pl-9"
            />
          </div>
          <Select value={filters.featureKey} onValueChange={(value) => updateFilter({ featureKey: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Tính năng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả tính năng</SelectItem>
              {AI_FEATURE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.quotaSource} onValueChange={(value) => updateFilter({ quotaSource: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Nguồn quota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nguồn</SelectItem>
              {QUOTA_SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={filters.from} onChange={(event) => updateFilter({ from: event.target.value })} />
          <Input type="date" value={filters.to} onChange={(event) => updateFilter({ to: event.target.value })} />
          <Input
            min={1}
            max={200}
            type="number"
            value={filters.limit}
            onChange={(event) => updateFilter({ limit: event.target.value })}
            aria-label="Số dòng"
          />
          <Button type="button" variant="outline" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Xóa lọc
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Không tải được lịch sử sử dụng AI. Kiểm tra dịch vụ AI-FUJI hoặc quyền admin.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Token hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNumber(tokenTotals.totalTokens)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chi phí ước tính</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatUsd(tokenTotals.estimatedCostUsd)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lượt gọi ngoài</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNumber(tokenTotals.externalCalls)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Người dùng trong kết quả</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNumber(activeUsers)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ước tính token theo AI</CardTitle>
          <CardDescription>Nhóm theo tính năng và model từ các log đang khớp bộ lọc.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tính năng</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Lượt gọi</TableHead>
                  <TableHead className="text-right">Token thực tế</TableHead>
                  <TableHead className="text-right">Token TB</TableHead>
                  <TableHead className="text-right">Ước tính USD</TableHead>
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
                    <TableCell className="text-right">{formatNumber(item.avgTokens)}</TableCell>
                    <TableCell className="text-right">{formatUsd(item.estimatedCostUsd)}</TableCell>
                    <TableCell>{formatDateTime(item.lastUsedAt)}</TableCell>
                  </TableRow>
                ))}
                {tokenStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      {isLoading || isFetching ? "Đang tải thống kê token..." : "Chưa có token được ghi nhận theo bộ lọc."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log gần nhất</CardTitle>
          <CardDescription>Hiển thị tối đa 200 dòng gần nhất theo bộ lọc.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Tính năng</TableHead>
                  <TableHead>Nguồn quota</TableHead>
                  <TableHead className="text-right">Số lượt</TableHead>
                  <TableHead>Gọi ngoài</TableHead>
                  <TableHead>Cache</TableHead>
                  <TableHead>Thành công</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Token</TableHead>
                  <TableHead className="text-right">Ước tính</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={item.avatarUrl || ""} alt={userDisplayName(item)} />
                          <AvatarFallback>{userInitial(item)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{userDisplayName(item)}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.username ? `@${item.username}` : item.email || "Chưa có email"}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="secondary">#{item.userId}</Badge>
                            {item.identificationCode && <Badge variant="outline">{item.identificationCode}</Badge>}
                            {item.role && <Badge variant="outline">{item.role}</Badge>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{featureLabel(item.featureKey)}</TableCell>
                    <TableCell>{quotaSourceLabel(item.quotaSource)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.amount)}</TableCell>
                    <TableCell>{statusText(item.providerCalled, "Có", "Không")}</TableCell>
                    <TableCell>{statusText(item.cacheHit, "Có", "Không")}</TableCell>
                    <TableCell>
                      <Badge variant={isEnabled(item.success) ? "default" : "destructive"}>
                        {statusText(item.success, "OK", "Lỗi")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.model || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(item.tokensUsed)}</TableCell>
                    <TableCell className="text-right">{formatUsd(item.estimatedCostUsd)}</TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {usage.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                      {isLoading || isFetching ? "Đang tải lịch sử..." : "Không có dữ liệu phù hợp."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
