"use client";

import React, { useMemo, useState } from "react";
import { RefreshCw, RotateCcw, Search } from "lucide-react";
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
  isEnabled,
  quotaSourceLabel,
} from "../helpers";

type FilterState = {
  featureKey: string;
  quotaSource: string;
  userId: string;
  from: string;
  to: string;
  limit: string;
};

const defaultFilters: FilterState = {
  featureKey: "ALL",
  quotaSource: "ALL",
  userId: "",
  from: "",
  to: "",
  limit: "100",
};

export default function AiUsageLogsPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);

  const queryArgs = useMemo(
    () => ({
      featureKey: appliedFilters.featureKey,
      quotaSource: appliedFilters.quotaSource,
      userId: appliedFilters.userId,
      limit: Math.max(1, Math.min(Number(appliedFilters.limit) || 100, 200)),
      from: appliedFilters.from ? `${appliedFilters.from}T00:00:00` : undefined,
      to: appliedFilters.to ? `${appliedFilters.to}T23:59:59` : undefined,
    }),
    [appliedFilters],
  );

  const { data: usage = [], isFetching, isLoading, isError, refetch } = useGetAiUsageQuery(queryArgs);

  const updateFilter = (patch: Partial<FilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử sử dụng AI</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi các lượt đã ghi nhận quota, nguồn dùng và lượt gọi dịch vụ ngoài thật.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Lọc theo tính năng, nguồn quota, ID người dùng và khoảng ngày.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-6" onSubmit={applyFilters}>
            <div className="space-y-2">
              <span className="text-sm font-medium">Tính năng</span>
              <Select value={filters.featureKey} onValueChange={(value) => updateFilter({ featureKey: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tính năng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả tính năng</SelectItem>
                  {AI_FEATURE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Nguồn quota</span>
              <Select value={filters.quotaSource} onValueChange={(value) => updateFilter({ quotaSource: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Nguồn quota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả nguồn</SelectItem>
                  {QUOTA_SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">ID người dùng</span>
              <Input
                inputMode="numeric"
                value={filters.userId}
                onChange={(event) => updateFilter({ userId: event.target.value })}
                placeholder="Ví dụ: 123"
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Từ ngày</span>
              <Input type="date" value={filters.from} onChange={(event) => updateFilter({ from: event.target.value })} />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Đến ngày</span>
              <Input type="date" value={filters.to} onChange={(event) => updateFilter({ to: event.target.value })} />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Số dòng</span>
              <Input
                min={1}
                max={200}
                type="number"
                value={filters.limit}
                onChange={(event) => updateFilter({ limit: event.target.value })}
              />
            </div>
            <div className="flex gap-2 lg:col-span-6">
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Lọc
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Xóa lọc
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Không tải được lịch sử sử dụng AI. Kiểm tra dịch vụ AI-FUJI hoặc quyền admin.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gần nhất</CardTitle>
          <CardDescription>Hiển thị tối đa 200 dòng gần nhất theo bộ lọc.</CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableHead>Mô hình</TableHead>
                <TableHead className="text-right">Token dùng</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usage.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary">#{item.userId}</Badge>
                  </TableCell>
                  <TableCell>{featureLabel(item.featureKey)}</TableCell>
                  <TableCell>{quotaSourceLabel(item.quotaSource)}</TableCell>
                  <TableCell className="text-right">{Number(item.amount || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>{isEnabled(item.providerCalled) ? "Có" : "Không"}</TableCell>
                  <TableCell>{isEnabled(item.cacheHit) ? "Có" : "Không"}</TableCell>
                  <TableCell>{isEnabled(item.success) ? "Có" : "Không"}</TableCell>
                  <TableCell>{item.model || "-"}</TableCell>
                  <TableCell className="text-right">{Number(item.tokensUsed || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                </TableRow>
              ))}
              {usage.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    {isLoading || isFetching ? "Đang tải lịch sử..." : "Không có dữ liệu phù hợp."}
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
