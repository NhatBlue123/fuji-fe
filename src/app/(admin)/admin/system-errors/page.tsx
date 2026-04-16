"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  useGetSystemErrorLogsQuery, 
  useGetSystemErrorSummaryQuery
} from "@/store/services/adminSystemErrorApi";
import { 
  Bug, 
  RefreshCw, 
  Clock, 
  Activity,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemErrorFilter } from "@/components/admin/system-errors/SystemErrorFilter";
import { SystemErrorTable } from "@/components/admin/system-errors/SystemErrorTable";
import { SystemErrorDetailSheet } from "@/components/admin/system-errors/SystemErrorDetailSheet";
import { useTranslation } from "react-i18next";

/**
 * Trang quản lý lỗi hệ thống cho ADMIN.
 * Luồng hệ thống:
 * 1. Capture: Lỗi phát sinh tại Backend được GlobalExceptionHandler bắt và lưu vào DB kèm Request ID.
 * 2. Monitor: Admin theo dõi lỗi qua giao diện này, có thể toggle Auto-refresh để cập nhật lỗi mới nhất.
 * 3. Investigate: Admin xem chi tiết stack trace, path, context user để tìm nguyên nhân.
 * 4. Resolve: Admin đánh dấu đã xử lý và ghi chú lại cách khắc phục.
 * 
 * Giao diện đồng bộ với Chat Moderation.
 */
export default function SystemErrorPage() {
  const { t } = useTranslation();

  const [tab, setTab] = useState("all-logs");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Bộ lọc nâng cao
  const [filters, setFilters] = useState({
    level: "all",
    service: "all",
    keyword: "",
    resolved: "all" as any,
    requestId: ""
  });

  const [activeFilters, setActiveFilters] = useState(filters);

  // debounce cho realtime filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveFilters(filters);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  // APIs
  const { 
    data: logsData, 
    isLoading: isLogsLoading, 
    refetch: refetchLogs,
    isFetching: isLogsFetching 
  } = useGetSystemErrorLogsQuery({
    page,
    size,
    sortBy: "createdAt",
    sortDir: "desc",
    level: activeFilters.level === "all" ? undefined : activeFilters.level,
    service: activeFilters.service === "all" ? undefined : activeFilters.service,
    resolved: activeFilters.resolved === "all" ? undefined : (activeFilters.resolved === "true"),
    keyword: activeFilters.keyword.trim() || undefined,
    requestId: activeFilters.requestId.trim() || undefined,
  });

  const { data: summaryData, refetch: refetchSummary } = useGetSystemErrorSummaryQuery();

  const handleRefresh = useCallback(() => {
    refetchLogs();
    refetchSummary();
  }, [refetchLogs, refetchSummary]);

  // Logic tự động làm mới lỗi mới
  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  const handleOpenDetail = (id: number) => {
    setSelectedErrorId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Tiêu đề & Icon đồng bộ Chat Moderation */}
      <div className="flex items-center gap-2">
        <Bug className="h-5 w-5" />
        <h1 className="text-2xl font-bold">{t("admin.systemErrors.title")}</h1>
      </div>

      {/* Thống kê nhanh (Cards tối giản) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("admin.systemErrors.summary.total24h"), value: summaryData?.data?.total24h, sub: t("admin.systemErrors.summary.total24hDesc"), icon: Bug },
          { label: t("admin.systemErrors.summary.unresolved"), value: summaryData?.data?.unresolved, sub: t("admin.systemErrors.summary.unresolvedDesc"), icon: Clock },
          { label: t("admin.systemErrors.summary.stability"), value: "98.5%", sub: t("admin.systemErrors.summary.stabilityDesc"), icon: Activity },
          { label: t("admin.systemErrors.summary.impactArea"), value: "Backend-API", sub: t("admin.systemErrors.summary.impactAreaDesc"), icon: ShieldAlert }
        ].map((item, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">{item.label}</CardDescription>
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{item.value ?? 0}</div>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => {
        setTab(v);
        setPage(0);
        // Khi chuyển sang tab "Dành cho Admin xử lý", tự động đặt filter resolved = false
        if (v === "unresolved") {
          setFilters(prev => ({ ...prev, resolved: "false" }));
          setActiveFilters(prev => ({ ...prev, resolved: "false" }));
        } else {
          // Quay lại "Tất cả nhật ký", xem mọi trạng thái
          setFilters(prev => ({ ...prev, resolved: "all" }));
          setActiveFilters(prev => ({ ...prev, resolved: "all" }));
        }
      }}>
        <TabsList>
          <TabsTrigger value="all-logs">{t("admin.systemErrors.tabs.all")}</TabsTrigger>
          <TabsTrigger value="unresolved" className="gap-2">
            {t("admin.systemErrors.tabs.unresolved")}
            {summaryData?.data?.unresolved && summaryData.data.unresolved > 0 ? (
              <Badge variant="destructive" className="h-4 px-1 min-w-[16px] text-[9px] flex items-center justify-center rounded-full animate-pulse border-none">
                {summaryData.data.unresolved}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Bộ lọc UI */}
          <SystemErrorFilter
            filters={filters}
            setFilters={setFilters}
            handleResetFilters={() => { 
              const def = { level: "all", service: "all", keyword: "", resolved: tab === "unresolved" ? "false" : "all", requestId: "" };
              setFilters(def); setActiveFilters(def); setPage(0);
            }}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
          />

          {/* Bảng dữ liệu chính */}
          {isLogsLoading && logsData === undefined ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SystemErrorTable 
              logs={logsData?.data?.content || []}
              onViewDetail={handleOpenDetail}
              isLoading={isLogsFetching}
            />
          )}

          {/* Phân trang (Pagination) */}
          <div className="flex items-center justify-between p-3 border-t bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs text-primary font-bold">
              {tab === "unresolved" ? t("admin.systemErrors.tabs.unresolved") : t("admin.systemErrors.tabs.all")} • 
              {t("common.pageInfo", { current: (logsData?.data?.number || 0) + 1, total: logsData?.data?.totalPages || 1 })} • {t("common.all")} {logsData?.data?.totalElements || 0}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold uppercase tracking-tight"
                disabled={page <= 0}
                onClick={() => setPage(p => p - 1)}
              >
                {t("common.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold uppercase tracking-tight"
                disabled={logsData?.data?.last}
                onClick={() => setPage(p => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Chi tiết lỗi & Timeline điều tra (Side Panel) */}
      <SystemErrorDetailSheet
        id={selectedErrorId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
