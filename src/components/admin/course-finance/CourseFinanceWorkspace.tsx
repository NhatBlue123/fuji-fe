"use client";

import React, { useMemo, useState } from "react";
import {
  useCreateCourseDiscountMutation,
  useDeleteCourseDiscountMutation,
  useGetCourseDiscountsQuery,
  useGetCourseFinanceCoursesQuery,
  useGetCourseFinanceSummaryQuery,
  useUpdateCourseDiscountMutation,
  useUpdateCourseFinancePriceMutation,
  useGetGlobalDiscountsQuery,
  useCreateGlobalDiscountMutation,
  useUpdateGlobalDiscountMutation,
  useDeleteGlobalDiscountMutation,
} from "@/store/services/courseFinanceApi";
import type {
  CourseDiscount,
  CourseFinanceCourse,
  DiscountType,
} from "@/types/course-finance";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Search,
  TicketPercent,
  Wallet,
  Users,
  BookOpen,
  Pencil,
  Trash2,
  Globe,
  Plus,
} from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "sonner";
import { tMsg } from "@/i18n";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
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
import { cn } from "@/lib/utils";

type WorkspaceMode = "admin" | "teacher";

interface CourseFinanceWorkspaceProps {
  mode: WorkspaceMode;
}

const PAGE_SIZE = 10;
const CHART_LIMIT = 12;

type SalesTier = "hot" | "medium" | "low";

interface RevenueChartPoint {
  courseId: number;
  courseTitle: string;
  courseLabel: string;
  hotRevenue: number | null;
  mediumRevenue: number | null;
  lowRevenue: number | null;
}

function getSalesTier(value: number, min: number, max: number): SalesTier {
  if (max <= min) return "medium";
  const ratio = (value - min) / (max - min);
  if (ratio >= 0.67) return "hot";
  if (ratio <= 0.33) return "low";
  return "medium";
}

function getSalesTierLabel(tier: SalesTier, t: any): string {
  if (tier === "hot") return t("admin.finance.tier.hot");
  if (tier === "low") return t("admin.finance.tier.low");
  return t("admin.finance.tier.medium");
}

function getSalesTierBadgeClass(tier: SalesTier): string {
  if (tier === "hot")
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (tier === "low") return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
}

function formatCompactCurrency(value: number, lang: string): string {
  const suffix = " 🌸";
  if (lang === "vi") {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ${suffix}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr${suffix}`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k${suffix}`;
  }
  return `${new Intl.NumberFormat(lang, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}${suffix}`;
}

function formatCurrency(value: number, lang: string): string {
  const amount = Number(value);
  return `${new Intl.NumberFormat(lang === "vi" ? "vi-VN" : lang, {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)} 🌸`;
}

function formatDateTime(value?: string | null, lang?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(lang === "vi" ? "vi-VN" : lang);
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}

