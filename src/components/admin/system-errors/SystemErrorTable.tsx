"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi, enUS, ja } from "date-fns/locale";
import { SystemErrorLog } from "@/store/services/adminSystemErrorApi";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SystemErrorTableProps {
  logs: SystemErrorLog[];
  onViewDetail: (id: number) => void;
  isLoading: boolean;
  onQuickFilter?: (level: string) => void;
  activeQuickFilter?: string;
}

const LEVEL_CONFIG = {
  ERROR: {
    icon: AlertTriangle,
    label: "ERROR",
    class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  WARN: {
    icon: AlertTriangle,
    label: "WARN",
    class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  INFO: {
    icon: Info,
    label: "INFO",
    class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
} as const;

const STATUS_CONFIG = {
  resolved: {
    label: "Resolved",
    class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pending",
    class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
} as const;

export const SystemErrorTable = ({
  logs,
  onViewDetail,
  isLoading,
  onQuickFilter,
  activeQuickFilter,
}: SystemErrorTableProps) => {
  const { t, i18n } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const dateLocale =
    i18n.language === "vi" ? vi : i18n.language === "ja" ? ja : enUS;

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getLevelBadge = (level: string) => {
    const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.INFO;
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-bold text-[10px] px-2 py-0.5 rounded-full gap-1 border flex items-center w-fit",
          config.class
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (resolved: boolean) => {
    const config = resolved ? STATUS_CONFIG.resolved : STATUS_CONFIG.pending;
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-bold text-[10px] px-2 py-0.5 rounded-full w-fit",
          config.class
        )}
      >
        {resolved ? (
          <CheckCircle2 className="h-3 w-3 mr-1" />
        ) : (
          <Clock className="h-3 w-3 mr-1" />
        )}
        {config.label}
      </Badge>
    );
  };

  const getStatusCodeColor = (code: number) => {
    if (code >= 500) return "text-red-600 dark:text-red-400";
    if (code >= 400) return "text-amber-600 dark:text-amber-400";
    if (code >= 300) return "text-blue-600 dark:text-blue-400";
    return "text-slate-600 dark:text-slate-400";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
      case "POST":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
      case "PUT":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
      case "DELETE":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      default:
        return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800";
    }
  };

  const renderExpandedRow = (log: SystemErrorLog) => (
    <TableRow key={`expand-${log.id}`} className="hover:bg-transparent">
      <TableCell colSpan={8} className="p-0 border-b-0">
        <Card className="mx-4 mb-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Error Details */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                {t("admin.systemErrors.detail.context")}
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {log.service}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={cn(
                      "font-bold font-mono",
                      getStatusCodeColor(log.statusCode)
                    )}
                  >
                    {log.statusCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Method:</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 font-bold",
                      getMethodColor(log.method)
                    )}
                  >
                    {log.method}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Request Info */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Request Info
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Request ID:</span>
                  <code className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400 flex-1 truncate">
                    {log.requestId || "N/A"}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() =>
                      log.requestId && copyToClipboard(log.requestId, log.id)
                    }
                  >
                    {copiedId === log.id ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">Path:</span>
                  <code className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400 flex-1 break-all">
                    {log.path}
                  </code>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                User Context
              </h4>
              <div className="space-y-1.5 text-xs">
                {log.userId ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-semibold font-mono">{log.userId}</span>
                    </div>
                    {log.bookingId && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Booking:</span>
                        <span className="font-semibold font-mono">
                          #{log.bookingId}
                        </span>
                      </div>
                    )}
                    {log.roomId && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Room:</span>
                        <span className="font-semibold font-mono">#{log.roomId}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic bg-muted px-2 py-1 rounded">
                    Anonymous User
                  </span>
                )}
              </div>
            </div>

            {/* Time Info */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Timeline
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {format(new Date(log.createdAt), "dd/MM/yyyy", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">
                    {format(new Date(log.createdAt), "HH:mm:ss", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
                {log.resolved && log.resolvedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Resolved:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {format(new Date(log.resolvedAt), "dd/MM HH:mm", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div className="mt-4 pt-4 border-t border-dashed">
            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">
              Error Message
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 p-2 rounded border font-mono">
              {log.messageFull || log.messageShort}
            </p>
          </div>
        </Card>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="relative">
      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
        <span className="text-[10px] font-bold uppercase text-muted-foreground mr-2">
          Quick Filter:
        </span>
        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
          const Icon = config.icon;
          const isActive = activeQuickFilter === level;
          return (
            <Button
              key={level}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-[10px] gap-1.5 px-2.5 font-bold transition-all",
                isActive
                  ? level === "ERROR"
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                    : level === "WARN"
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                      : "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  : "border-slate-300 dark:border-slate-600"
              )}
              onClick={() => onQuickFilter?.(isActive ? "" : level)}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </Button>
          );
        })}
        {activeQuickFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] ml-auto"
            onClick={() => onQuickFilter?.("")}
          >
            Clear
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-y dark:border-border">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">
              {t("admin.systemErrors.table.timestamp")}
            </TableHead>
            <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">
              {t("admin.systemErrors.table.level")}
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">
              {t("admin.systemErrors.table.error")}
            </TableHead>
            <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 text-center">
              Method
            </TableHead>
            <TableHead className="w-[70px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 text-center">
              Code
            </TableHead>
            <TableHead className="w-[110px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 text-center">
              {t("admin.systemErrors.table.status")}
            </TableHead>
            <TableHead className="w-[80px] text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">
              {t("admin.systemErrors.table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id);
            const levelConfig = LEVEL_CONFIG[log.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.INFO;
            return (
              <React.Fragment key={log.id}>
                <TableRow
                  className={cn(
                    "border-b dark:border-border transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
                    isExpanded && levelConfig.bg
                  )}
                >
                  {/* Expand Button */}
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(log.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="py-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {format(new Date(log.createdAt), "HH:mm:ss", {
                          locale: dateLocale,
                        })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(log.createdAt), "dd/MM", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </TableCell>

                  {/* Level Badge */}
                  <TableCell className="py-2">{getLevelBadge(log.level)}</TableCell>

                  {/* Error Message */}
                  <TableCell className="py-2 max-w-[300px]">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {log.messageShort}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-[9px] text-muted-foreground font-mono">
                          {log.requestId ? log.requestId.slice(0, 8) : "N/A"}...
                        </code>
                        <span className="text-[9px] text-muted-foreground">•</span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase">
                          {log.service}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Method Badge */}
                  <TableCell className="py-2 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1.5 py-0 font-bold",
                        getMethodColor(log.method)
                      )}
                    >
                      {log.method}
                    </Badge>
                  </TableCell>

                  {/* Status Code */}
                  <TableCell className="py-2 text-center">
                    <span
                      className={cn(
                        "font-bold font-mono text-xs",
                        getStatusCodeColor(log.statusCode)
                      )}
                    >
                      {log.statusCode}
                    </span>
                  </TableCell>

                  {/* Resolution Status */}
                  <TableCell className="py-2 text-center">
                    {getStatusBadge(log.resolved)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-bold text-[10px] uppercase gap-1"
                      onClick={() => onViewDetail(log.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("admin.systemErrors.table.viewDetail")}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded Row */}
                {isExpanded && renderExpandedRow(log)}
              </React.Fragment>
            );
          })}

          {logs.length === 0 && !isLoading && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-32 text-center text-xs text-muted-foreground font-medium"
              >
                {t("admin.systemErrors.table.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center rounded-b-lg">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  );
};
