"use client";

import React, { useState } from "react";
import { Search, RefreshCcw, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi, enUS, ja } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SystemErrorFilterProps {
  filters: {
    level: string;
    service: string;
    keyword: string;
    resolved: string;
    requestId: string;
    dateFrom?: string;
    dateTo?: string;
  };
  setFilters: (f: any) => void;
  handleResetFilters: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (b: boolean) => void;
}

export const SystemErrorFilter = ({
  filters,
  setFilters,
  handleResetFilters,
  autoRefresh,
  setAutoRefresh,
}: SystemErrorFilterProps) => {
  const { t, i18n } = useTranslation();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const dateLocale = i18n.language === "vi" ? vi : i18n.language === "ja" ? ja : enUS;

  const hasActiveFilters =
    filters.level !== "all" ||
    filters.service !== "all" ||
    filters.keyword ||
    filters.resolved !== "all" ||
    filters.requestId ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="p-4 border-b bg-card space-y-3">
      {/* Row 1: Search and Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.systemErrors.filter.searchPlaceholder")}
            className="pl-9 h-9 text-xs"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Filter */}
          <Select
            value={filters.level}
            onValueChange={(v) => setFilters({ ...filters, level: v })}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium">
              <SelectValue placeholder={t("admin.systemErrors.filter.levelPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t("admin.systemErrors.filter.allLevels")}
              </SelectItem>
              <SelectItem value="ERROR" className="text-xs font-semibold text-red-600 dark:text-red-400">
                ERROR
              </SelectItem>
              <SelectItem value="WARN" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                WARN
              </SelectItem>
              <SelectItem value="INFO" className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                INFO
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Service Filter */}
          <Select
            value={filters.service}
            onValueChange={(v) => setFilters({ ...filters, service: v })}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs font-medium">
              <SelectValue placeholder={t("admin.systemErrors.filter.servicePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t("admin.systemErrors.filter.allServices")}
              </SelectItem>
              <SelectItem value="Backend-API" className="text-xs">
                Backend-API
              </SelectItem>
              <SelectItem value="Frontend-Client" className="text-xs">
                Frontend-Client
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.resolved}
            onValueChange={(v) => setFilters({ ...filters, resolved: v })}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium">
              <SelectValue placeholder={t("admin.systemErrors.filter.statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t("admin.systemErrors.filter.allStatuses")}
              </SelectItem>
              <SelectItem value="false" className="text-xs text-amber-600 dark:text-amber-400">
                {t("admin.systemErrors.filter.pending")}
              </SelectItem>
              <SelectItem value="true" className="text-xs text-emerald-600 dark:text-emerald-400">
                {t("admin.systemErrors.filter.resolved")}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  size="icon"
                  onClick={handleResetFilters}
                  className={cn(
                    "h-9 w-9 shrink-0",
                    hasActiveFilters && "bg-primary/90 hover:bg-primary"
                  )}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("admin.systemErrors.filter.reset")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Row 2: Date Range and Request ID */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Date From */}
        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 w-full sm:w-[180px] justify-start text-left font-normal text-xs gap-2",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              {filters.dateFrom
                ? format(new Date(filters.dateFrom), "dd/MM/yyyy", { locale: dateLocale })
                : "From Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => {
                setFilters({
                  ...filters,
                  dateFrom: date ? format(date, "yyyy-MM-dd") : undefined,
                });
                setDateFromOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground hidden sm:block">-</span>

        {/* Date To */}
        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 w-full sm:w-[180px] justify-start text-left font-normal text-xs gap-2",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              {filters.dateTo
                ? format(new Date(filters.dateTo), "dd/MM/yyyy", { locale: dateLocale })
                : "To Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => {
                setFilters({
                  ...filters,
                  dateTo: date ? format(date, "yyyy-MM-dd") : undefined,
                });
                setDateToOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear Date Range */}
        {(filters.dateFrom || filters.dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] text-muted-foreground"
            onClick={() => setFilters({ ...filters, dateFrom: undefined, dateTo: undefined })}
          >
            <X className="h-3 w-3 mr-1" />
            Clear dates
          </Button>
        )}

        {/* Request ID Search */}
        <div className="flex-1 min-w-[150px]">
          <Input
            placeholder="Search by Request ID..."
            className="h-9 text-xs"
            value={filters.requestId}
            onChange={(e) => setFilters({ ...filters, requestId: e.target.value })}
          />
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center space-x-2 bg-muted/30 border px-3 h-9 rounded-md shrink-0">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
            className="scale-90"
          />
          <Label
            htmlFor="auto-refresh"
            className="text-[10px] font-bold uppercase cursor-pointer text-muted-foreground shrink-0"
          >
            {t("admin.systemErrors.filter.autoRefresh")}
          </Label>
          {autoRefresh && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            Active filters:
          </span>
          {filters.level !== "all" && (
            <Badge
              variant="secondary"
              className="h-5 text-[9px] gap-1 cursor-pointer"
              onClick={() => setFilters({ ...filters, level: "all" })}
            >
              Level: {filters.level}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {filters.service !== "all" && (
            <Badge
              variant="secondary"
              className="h-5 text-[9px] gap-1 cursor-pointer"
              onClick={() => setFilters({ ...filters, service: "all" })}
            >
              Service: {filters.service}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {filters.resolved !== "all" && (
            <Badge
              variant="secondary"
              className="h-5 text-[9px] gap-1 cursor-pointer"
              onClick={() => setFilters({ ...filters, resolved: "all" })}
            >
              Status: {filters.resolved === "true" ? "Resolved" : "Pending"}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {filters.keyword && (
            <Badge
              variant="secondary"
              className="h-5 text-[9px] gap-1 cursor-pointer"
              onClick={() => setFilters({ ...filters, keyword: "" })}
            >
              Search: {filters.keyword.slice(0, 20)}
              {filters.keyword.length > 20 && "..."}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {filters.requestId && (
            <Badge
              variant="secondary"
              className="h-5 text-[9px] gap-1 cursor-pointer"
              onClick={() => setFilters({ ...filters, requestId: "" })}
            >
              Request ID
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge
              variant="secondary"
              className="h-5 text-[9px] gap-1 cursor-pointer"
              onClick={() => setFilters({ ...filters, dateFrom: undefined, dateTo: undefined })}
            >
              {filters.dateFrom && filters.dateTo
                ? `${filters.dateFrom} - ${filters.dateTo}`
                : filters.dateFrom
                  ? `From: ${filters.dateFrom}`
                  : `To: ${filters.dateTo}`}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