export function CourseFinanceWorkspace({ mode }: CourseFinanceWorkspaceProps) {
  const { isAdmin, hasPermission } = usePermissions();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const canView = isAdmin || hasPermission("COURSE_FINANCE_VIEW");
  const canEdit = isAdmin || hasPermission("COURSE_EDIT");

  const isAdminPage = mode === "admin";
  const canLoadPage = canView && (!isAdminPage || isAdmin);

  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [selectedCourse, setSelectedCourse] =
    useState<CourseFinanceCourse | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [priceValue, setPriceValue] = useState("");

  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountStartAt, setDiscountStartAt] = useState("");
  const [discountEndAt, setDiscountEndAt] = useState("");
  const [discountActive, setDiscountActive] = useState(true);
  const [editingDiscount, setEditingDiscount] = useState<CourseDiscount | null>(
    null,
  );

  // Global discount dialog state
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false);
  const [globalEditingDiscount, setGlobalEditingDiscount] = useState<CourseDiscount | null>(null);
  const [globalCode, setGlobalCode] = useState("");
  const [globalDiscountType, setGlobalDiscountType] = useState<DiscountType>("PERCENT");
  const [globalPercent, setGlobalPercent] = useState("");
  const [globalAmount, setGlobalAmount] = useState("");
  const [globalStartAt, setGlobalStartAt] = useState("");
  const [globalEndAt, setGlobalEndAt] = useState("");
  const [globalActive, setGlobalActive] = useState(true);

  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useGetCourseFinanceSummaryQuery(undefined, { skip: !canLoadPage });

  const {
    data: pageData,
    isLoading: loadingCourses,
    isFetching: fetchingCourses,
    refetch: refetchCourses,
  } = useGetCourseFinanceCoursesQuery(
    {
      page: page - 1,
      size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
    },
    { skip: !canLoadPage },
  );

  const { data: chartSourceData, isFetching: fetchingChartData } =
    useGetCourseFinanceCoursesQuery(
      {
        page: 0,
        size: 100,
        keyword: keyword.trim() || undefined,
      },
      { skip: !canLoadPage },
    );

  const {
    data: discounts = [],
    isLoading: loadingDiscounts,
    refetch: refetchDiscounts,
  } = useGetCourseDiscountsQuery(
    selectedCourse ? selectedCourse.courseId : skipToken,
  );

  const [updatePrice, { isLoading: savingPrice }] =
    useUpdateCourseFinancePriceMutation();
  const [createDiscount, { isLoading: creatingDiscount }] =
    useCreateCourseDiscountMutation();
  const [updateDiscount, { isLoading: updatingDiscount }] =
    useUpdateCourseDiscountMutation();
  const [deleteDiscount, { isLoading: deletingDiscount }] =
    useDeleteCourseDiscountMutation();

  const {
    data: globalDiscounts = [],
    isLoading: loadingGlobalDiscounts,
    refetch: refetchGlobalDiscounts,
  } = useGetGlobalDiscountsQuery(undefined, { skip: !isAdmin });

  const [createGlobalDiscount, { isLoading: creatingGlobal }] =
    useCreateGlobalDiscountMutation();
  const [updateGlobalDiscount, { isLoading: updatingGlobal }] =
    useUpdateGlobalDiscountMutation();
  const [deleteGlobalDiscount, { isLoading: deletingGlobal }] =
    useDeleteGlobalDiscountMutation();

  const totalPages = pageData?.totalPages ?? 1;

  const { revenueChartData, revenueTierByCourseId } = useMemo(() => {
    const sourceCourses = chartSourceData?.content ?? [];
    if (!sourceCourses.length) {
      return {
        revenueChartData: [] as RevenueChartPoint[],
        revenueTierByCourseId: new Map<number, SalesTier>(),
      };
    }

    const revenues = sourceCourses.map((course) =>
      Number(course.totalRevenue ?? 0),
    );
    const minRevenue = Math.min(...revenues);
    const maxRevenue = Math.max(...revenues);

    const tierMap = new Map<number, SalesTier>();
    sourceCourses.forEach((course) => {
      const revenue = Number(course.totalRevenue ?? 0);
      tierMap.set(
        course.courseId,
        getSalesTier(revenue, minRevenue, maxRevenue),
      );
    });

    const topCourses = [...sourceCourses]
      .sort((a, b) => Number(b.totalRevenue ?? 0) - Number(a.totalRevenue ?? 0))
      .slice(0, CHART_LIMIT);

    const chartData = topCourses.map((course) => {
      const revenue = Number(course.totalRevenue ?? 0);
      const tier = tierMap.get(course.courseId) ?? "medium";
      const shortTitle =
        course.title.length > 24
          ? `${course.title.slice(0, 24).trim()}...`
          : course.title;

      return {
        courseId: course.courseId,
        courseTitle: course.title,
        courseLabel: shortTitle,
        hotRevenue: tier === "hot" ? revenue : null,
        mediumRevenue: tier === "medium" ? revenue : null,
        lowRevenue: tier === "low" ? revenue : null,
      };
    });

    return {
      revenueChartData: chartData,
      revenueTierByCourseId: tierMap,
    };
  }, [chartSourceData]);

  const pageTitle = isAdminPage
    ? t("admin.finance.title.admin")
    : t("admin.finance.title.teacher");
  const pageDescription = isAdminPage
    ? t("admin.finance.desc.admin")
    : t("admin.finance.desc.teacher");

  const submitDiscountLoading = creatingDiscount || updatingDiscount;

  const canOpenActions = canEdit;

  const activeDiscounts = useMemo(() => {
    return discounts.filter((item) => item.currentlyEffective).length;
  }, [discounts]);

  const openPriceDialog = (course: CourseFinanceCourse) => {
    setSelectedCourse(course);
    setPriceValue(String(course.price ?? 0));
    setPriceDialogOpen(true);
  };

  const openDiscountDialog = (course: CourseFinanceCourse) => {
    setSelectedCourse(course);
    setEditingDiscount(null);
    setDiscountCode("");
    setDiscountType("PERCENT");
    setDiscountPercent("");
    setDiscountAmount("");
    setDiscountStartAt("");
    setDiscountEndAt("");
    setDiscountActive(true);
    setDiscountDialogOpen(true);
  };

  const fillDiscountForm = (discount: CourseDiscount) => {
    setEditingDiscount(discount);
    setDiscountCode(discount.code);
    setDiscountType(discount.discountType ?? "PERCENT");
    setDiscountPercent(discount.discountPercent != null ? String(discount.discountPercent) : "");
    setDiscountAmount(discount.discountAmount != null ? String(discount.discountAmount) : "");
    setDiscountStartAt(toDateTimeLocalValue(discount.startAt));
    setDiscountEndAt(toDateTimeLocalValue(discount.endAt));
    setDiscountActive(discount.isActive);
  };

  const resetDiscountForm = () => {
    setEditingDiscount(null);
    setDiscountCode("");
    setDiscountType("PERCENT");
    setDiscountPercent("");
    setDiscountAmount("");
    setDiscountStartAt("");
    setDiscountEndAt("");
    setDiscountActive(true);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchSummary(), refetchCourses()]);
      toast.success(tMsg("api.success") || t("admin.finance.toast.refreshSuccess"));
    } catch {
      toast.error(tMsg("api.error") || t("admin.finance.toast.refreshError"));
    }
  };

  const handleSavePrice = async () => {
    if (!selectedCourse) return;

    const parsedPrice = Number(priceValue);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error(t("admin.finance.toast.invalidPrice"));
      return;
    }

    try {
      await updatePrice({
        courseId: selectedCourse.courseId,
        price: parsedPrice,
      }).unwrap();
      toast.success(tMsg("api.success") || "Cập nhật giá khóa học thành công");
      setPriceDialogOpen(false);
    } catch (error: any) {
      toast.error(tMsg(error?.data?.messageKey) || tMsg("api.error") || "Cập nhật giá thất bại");
    }
  };

  const handleSubmitDiscount = async () => {
    if (!selectedCourse) return;
    if (!discountCode.trim()) {
      toast.error(t("admin.finance.toast.emptyDiscountCode"));
      return;
    }

    const parsedPercent = discountType === "PERCENT" ? parseInt(discountPercent, 10) : null;
    const parsedAmount = discountType === "FIXED_AMOUNT" ? parseInt(discountAmount, 10) : null;

    if (discountType === "PERCENT" && (isNaN(parsedPercent!) || parsedPercent! < 1 || parsedPercent! > 100)) {
      toast.error(t("admin.finance.toast.invalidDiscountPercent"));
      return;
    }
    if (discountType === "FIXED_AMOUNT" && (isNaN(parsedAmount!) || parsedAmount! <= 0)) {
      toast.error("Số 🌸 giảm phải lớn hơn 0");
      return;
    }

    try {
      if (editingDiscount) {
        await updateDiscount({
          courseId: selectedCourse.courseId,
          discountId: editingDiscount.id,
          code: discountCode.trim().toUpperCase(),
          discountType,
          discountPercent: parsedPercent,
          discountAmount: parsedAmount,
          startAt: discountStartAt || undefined,
          endAt: discountEndAt || undefined,
          isActive: discountActive,
        }).unwrap();
        toast.success(tMsg("api.success") || "Cập nhật mã giảm giá thành công");
      } else {
        await createDiscount({
          courseId: selectedCourse.courseId,
          code: discountCode.trim().toUpperCase(),
          discountType,
          discountPercent: parsedPercent,
          discountAmount: parsedAmount,
          startAt: discountStartAt || undefined,
          endAt: discountEndAt || undefined,
          isActive: discountActive,
        }).unwrap();
        toast.success(tMsg("api.success") || "Tạo mã giảm giá thành công");
      }

      resetDiscountForm();
      await refetchDiscounts();
    } catch (error: any) {
      toast.error(tMsg(error?.data?.messageKey) || tMsg("api.error") || "Lưu mã giảm giá thất bại");
    }
  };

  const handleDeleteDiscount = async (discount: CourseDiscount) => {
    if (!selectedCourse) return;
    if (!window.confirm(`Xóa mã giảm giá ${discount.code}?`)) return;

    try {
      await deleteDiscount({
        courseId: selectedCourse.courseId,
        discountId: discount.id,
      }).unwrap();
      toast.success(tMsg("api.success") || "Xóa mã giảm giá thành công");
      await refetchDiscounts();
    } catch (error: any) {
      toast.error(tMsg(error?.data?.messageKey) || tMsg("api.error") || "Xóa mã giảm giá thất bại");
    }
  };

  // ── Global discount handlers ──────────────────────────────────────────────
  const resetGlobalForm = () => {
    setGlobalEditingDiscount(null);
    setGlobalCode("");
    setGlobalDiscountType("PERCENT");
    setGlobalPercent("");
    setGlobalAmount("");
    setGlobalStartAt("");
    setGlobalEndAt("");
    setGlobalActive(true);
  };

  const openGlobalDialog = () => {
    resetGlobalForm();
    setGlobalDialogOpen(true);
  };

  const handleEditGlobal = (d: CourseDiscount) => {
    setGlobalEditingDiscount(d);
    setGlobalCode(d.code);
    setGlobalDiscountType(d.discountType ?? "PERCENT");
    setGlobalPercent(d.discountPercent != null ? String(d.discountPercent) : "");
    setGlobalAmount(d.discountAmount != null ? String(d.discountAmount) : "");
    setGlobalStartAt(toDateTimeLocalValue(d.startAt));
    setGlobalEndAt(toDateTimeLocalValue(d.endAt));
    setGlobalActive(d.isActive);
  };

  const handleSaveGlobal = async () => {
    const code = globalCode.trim().toUpperCase();
    if (!code) { toast.error("Vui lòng nhập mã giảm giá"); return; }

    const parsedPercent = globalDiscountType === "PERCENT" ? parseInt(globalPercent, 10) : null;
    const parsedAmount = globalDiscountType === "FIXED_AMOUNT" ? parseInt(globalAmount, 10) : null;

    if (globalDiscountType === "PERCENT" && (isNaN(parsedPercent!) || parsedPercent! < 1 || parsedPercent! > 100)) {
      toast.error("Phần trăm giảm phải từ 1–100"); return;
    }
    if (globalDiscountType === "FIXED_AMOUNT" && (isNaN(parsedAmount!) || parsedAmount! <= 0)) {
      toast.error("Số 🌸 giảm phải lớn hơn 0"); return;
    }

    try {
      if (globalEditingDiscount) {
        await updateGlobalDiscount({
          discountId: globalEditingDiscount.id,
          code,
          discountType: globalDiscountType,
          discountPercent: parsedPercent,
          discountAmount: parsedAmount,
          startAt: globalStartAt || undefined,
          endAt: globalEndAt || undefined,
          isActive: globalActive,
        }).unwrap();
        toast.success("Cập nhật mã toàn sàn thành công");
      } else {
        await createGlobalDiscount({
          code,
          discountType: globalDiscountType,
          discountPercent: parsedPercent,
          discountAmount: parsedAmount,
          startAt: globalStartAt || undefined,
          endAt: globalEndAt || undefined,
          isActive: globalActive,
        }).unwrap();
        toast.success("Tạo mã toàn sàn thành công");
      }
      resetGlobalForm();
      refetchGlobalDiscounts();
    } catch (error: any) {
      toast.error(tMsg(error?.data?.messageKey) || "Lưu mã toàn sàn thất bại");
    }
  };

  const handleDeleteGlobal = async (d: CourseDiscount) => {
    if (!window.confirm(`Xóa mã toàn sàn ${d.code}?`)) return;
    try {
      await deleteGlobalDiscount(d.id).unwrap();
      toast.success("Đã xóa mã toàn sàn");
      refetchGlobalDiscounts();
    } catch (error: any) {
      toast.error(tMsg(error?.data?.messageKey) || "Xóa mã thất bại");
    }
  };

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("common.noAccess")}</CardTitle>
          <CardDescription>
            {t("admin.finance.error.noPermission")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isAdminPage && !isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.finance.error.adminOnly")}</CardTitle>
          <CardDescription>
            {t("admin.finance.error.adminOnlyDesc")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={openGlobalDialog}>
              <Globe className="mr-2 h-4 w-4" />
              Mã toàn sàn
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={fetchingCourses || loadingSummary}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${fetchingCourses ? "animate-spin" : ""}`}
            />
            {t("admin.finance.btn.refresh")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.finance.stat.totalCourses")}</CardDescription>
            <CardTitle className="text-3xl">
              {loadingSummary ? "..." : (summary?.totalCourses ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.finance.stat.totalStudents")}</CardDescription>
            <CardTitle className="text-3xl">
              {loadingSummary
                ? "..."
                : (summary?.totalStudents?.toLocaleString() ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.finance.stat.totalRevenue")}</CardDescription>
            <CardTitle className="text-2xl">
              {loadingSummary
                ? "..."
                : formatCurrency(summary?.totalRevenue ?? 0, lang)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin.finance.stat.activeDiscounts")}</CardDescription>
            <CardTitle className="text-3xl">
              {loadingSummary ? "..." : (summary?.activeDiscounts ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TicketPercent className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t("admin.finance.chart.title")}</CardTitle>
              <CardDescription>
                {t("admin.finance.chart.desc", { limit: CHART_LIMIT })}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {t("admin.finance.tier.hot")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {t("admin.finance.tier.medium")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> {t("admin.finance.tier.low")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full min-h-[360px] min-w-0">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <LineChart
                  data={revenueChartData}
                  margin={{ top: 16, right: 20, left: 8, bottom: 20 }}
                  key={`chart-${revenueChartData.length}`}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="courseLabel"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={66}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      formatCompactCurrency(Number(value ?? 0), lang)
                    }
                  />
                  <Tooltip
                    formatter={(
                      value: number | string | undefined,
                      name: string | number | undefined,
                    ) => [formatCurrency(Number(value ?? 0), lang), String(name)]}
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.courseTitle || t("admin.finance.table.course")
                    }
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--background))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hotRevenue"
                    name={t("admin.finance.tier.hot")}
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mediumRevenue"
                    name={t("admin.finance.tier.medium")}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lowRevenue"
                    name={t("admin.finance.tier.low")}
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                {fetchingChartData
                  ? t("admin.finance.chart.loading")
                  : t("admin.finance.chart.noData")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("admin.finance.list.title")}</CardTitle>
            <CardDescription>
              {t("admin.finance.list.desc")}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder={t("admin.finance.placeholder.search")}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.finance.table.course")}</TableHead>
                  <TableHead>{t("admin.finance.table.instructor")}</TableHead>
                  <TableHead className="text-right">{t("admin.finance.table.price")}</TableHead>
                  <TableHead className="text-right">{t("admin.finance.table.students")}</TableHead>
                  <TableHead className="text-right">{t("admin.finance.table.revenue")}</TableHead>
                  <TableHead className="text-right">{t("admin.finance.table.transactions")}</TableHead>
                  <TableHead className="text-right">{t("admin.finance.table.activeCodes")}</TableHead>
                  <TableHead className="text-right">{t("admin.finance.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCourses ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {t("common.loading") || "Đang tải dữ liệu..."}
                    </TableCell>
                  </TableRow>
                ) : pageData?.content?.length ? (
                  pageData.content.map((course) => (
                    <TableRow key={course.courseId}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{course.title}</p>
                          <Badge
                            variant={
                              course.isPublished ? "default" : "secondary"
                            }
                          >
                            {course.isPublished ? t("admin.finance.status.published") : t("admin.finance.status.draft")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.instructor?.fullName ||
                          course.instructor?.username ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(course.price, lang)}
                      </TableCell>
                      <TableCell className="text-right">
                        {course.studentCount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium">
                            {formatCurrency(course.totalRevenue, lang)}
                          </span>
                          <Badge
                            className={cn(
                              "border-transparent text-[11px]",
                              getSalesTierBadgeClass(
                                revenueTierByCourseId.get(course.courseId) ??
                                  "medium",
                              ),
                            )}
                          >
                            {getSalesTierLabel(
                              revenueTierByCourseId.get(course.courseId) ??
                                "medium", t
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {course.totalTransactions?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {course.activeDiscounts?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canOpenActions}
                            onClick={() => openPriceDialog(course)}
                          >
                            {t("admin.finance.btn.editPrice")}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!canOpenActions}
                            onClick={() => openDiscountDialog(course)}
                          >
                            {t("admin.finance.btn.discountCodes")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {t("common.noMatchingData") || "Không có khóa học phù hợp"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("common.pageInfo", { current: page, total: Math.max(totalPages, 1) })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loadingCourses}
              >
                {t("common.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(Math.max(totalPages, 1), prev + 1))
                }
                disabled={page >= totalPages || loadingCourses}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.finance.dialog.editPrice")}</DialogTitle>
            <DialogDescription>{selectedCourse?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="course-price">{t("admin.finance.label.newPrice")}</Label>
            <Input
              id="course-price"
              type="number"
              min={0}
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSavePrice} disabled={savingPrice}>
              {savingPrice ? "Đang lưu..." : "Lưu giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý mã giảm giá</DialogTitle>
            <DialogDescription>
              {selectedCourse?.title} • Đang hiệu lực: {activeDiscounts}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">
                {editingDiscount
                  ? "Cập nhật mã giảm giá"
                  : "Tạo mã giảm giá mới"}
              </h3>

              <div className="space-y-2">
                <Label>Mã giảm giá</Label>
                <Input
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                  placeholder="VD: SPRING20"
                />
              </div>

              <div className="space-y-2">
                <Label>Loại giảm giá</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={discountType === "PERCENT" ? "default" : "outline"}
                    onClick={() => setDiscountType("PERCENT")}
                    className="flex-1"
                  >
                    % Phần trăm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={discountType === "FIXED_AMOUNT" ? "default" : "outline"}
                    onClick={() => setDiscountType("FIXED_AMOUNT")}
                    className="flex-1"
                  >
                    Số 🌸
                  </Button>
                </div>
              </div>

              {discountType === "PERCENT" ? (
                <div className="space-y-2">
                  <Label>Phần trăm giảm (1–100)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="VD: 20"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Số 🌸 giảm</Label>
                  <Input
                    type="number"
                    min={1}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="VD: 500"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bắt đầu</Label>
                  <DateTimePicker
                    value={discountStartAt}
                    onChange={setDiscountStartAt}
                    placeholder="Không giới hạn"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <DateTimePicker
                    value={discountEndAt}
                    onChange={setDiscountEndAt}
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="discount-active">Kích hoạt mã</Label>
                <Switch
                  id="discount-active"
                  checked={discountActive}
                  onCheckedChange={setDiscountActive}
                />
              </div>

              <div className="flex gap-2">
                {editingDiscount && (
                  <Button variant="outline" onClick={resetDiscountForm}>
                    Bỏ chỉnh sửa
                  </Button>
                )}
                <Button
                  onClick={handleSubmitDiscount}
                  disabled={submitDiscountLoading}
                >
                  {submitDiscountLoading
                    ? "Đang lưu..."
                    : editingDiscount
                      ? "Cập nhật mã"
                      : "Tạo mã"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Danh sách mã hiện có</h3>
              <div className="max-h-[420px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Giảm</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDiscounts ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Đang tải mã giảm giá...
                        </TableCell>
                      </TableRow>
                    ) : discounts.length ? (
                      discounts.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.code}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(item.startAt)} -{" "}
                                {formatDateTime(item.endAt)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.discountType === "FIXED_AMOUNT"
                              ? `${(item.discountAmount ?? 0).toLocaleString("vi-VN")} 🌸`
                              : `${item.discountPercent ?? 0}%`}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.currentlyEffective
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {item.currentlyEffective
                                ? "Hiệu lực"
                                : "Không hiệu lực"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => fillDiscountForm(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={deletingDiscount}
                                onClick={() => handleDeleteDiscount(item)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Chưa có mã giảm giá
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Global Discount Dialog (Admin only) ─────────────────────────── */}
      {isAdmin && (
        <Dialog open={globalDialogOpen} onOpenChange={(open) => { setGlobalDialogOpen(open); if (!open) resetGlobalForm(); }}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Mã giảm giá toàn sàn
              </DialogTitle>
              <DialogDescription>
                Mã áp dụng cho tất cả khóa học trên hệ thống
              </DialogDescription>
            </DialogHeader>

            {/* Form tạo / sửa */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <h3 className="text-sm font-semibold">
                {globalEditingDiscount ? "Cập nhật mã" : "Tạo mã mới"}
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Mã giảm giá</Label>
                  <Input
                    value={globalCode}
                    onChange={(e) => setGlobalCode(e.target.value.toUpperCase())}
                    placeholder="VD: SALE50"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Loại giảm giá</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={globalDiscountType === "PERCENT" ? "default" : "outline"}
                      onClick={() => setGlobalDiscountType("PERCENT")}
                      className="flex-1"
                    >
                      % Phần trăm
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={globalDiscountType === "FIXED_AMOUNT" ? "default" : "outline"}
                      onClick={() => setGlobalDiscountType("FIXED_AMOUNT")}
                      className="flex-1"
                    >
                      Số 🌸
                    </Button>
                  </div>
                </div>

                {globalDiscountType === "PERCENT" ? (
                  <div className="space-y-1.5">
                    <Label>Phần trăm giảm (1–100)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={globalPercent}
                      onChange={(e) => setGlobalPercent(e.target.value)}
                      placeholder="VD: 20"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Số 🌸 giảm</Label>
                    <Input
                      type="number"
                      min={1}
                      value={globalAmount}
                      onChange={(e) => setGlobalAmount(e.target.value)}
                      placeholder="VD: 500"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Bắt đầu</Label>
                  <DateTimePicker
                    value={globalStartAt}
                    onChange={setGlobalStartAt}
                    placeholder="Không giới hạn"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Kết thúc</Label>
                  <DateTimePicker
                    value={globalEndAt}
                    onChange={setGlobalEndAt}
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={globalActive} onCheckedChange={setGlobalActive} id="global-active" />
                <Label htmlFor="global-active">Kích hoạt ngay</Label>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSaveGlobal}
                  disabled={creatingGlobal || updatingGlobal}
                  className="flex-1"
                >
                  {creatingGlobal || updatingGlobal ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {globalEditingDiscount ? "Lưu thay đổi" : "Tạo mã"}
                </Button>
                {globalEditingDiscount && (
                  <Button variant="outline" onClick={resetGlobalForm}>
                    Hủy
                  </Button>
                )}
              </div>
            </div>

            {/* Danh sách mã toàn sàn */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Danh sách mã toàn sàn</h3>
                <Badge variant="secondary">{globalDiscounts.length} mã</Badge>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Giảm</TableHead>
                      <TableHead>Thời hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingGlobalDiscounts ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : globalDiscounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                          Chưa có mã toàn sàn nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      globalDiscounts.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>
                            <span className="font-mono font-semibold text-sm">{d.code}</span>
                          </TableCell>
                          <TableCell>
                            {d.discountType === "PERCENT"
                              ? `${d.discountPercent}%`
                              : `${(d.discountAmount ?? 0).toLocaleString("vi-VN")} 🌸`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {d.startAt ? formatDateTime(d.startAt, lang) : "—"}
                            {" → "}
                            {d.endAt ? formatDateTime(d.endAt, lang) : "∞"}
                          </TableCell>
                          <TableCell>
                            {d.currentlyEffective ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-400/30 hover:bg-emerald-500/20">
                                Hiệu lực
                              </Badge>
                            ) : d.isActive ? (
                              <Badge variant="secondary">Chờ</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Tắt</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditGlobal(d)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={deletingGlobal}
                                onClick={() => handleDeleteGlobal(d)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
