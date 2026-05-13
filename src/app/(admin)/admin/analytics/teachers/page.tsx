"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Filter,
} from "lucide-react";
import { useTheme } from "@/components/common";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetTeacherDashboardQuery } from "@/store/services/teacherApi";
import { useTranslation } from "react-i18next";

// Shadcn UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChartRange = "week" | "month" | "year";

type ChartDateRange = {
  start: Date;
  end: Date;
};

type EarningsPoint = {
  date: string;
  income: number;
  bookingIncome?: number;
  courseIncome?: number;
};

type ChartPoint = {
  date: string;
  income: number;
  bookingIncome: number;
  courseIncome: number;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    payload?: ChartPoint;
  }>;
};

const currentYear = new Date().getFullYear();
const monthOptions = Array.from({ length: 12 }, (_, index) => index);
const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear - index);

const pad2 = (value: number) => value.toString().padStart(2, "0");

const toLocalDateTimeParam = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDashboardDate = (value: string) => {
  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getChartDateRange = (
  range: ChartRange,
  selectedMonth: number,
  selectedYear: number,
): ChartDateRange => {
  const now = new Date();

  if (range === "week") {
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "year") {
    return {
      start: new Date(selectedYear, 0, 1, 0, 0, 0, 0),
      end: new Date(selectedYear, 11, 31, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0),
    end: new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999),
  };
};

const buildChartData = (
  points: EarningsPoint[],
  range: ChartRange,
  start: Date,
  end: Date,
): ChartPoint[] => {
  if (range === "year") {
    const incomeByMonth = new Map<number, Omit<ChartPoint, "date">>();
    points.forEach((point) => {
      const date = parseDashboardDate(point.date);
      if (!date || date.getFullYear() !== start.getFullYear()) return;
      const month = date.getMonth();
      const current = incomeByMonth.get(month) || {
        income: 0,
        bookingIncome: 0,
        courseIncome: 0,
      };
      const bookingIncome = point.bookingIncome || 0;
      const courseIncome = point.courseIncome ?? Math.max(point.income - bookingIncome, 0);
      incomeByMonth.set(month, {
        income: current.income + point.income,
        bookingIncome: current.bookingIncome + bookingIncome,
        courseIncome: current.courseIncome + courseIncome,
      });
    });

    return Array.from({ length: 12 }, (_, month) => ({
      date: `${start.getFullYear()}-${pad2(month + 1)}-01`,
      income: incomeByMonth.get(month)?.income || 0,
      bookingIncome: incomeByMonth.get(month)?.bookingIncome || 0,
      courseIncome: incomeByMonth.get(month)?.courseIncome || 0,
    }));
  }

  const incomeByDay = new Map<string, Omit<ChartPoint, "date">>();
  points.forEach((point) => {
    const date = parseDashboardDate(point.date);
    if (!date) return;
    const key = toDateKey(date);
    const current = incomeByDay.get(key) || {
      income: 0,
      bookingIncome: 0,
      courseIncome: 0,
    };
    const bookingIncome = point.bookingIncome || 0;
    const courseIncome = point.courseIncome ?? Math.max(point.income - bookingIncome, 0);
    incomeByDay.set(key, {
      income: current.income + point.income,
      bookingIncome: current.bookingIncome + bookingIncome,
      courseIncome: current.courseIncome + courseIncome,
    });
  });

  const result: ChartPoint[] = [];
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    const key = toDateKey(date);
    const income = incomeByDay.get(key);
    result.push({
      date: key,
      income: income?.income || 0,
      bookingIncome: income?.bookingIncome || 0,
      courseIncome: income?.courseIncome || 0,
    });
  }
  return result;
};

const chartRangeLabel: Record<ChartRange, string> = {
  week: "Tuần này",
  month: "Tháng này",
  year: "Năm nay",
};

const getChartRangeLabel = (
  range: ChartRange,
  selectedMonth: number,
  selectedYear: number,
) => {
  if (range === "month") return `Tháng ${selectedMonth + 1}/${selectedYear}`;
  if (range === "year") return `Năm ${selectedYear}`;
  return chartRangeLabel.week;
};

const chartDescription: Record<ChartRange, string> = {
  week: "Hiển thị theo từng ngày trong tuần",
  month: "Hiển thị theo từng ngày trong tháng",
  year: "Hiển thị theo từng tháng trong năm",
};

const formatChartTick = (value: string, range: ChartRange) => {
  const date = parseDashboardDate(value);
  if (!date) return value;

  if (range === "year") {
    return `T${date.getMonth() + 1}`;
  }

  if (range === "week") {
    const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${weekdayLabels[date.getDay()]} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  }

  return pad2(date.getDate());
};

