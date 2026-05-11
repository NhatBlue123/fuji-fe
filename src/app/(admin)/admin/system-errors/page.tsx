"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  useGetSystemErrorLogsQuery,
  useGetSystemErrorSummaryQuery,
} from "@/store/services/adminSystemErrorApi";
import {
  Bug,
  RefreshCw,
  Clock,
  Activity,
  ShieldAlert,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemErrorFilter } from "@/components/admin/system-errors/SystemErrorFilter";
import { SystemErrorTable } from "@/components/admin/system-errors/SystemErrorTable";
import { SystemErrorDetailSheet } from "@/components/admin/system-errors/SystemErrorDetailSheet";
import { useTranslation } from "react-i18next";

/**
 * System Error Management Page for Admin.
 * Flow:
 * 1. Capture: Errors from Backend are caught by GlobalExceptionHandler and saved to DB with Request ID.
 * 2. Monitor: Admin monitors errors via this interface, with Auto-refresh toggle for latest updates.
 * 3. Investigate: Admin views detailed stack trace, path, user context to find root cause.
 * 4. Resolve: Admin marks as resolved and adds resolution notes.
 */
export default function SystemErrorPage() {
  const { t } = useTranslation();

  const [tab, setTab] = useState("all-logs");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval] = useState(10); // seconds
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [quickFilterLevel, setQuickFilterLevel] = useState<string>("");

  // Advanced filters
  const [filters, setFilters] = useState({
    level: "all",
    service: "all",
    keyword: "",
    resolved: "all" as string,
    requestId: "",
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
  });

  const [activeFilters, setActiveFilters] = useState(filters);

  // Debounce for realtime filter
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
    isFetching: isLogsFetching,
    isError: isLogsError,
    error: logsError,
  } = useGetSystemErrorLogsQuery({
    page,
    size,
    sortBy: "createdAt",
    sortDir: "desc",
    level: quickFilterLevel || (activeFilters.level === "all" ? undefined : activeFilters.level),
    service: activeFilters.service === "all" ? undefined : activeFilters.service,
    resolved:
      activeFilters.resolved === "all"
        ? undefined
        : activeFilters.resolved === "true",
    keyword: activeFilters.keyword.trim() || undefined,
    requestId: activeFilters.requestId.trim() || undefined,
    from: activeFilters.dateFrom,
    to: activeFilters.dateTo,
  });

  const { data: summaryData, refetch: refetchSummary } =
    useGetSystemErrorSummaryQuery();

  const handleRefresh = useCallback(() => {
    refetchLogs();
    refetchSummary();
  }, [refetchLogs, refetchSummary]);

  // Auto-refresh logic with configurable interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh();
      }, autoRefreshInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, handleRefresh]);

  const handleOpenDetail = (id: number) => {
    setSelectedErrorId(id);
    setIsDetailOpen(true);
  };

  const handleResetFilters = useCallback(() => {
    const defaultFilters = {
      level: "all",
      service: "all",
      keyword: "",
      resolved: tab === "unresolved" ? "false" : "all",
      requestId: "",
      dateFrom: undefined,
      dateTo: undefined,
    };
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setPage(0);
  }, [tab]);

  const handleTabChange = (value: string) => {
    setTab(value);
    setPage(0);
    if (value === "unresolved") {
      setFilters((prev) => ({ ...prev, resolved: "false" }));
      setActiveFilters((prev) => ({ ...prev, resolved: "false" }));
    } else {
      setFilters((prev) => ({ ...prev, resolved: "all" }));
      setActiveFilters((prev) => ({ ...prev, resolved: "all" }));
    }
  };

  const logsErrorStatus =
    typeof logsError === "object" && logsError && "status" in logsError
      ? String(logsError.status)
      : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Bug className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t("admin.systemErrors.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("admin.systemErrors.subtitle")}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summaryData?.data?.unresolved ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
              {t("admin.systemErrors.filter.pending")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLogsFetching ? "animate-spin" : ""}`}
            />
            {t("admin.systemErrors.toast.refreshSuccess")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("admin.systemErrors.summary.total24h"),
            value: summaryData?.data?.total24h ?? 0,
            sub: t("admin.systemErrors.summary.total24hDesc"),
            icon: Bug,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-100 dark:bg-red-900/30",
          },
          {
            label: t("admin.systemErrors.summary.unresolved"),
            value: summaryData?.data?.unresolved ?? 0,
            sub: t("admin.systemErrors.summary.unresolvedDesc"),
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-900/30",
          },
          {
            label: t("admin.systemErrors.summary.stability"),
            value: "98.5%",
            sub: t("admin.systemErrors.summary.stabilityDesc"),
            icon: Activity,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-900/30",
          },
          {
            label: t("admin.systemErrors.summary.impactArea"),
            value: "Backend-API",
            sub: t("admin.systemErrors.summary.impactAreaDesc"),
            icon: ShieldAlert,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-900/30",
          },
        ].map((item, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </CardDescription>
              <div className={`p-1.5 rounded-md ${item.bg}`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{item.value}</div>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs and Table */}
      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all-logs" className="gap-1.5">
              {t("admin.systemErrors.tabs.all")}
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[9px]"
              >
                {logsData?.data?.totalElements ?? 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unresolved" className="gap-1.5">
              {t("admin.systemErrors.tabs.unresolved")}
              {summaryData?.data?.unresolved && summaryData.data.unresolved > 0 ? (
                <Badge
                  variant="destructive"
                  className="h-4 px-1.5 min-w-[16px] text-[9px] flex items-center justify-center"
                >
                  {summaryData.data.unresolved}
                </Badge>
              ) : (
                <span className="h-4 w-4 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Show</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 text-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Filter UI */}
          <SystemErrorFilter
            filters={filters}
            setFilters={setFilters}
            handleResetFilters={handleResetFilters}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
          />

          {/* Main Data Table */}
          {isLogsError ? (
            <div className="flex min-h-64 items-center justify-center p-6">
              <div className="max-w-md text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("admin.systemErrors.toast.refreshError")}
                  </p>
                  {logsErrorStatus && (
                    <p className="text-xs text-muted-foreground">
                      HTTP {logsErrorStatus}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("common.tryAgain")}
                </Button>
              </div>
            </div>
          ) : isLogsLoading && logsData === undefined ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SystemErrorTable
              logs={logsData?.data?.content || []}
              onViewDetail={handleOpenDetail}
              isLoading={isLogsFetching}
              onQuickFilter={setQuickFilterLevel}
              activeQuickFilter={quickFilterLevel}
            />
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs text-muted-foreground">
              {tab === "unresolved"
                ? t("admin.systemErrors.tabs.unresolved")
                : t("admin.systemErrors.tabs.all")}
              <span className="mx-1 font-bold text-slate-900 dark:text-slate-100">
                •
              </span>
              Page{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {page + 1}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {logsData?.data?.totalPages || 1}
              </span>
              <span className="mx-1 font-bold text-slate-900 dark:text-slate-100">
                •
              </span>
              Total{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {logsData?.data?.totalElements || 0}
              </span>{" "}
              errors
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold uppercase tracking-tight"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("common.prev")}
              </Button>
              {/* Page Numbers */}
              <div className="hidden md:flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, logsData?.data?.totalPages || 1) },
                  (_, i) => {
                    let pageNum = i;
                    if ((logsData?.data?.totalPages || 1) > 5) {
                      if (page >= 3) {
                        pageNum = page - 2 + i;
                        if (pageNum >= (logsData?.data?.totalPages || 1)) {
                          pageNum = (logsData?.data?.totalPages || 1) - 5 + i;
                        }
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0 text-[11px]"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold uppercase tracking-tight"
                disabled={logsData?.data?.last}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Error Detail Sheet */}
      <SystemErrorDetailSheet
        id={selectedErrorId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