const formatChartTooltipLabel = (value: string, range: ChartRange) => {
  const date = parseDashboardDate(value);
  if (!date) return value;

  if (range === "year") {
    return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const TeacherDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [chartRange, setChartRange] = useState<ChartRange>("month");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const chartDateRange = useMemo(
    () => getChartDateRange(chartRange, selectedMonth, selectedYear),
    [chartRange, selectedMonth, selectedYear],
  );
  const dashboardParams = useMemo(
    () => ({
      startDate: toLocalDateTimeParam(chartDateRange.start),
      endDate: toLocalDateTimeParam(chartDateRange.end),
    }),
    [chartDateRange],
  );
  const { data: dashboardData, isLoading } = useGetTeacherDashboardQuery(dashboardParams);
  const chartData = useMemo(
    () =>
      buildChartData(
        dashboardData?.earningsOverTime || [],
        chartRange,
        chartDateRange.start,
        chartDateRange.end,
    ),
    [dashboardData?.earningsOverTime, chartRange, chartDateRange],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const isDark = theme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const chartStroke = isDark ? "#60a5fa" : "#2563eb";

  const formatCurrency = (val: number) => {
    return `${new Intl.NumberFormat(
      i18n.language === "vi" ? "vi-VN" : i18n.language,
    ).format(val)} 🌸`;
  };

  const renderIncomeTooltip = ({ active, label, payload }: ChartTooltipProps) => {
    const point = payload?.[0]?.payload;
    if (!active || !point) return null;

    return (
      <div
        className="min-w-[190px] rounded-xl border p-3 text-xs shadow-lg"
        style={{
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderColor: isDark ? "#334155" : "#e2e8f0",
        }}
      >
        <p className="mb-2 font-semibold text-foreground">
          {formatChartTooltipLabel(String(label), chartRange)}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Tổng thu nhập</span>
            <span className="font-semibold text-primary">
              {formatCurrency(point.income)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Từ khóa học</span>
            <span className="font-semibold">
              {formatCurrency(point.courseIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Từ booking</span>
            <span className="font-semibold">
              {formatCurrency(point.bookingIncome)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin.analytics.teacher.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.analytics.teacher.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            {getChartRangeLabel(chartRange, selectedMonth, selectedYear)}
          </Button>
          <Button size="sm">{t("admin.analytics.teacher.downloadReport")}</Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.analytics.teacher.totalEarnings")}
          value={formatCurrency(dashboardData?.lifetimeEarnings || 0)}
          description={t("admin.analytics.teacher.totalRevenue")}
          icon={<Wallet className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title={t("admin.analytics.teacher.monthlyGrowth")}
          value={`${dashboardData?.monthOverMonthGrowth || 0}%`}
          description={
            dashboardData?.monthOverMonthGrowth &&
            dashboardData.monthOverMonthGrowth >= 0
              ? t("admin.analytics.teacher.growthVsLastMonth", { val: 12 })
              : t("admin.analytics.teacher.growthVsLastMonth", { val: -5 })
          }
          icon={
            dashboardData?.monthOverMonthGrowth &&
            dashboardData.monthOverMonthGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )
          }
          trend={
            dashboardData?.monthOverMonthGrowth &&
            dashboardData.monthOverMonthGrowth >= 0
              ? "up"
              : "down"
          }
        />
        <StatCard
          title={t("admin.analytics.teacher.totalHours")}
          value={`${dashboardData?.totalHoursTaught || 0}h`}
          description={t("admin.analytics.teacher.totalClasses")}
          icon={<Clock className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title={t("admin.analytics.teacher.avgRating")}
          value={`${dashboardData?.averageRating || 0}/5.0`}
          description={t("admin.analytics.teacher.basedOnReviews")}
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
        />
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">{t("admin.analytics.teacher.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="students">{t("admin.analytics.teacher.tabs.topStudents")}</TabsTrigger>
          <TabsTrigger value="courses">{t("admin.analytics.teacher.tabs.courseRevenue")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Chart */}
            <Card className="lg:col-span-2 shadow-sm border-muted/60">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle>{t("admin.analytics.teacher.chart.title")}</CardTitle>
                  <CardDescription>
                    {chartDescription[chartRange]}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Select
                    value={chartRange}
                    onValueChange={(value) => setChartRange(value as ChartRange)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Chọn kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Theo tuần</SelectItem>
                      <SelectItem value="month">Theo tháng</SelectItem>
                      <SelectItem value="year">Theo năm</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartRange === "month" && (
                    <Select
                      value={String(selectedMonth)}
                      onValueChange={(value) => setSelectedMonth(Number(value))}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Tháng" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month} value={String(month)}>
                            Tháng {month + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {chartRange !== "week" && (
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(value) => setSelectedYear(Number(value))}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Năm" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-[350px] pl-2 pt-4 min-h-[350px] min-w-0 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <LineChart
                      data={chartData}
                      margin={{ top: 12, right: 18, left: 10, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke={gridColor}
                        opacity={0.7}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: textColor, fontSize: 11 }}
                        tickFormatter={(value) => formatChartTick(value, chartRange)}
                        minTickGap={chartRange === "month" ? 16 : 8}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: textColor, fontSize: 11 }}
                        allowDecimals={false}
                        domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                        tickFormatter={(value: number) =>
                          new Intl.NumberFormat(
                            i18n.language === "vi" ? "vi-VN" : i18n.language,
                          ).format(value)
                        }
                      />
                      <Tooltip
                        content={renderIncomeTooltip}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke={chartStroke}
                        strokeWidth={3}
                        dot={{
                          r: chartRange === "month" ? 2 : 3,
                          strokeWidth: 2,
                          fill: isDark ? "#0f172a" : "#ffffff",
                        }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: chartStroke }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {t("admin.analytics.teacher.chart.noData", {
                      defaultValue: "Chua co du lieu bieu do",
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wallet Section */}
            <Card className="shadow-lg border-muted/60 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  {t("admin.analytics.teacher.wallet.title")}
                </CardTitle>
                <CardDescription>
                  {t("admin.analytics.teacher.wallet.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t("admin.analytics.teacher.wallet.available")}
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {formatCurrency(dashboardData?.availableBalance || 0)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {t("admin.analytics.teacher.wallet.pending")}
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(dashboardData?.pendingPayouts || 0)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">
                    {t("admin.analytics.teacher.wallet.processing")}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button asChild className="w-full h-11" size="lg">
                  <Link href="/admin/my-withdraw">
                    {t("admin.analytics.teacher.wallet.requestWithdraw")}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{t("admin.analytics.teacher.tabs.topStudents")}</CardTitle>
                <CardDescription>
                  {t("admin.analytics.teacher.students.noData") || "Những học viên đã đầu tư nhiều nhất vào các khóa học của bạn."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder={t("admin.analytics.teacher.students.placeholder")}
                    className="h-9 w-64 rounded-md border border-input pl-8 pr-3 text-sm focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.analytics.teacher.students.table.name")}</TableHead>
                    <TableHead>{t("admin.analytics.teacher.students.table.bookings")}</TableHead>
                    <TableHead>{t("admin.analytics.teacher.students.table.spent")}</TableHead>
                    <TableHead>{t("admin.analytics.teacher.students.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.user.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.topStudents.map((student, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {student.studentName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {student.studentName}
                        </div>
                      </TableCell>
                      <TableCell>{student.bookingCount}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(student.spentAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={idx === 0 ? "default" : "secondary"}>
                          {idx === 0 ? "VIP" : "Thường"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          {t("admin.analytics.teacher.students.table.details")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!dashboardData?.topStudents ||
                    dashboardData.topStudents.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        {t("admin.analytics.teacher.students.noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.courseRevenueList.map((course, idx) => (
              <Card
                key={idx}
                className="overflow-hidden group hover:border-primary/50 transition-colors shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold line-clamp-1">
                      {course.courseTitle}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {course.studentCount} {t("admin.analytics.teacher.courses.students")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                          {t("admin.analytics.teacher.courses.revenue")}
                        </p>
                        <p className="text-xl font-black text-primary">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-emerald-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-0.5" /> 8.2%
                        </p>
                      </div>
                    </div>
                    {/* Progress indicator */}
                    <div className="w-full h-2 bg-muted rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(100, (course.studentCount / 40) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase">
                      <span>Độ phổ biến</span>
                      <span>
                        {Math.round((course.studentCount / 40) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!dashboardData?.courseRevenueList ||
              dashboardData.courseRevenueList.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 border rounded-xl bg-muted/20 text-muted-foreground italic">
                {t("admin.analytics.teacher.courses.noData")}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Subcomponent for Stats Card
type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
};

const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => (
  <Card className="shadow-sm border-muted/60 hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-4 w-4 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-muted-foreground mt-1 flex items-center">
        {trend === "up" && (
          <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
        )}
        {trend === "down" && (
          <ArrowDownRight className="h-3 w-3 mr-1 text-rose-500" />
        )}
        {description}
      </p>
    </CardContent>
  </Card>
);

export default TeacherDashboard;
