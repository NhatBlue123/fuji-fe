"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarIcon,
  CheckCircle2,
  Clock3,
  Download,
  Landmark,
  LineChart as LineChartIcon,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRevenueStatsQuery } from "@/store/services/adminRevenueApi";
import type {
  AdminRevenueRecentTransaction,
  AdminRevenueStatsResponse,
  BankTransferRecord,
  CashRevenueSummary,
  CashflowSummary,
  FinancialPeriodSummary,
  MonthlyFinancialSummary,
  MonthlyPaymentStatus,
  PaymentStatusStats,
  PaymentPeriodStatus,
  ProfitSummary,
  SourceBreakdownItem,
  TeacherLiabilitySummary,
  WithdrawalStatusStats,
} from "@/types/admin-revenue";

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const HOA_TO_VND = 1000;

type TimeRangeMode = "day" | "week" | "month" | "year";

const EMPTY_PAYMENT_STATS: PaymentStatusStats = {
  totalCount: 0,
  successCount: 0,
  pendingCount: 0,
  failedCount: 0,
  cancelledCount: 0,
  successAmount: 0,
  pendingAmount: 0,
  failedAmount: 0,
  cancelledAmount: 0,
  estimatedSuccessVnd: 0,
  estimatedPendingVnd: 0,
  estimatedCancelledVnd: 0,
  actualSuccessVnd: 0,
  expectedPendingVnd: 0,
  expectedFailedVnd: 0,
  expectedCancelledVnd: 0,
  successRate: 0,
  failureRate: 0,
  cancellationRate: 0,
};

const EMPTY_WITHDRAWAL_STATS: WithdrawalStatusStats = {
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  rejectedCount: 0,
  pendingAmount: 0,
  processingAmount: 0,
  completedAmount: 0,
  rejectedAmount: 0,
};

const EMPTY_CASHFLOW: CashflowSummary = {
  recognizedRevenue: 0,
  topupVolumeBlossoms: 0,
  estimatedTopupVolumeVnd: 0,
  actualTopupVolumeVnd: 0,
  completedPayouts: 0,
  pendingPayouts: 0,
  processingPayouts: 0,
  netAfterCompletedPayouts: 0,
  projectedNetAfterPendingPayouts: 0,
  platformFeeRevenue: 0,
  courseRevenue: 0,
  withdrawalFeeRevenue: 0,
};

const EMPTY_CASH_REVENUE: CashRevenueSummary = {
  grossTopupVnd: 0,
  pendingExpectedTopupVnd: 0,
  failedExpectedTopupVnd: 0,
  bankOutVnd: 0,
  netCashVnd: 0,
  creditedBlossoms: 0,
};

const EMPTY_PROFIT: ProfitSummary = {
  totalProfitHoa: 0,
  totalProfitVndEquivalent: 0,
  bookingPlatformFeeHoa: 0,
  adminBookingProfitHoa: 0,
  coursePlatformFeeHoa: 0,
  adminCourseProfitHoa: 0,
  packageProfitHoa: 0,
  subscriptionProfitHoa: 0,
  cancellationPenaltyProfitHoa: 0,
  legacyCourseProfitHoa: 0,
};

const EMPTY_TEACHER_LIABILITY: TeacherLiabilitySummary = {
  totalTeacherLiabilityHoa: 0,
  totalTeacherLiabilityVndEquivalent: 0,
  bookingTeacherIncomeHoa: 0,
  courseTeacherIncomeHoa: 0,
  completedWithdrawalHoa: 0,
  pendingWithdrawalHoa: 0,
  processingWithdrawalHoa: 0,
  completedPayoutVnd: 0,
  pendingPayoutVnd: 0,
  processingPayoutVnd: 0,
};

type FinancialChartRow = {
  date: string;
  sortKey: number;
  "Tiền nạp vào": number;
  "Tiền chuyển ra": number;
  "Lợi nhuận tiền mặt": number;
  "Phải trả giáo viên": number;
};

type PaymentChartRow = {
  date: string;
  sortKey: number;
  "Hoàn thành": number;
  "Đang chờ": number;
  "Thất bại": number;
  "Đã hủy": number;
};

type DateBounds = {
  from: Date;
  to: Date;
};

type DateRangeSummary = {
  bankInVnd: number;
  bankOutVnd: number;
  profitHoa: number;
  teacherLiabilityHoa: number;
  bookingProfitHoa: number;
  courseProfitHoa: number;
  packageProfitHoa: number;
  subscriptionProfitHoa: number;
  transferCount: number;
  matchedTransferCount: number;
  transactionCount: number;
};

export default function AdminRevenuePage() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetRevenueStatsQuery();
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [timeRangeMode, setTimeRangeMode] = useState<TimeRangeMode>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const paymentStats = stats?.paymentStatusStats ?? EMPTY_PAYMENT_STATS;
  const withdrawalStats = stats?.withdrawalStatusStats ?? EMPTY_WITHDRAWAL_STATS;
  const cashflow = stats?.cashflowSummary ?? EMPTY_CASHFLOW;
  const serverCashRevenue = stats?.cashRevenue;
  const serverProfitSummary = stats?.profitSummary;
  const serverTeacherLiability = stats?.teacherLiabilitySummary;
  const monthlyPaymentStatuses = useMemo(
    () => stats?.monthlyPaymentStatuses ?? [],
    [stats?.monthlyPaymentStatuses],
  );
  const serverProfitBreakdown = stats?.profitBreakdown;
  const serverLiabilityBreakdown = stats?.liabilityBreakdown;
  const cashRevenue = useMemo(
    () =>
      serverCashRevenue ?? {
        ...EMPTY_CASH_REVENUE,
        grossTopupVnd:
          paymentStats.actualSuccessVnd ?? paymentStats.estimatedSuccessVnd ?? 0,
        pendingExpectedTopupVnd:
          paymentStats.expectedPendingVnd ?? paymentStats.estimatedPendingVnd ?? 0,
        failedExpectedTopupVnd: paymentStats.expectedFailedVnd ?? 0,
        bankOutVnd: hoaToVnd(withdrawalStats.completedAmount),
        netCashVnd:
          (paymentStats.actualSuccessVnd ?? paymentStats.estimatedSuccessVnd ?? 0) -
          hoaToVnd(withdrawalStats.completedAmount),
        creditedBlossoms: paymentStats.successAmount ?? 0,
      },
    [paymentStats, serverCashRevenue, withdrawalStats],
  );
  const profitSummary = useMemo(
    () =>
      serverProfitSummary ?? {
        ...EMPTY_PROFIT,
        totalProfitHoa: vndToHoaEquivalent(cashRevenue.netCashVnd),
        totalProfitVndEquivalent: cashRevenue.netCashVnd,
        bookingPlatformFeeHoa: cashflow.platformFeeRevenue ?? 0,
        coursePlatformFeeHoa: cashflow.courseRevenue ?? 0,
      },
    [cashRevenue.netCashVnd, cashflow, serverProfitSummary],
  );
  const teacherLiability = useMemo(
    () =>
      serverTeacherLiability ?? {
      ...EMPTY_TEACHER_LIABILITY,
      completedWithdrawalHoa: withdrawalStats.completedAmount ?? 0,
      pendingWithdrawalHoa: withdrawalStats.pendingAmount ?? 0,
      processingWithdrawalHoa: withdrawalStats.processingAmount ?? 0,
      completedPayoutVnd: hoaToVnd(withdrawalStats.completedAmount ?? 0),
      pendingPayoutVnd: hoaToVnd(withdrawalStats.pendingAmount ?? 0),
      processingPayoutVnd: hoaToVnd(withdrawalStats.processingAmount ?? 0),
    },
    [serverTeacherLiability, withdrawalStats],
  );
  const financialMonths = useMemo(
    () => stats?.monthlyFinancialSummaries ?? [],
    [stats?.monthlyFinancialSummaries],
  );
  const weeklyFinancial = useMemo(
    () => stats?.weeklyFinancialSummaries ?? [],
    [stats?.weeklyFinancialSummaries],
  );
  const yearlyFinancial = useMemo(
    () => stats?.yearlyFinancialSummaries ?? [],
    [stats?.yearlyFinancialSummaries],
  );
  const weeklyPaymentStatuses = useMemo(
    () => stats?.weeklyPaymentStatuses ?? [],
    [stats?.weeklyPaymentStatuses],
  );
  const yearlyPaymentStatuses = useMemo(
    () => stats?.yearlyPaymentStatuses ?? [],
    [stats?.yearlyPaymentStatuses],
  );
  const recentTransactions = useMemo(
    () => stats?.recentTransactions ?? [],
    [stats?.recentTransactions],
  );
  const bankTransferRecords = useMemo(
    () => stats?.bankTransferRecords ?? [],
    [stats?.bankTransferRecords],
  );
  const selectedYearNumber = Number(selectedYear);
  const dateBounds = useMemo(() => normalizeDateBounds(dateRange), [dateRange]);
  const dailyFinancial = useMemo(
    () => buildDailyFinancialSummaries(bankTransferRecords, recentTransactions),
    [bankTransferRecords, recentTransactions],
  );
  const dailyPaymentStatuses = useMemo(
    () => buildDailyPaymentStatuses(bankTransferRecords),
    [bankTransferRecords],
  );
  const visibleBankTransferRecords = useMemo(
    () => filterBankTransferRecordsByDate(bankTransferRecords, dateBounds),
    [bankTransferRecords, dateBounds],
  );
  const visibleRecentTransactions = useMemo(
    () => filterTransactionsByDate(recentTransactions, dateBounds),
    [dateBounds, recentTransactions],
  );
  const dateRangeSummary = useMemo(
    () =>
      buildDateRangeSummary(
        visibleBankTransferRecords,
        visibleRecentTransactions,
      ),
    [visibleBankTransferRecords, visibleRecentTransactions],
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>([CURRENT_YEAR]);
    financialMonths.forEach((item) => years.add(item.year));
    dailyFinancial.forEach((item) => item.year && years.add(item.year));
    weeklyFinancial.forEach((item) => item.year && years.add(item.year));
    yearlyFinancial.forEach((item) => item.year && years.add(item.year));
    monthlyPaymentStatuses.forEach((item) => years.add(item.year));
    dailyPaymentStatuses.forEach((item) => item.year && years.add(item.year));
    weeklyPaymentStatuses.forEach((item) => item.year && years.add(item.year));
    yearlyPaymentStatuses.forEach((item) => item.year && years.add(item.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [
    dailyFinancial,
    dailyPaymentStatuses,
    financialMonths,
    monthlyPaymentStatuses,
    weeklyFinancial,
    weeklyPaymentStatuses,
    yearlyFinancial,
    yearlyPaymentStatuses,
  ]);

  const financialChartData = useMemo(
    () =>
      buildFinancialChartData({
        mode: timeRangeMode,
        selectedYear: selectedYearNumber,
        monthly: financialMonths,
        daily: dailyFinancial,
        weekly: weeklyFinancial,
        yearly: yearlyFinancial,
        dateBounds,
      }),
    [
      dailyFinancial,
      dateBounds,
      financialMonths,
      selectedYearNumber,
      timeRangeMode,
      weeklyFinancial,
      yearlyFinancial,
    ],
  );

  const paymentChartData = useMemo(
    () =>
      buildPaymentChartData({
        mode: timeRangeMode,
        selectedYear: selectedYearNumber,
        monthly: monthlyPaymentStatuses,
        daily: dailyPaymentStatuses,
        weekly: weeklyPaymentStatuses,
        yearly: yearlyPaymentStatuses,
        dateBounds,
      }),
    [
      dailyPaymentStatuses,
      dateBounds,
      monthlyPaymentStatuses,
      selectedYearNumber,
      timeRangeMode,
      weeklyPaymentStatuses,
      yearlyPaymentStatuses,
    ],
  );

  const profitBreakdown = useMemo(
    () =>
      (serverProfitBreakdown?.length
        ? serverProfitBreakdown
        : fallbackProfitBreakdown(profitSummary)
      ).filter((item) => (item.amountHoa ?? 0) > 0),
    [profitSummary, serverProfitBreakdown],
  );
  const recoveredDiscountHoa = useMemo(
    () => profitBreakdown.reduce((sum, item) => sum + (item.amountHoa ?? 0), 0),
    [profitBreakdown],
  );

  const liabilityBreakdown = useMemo(
    () =>
      (serverLiabilityBreakdown?.length
        ? serverLiabilityBreakdown
        : fallbackLiabilityBreakdown(teacherLiability)
      ).filter((item) => (item.amountHoa ?? 0) > 0),
    [serverLiabilityBreakdown, teacherLiability],
  );

  const handleRefresh = async () => {
    try {
      await refetch().unwrap();
      toast.success("Dữ liệu phân tích đã được cập nhật");
    } catch {
      toast.error("Không thể cập nhật dữ liệu phân tích");
    }
  };

  const handleExport = () => {
    if (!stats) {
      toast.error("Chưa có dữ liệu để xuất báo cáo");
      return;
    }
    exportAdminAnalyticsCsv(stats);
    toast.success("Đã xuất báo cáo analytics");
  };

  if (isLoading) {
    return <AnalyticsLoadingState />;
  }

  if (isError || !stats) {
    return <AnalyticsErrorState onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-pink-200 bg-pink-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-pink-600 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-300"
            >
              Quản trị tài chính
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {timeRangeLabel(timeRangeMode)}
            </Badge>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Báo cáo tài chính hệ thống
            </h1>
            <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
              Lợi nhuận tiền mặt = tiền người dùng nạp vào ngân hàng trừ tiền đã chuyển ra cho giáo viên.
              Booking và khóa học chỉ phát sinh hoa khấu chi hoặc hoa chiết khấu đã thu hồi.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={timeRangeMode} onValueChange={(value) => setTimeRangeMode(value as TimeRangeMode)}>
            <SelectTrigger className="h-10 w-full rounded-full sm:w-[144px]">
              <SelectValue placeholder="Kỳ xem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Theo ngày</SelectItem>
              <SelectItem value="week">Theo tuần</SelectItem>
              <SelectItem value="month">Theo tháng</SelectItem>
              <SelectItem value="year">Theo năm</SelectItem>
            </SelectContent>
          </Select>
          {timeRangeMode !== "year" ? (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-10 w-full rounded-full sm:w-[132px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            onClear={() => setDateRange(undefined)}
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-10 rounded-full font-semibold"
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Cập nhật
          </Button>
          <Button onClick={handleExport} className="h-10 rounded-full font-semibold">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Tiền người dùng đã nạp"
          value={formatVND(cashRevenue.grossTopupVnd)}
          description={`${formatHoa(cashRevenue.creditedBlossoms)} đã cộng ví, không suy ngược bonus`}
          icon={<Landmark className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          title="Lợi nhuận hệ thống"
          value={formatVND(profitSummary.totalProfitVndEquivalent)}
          description="Tiền nạp vào trừ tiền đã chuyển ra"
          icon={<LineChartIcon className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          title="Khấu chi giáo viên"
          value={formatHoa(teacherLiability.totalTeacherLiabilityHoa)}
          description={`≈ ${formatVND(teacherLiability.totalTeacherLiabilityVndEquivalent)} nghĩa vụ đã phát sinh`}
          icon={<Wallet className="h-5 w-5" />}
          tone="amber"
        />
        <MetricCard
          title="Đã chuyển cho giáo viên"
          value={formatVND(cashRevenue.bankOutVnd)}
          description={`${formatHoa(teacherLiability.completedWithdrawalHoa)} đã chi trả hoàn tất`}
          icon={<ArrowDownRight className="h-5 w-5" />}
          tone="rose"
        />
        <MetricCard
          title="Chờ chuyển khoản"
          value={formatVND(cashRevenue.pendingExpectedTopupVnd)}
          description={`${formatNumber(paymentStats.pendingCount)} lệnh nạp đang chờ`}
          icon={<Clock3 className="h-5 w-5" />}
          tone="slate"
        />
      </div>

      <DateRangeQueryCard
        bounds={dateBounds}
        summary={dateRangeSummary}
        transactions={visibleRecentTransactions}
        transfers={visibleBankTransferRecords}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Dòng tiền & lợi nhuận {timeRangeLabel(timeRangeMode).toLowerCase()}
              </CardTitle>
              <CardDescription>
                Lợi nhuận là VND thật: tiền nạp vào trừ tiền chuyển ra.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <LegendDot className="bg-emerald-500" label="Tiền nạp" />
              <LegendDot className="bg-rose-500" label="Tiền chuyển ra" />
              <LegendDot className="bg-blue-500" label="Lợi nhuận" />
              <LegendDot className="bg-amber-500" label="Phải trả giáo viên" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[360px] w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={financialChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bankInGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.08} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                    tickFormatter={(value) => compactMoney(Number(value))}
                  />
                  <Tooltip content={<MoneyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Tiền nạp vào"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#bankInGradient)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Lợi nhuận tiền mặt"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#profitGradient)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="Phải trả giáo viên"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="Tiền chuyển ra"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="3 4"
                    fill="transparent"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Tình trạng nạp hoa
            </CardTitle>
            <CardDescription>
              Trạng thái lệnh nạp và backlog cần đối soát.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <StatusProgress
              label="Hoàn thành"
              value={paymentStats.successCount}
              total={paymentStats.totalCount}
              color="bg-emerald-500"
              helper={`${formatPercent(paymentStats.successRate)} giao dịch`}
            />
            <StatusProgress
              label="Đang chờ"
              value={paymentStats.pendingCount}
              total={paymentStats.totalCount}
              color="bg-amber-500"
              helper={`${formatVND(cashRevenue.pendingExpectedTopupVnd)} giá trị lệnh chờ`}
            />
            <StatusProgress
              label="Thất bại"
              value={paymentStats.failedCount}
              total={paymentStats.totalCount}
              color="bg-rose-500"
              helper={`${formatPercent(paymentStats.failureRate)} giao dịch`}
            />
            <StatusProgress
              label="Đã hủy"
              value={paymentStats.cancelledCount ?? 0}
              total={paymentStats.totalCount}
              color="bg-slate-500"
              helper={`${formatPercent(paymentStats.cancellationRate ?? 0)} hết hạn chờ chuyển khoản`}
            />
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Tổng lệnh nạp</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(paymentStats.totalCount)} giao dịch qua XGate
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Báo cáo thu chi
            </CardTitle>
            <CardDescription>
              Tách riêng tiền nạp ngân hàng, tiền chuyển ra và hoa phải trả giáo viên.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <CashflowLine
              icon={<ArrowUpRight className="h-4 w-4" />}
              label="Tiền người dùng nạp"
              value={formatVND(cashRevenue.grossTopupVnd)}
              description="Số tiền thật XGate ghi nhận nạp thành công"
              tone="text-emerald-600"
            />
            <CashflowLine
              icon={<LineChartIcon className="h-4 w-4" />}
              label="Lợi nhuận tiền mặt"
              value={formatVND(profitSummary.totalProfitVndEquivalent)}
              description="Tiền nạp vào trừ tiền đã chuyển ra"
              tone="text-blue-600"
            />
            <CashflowLine
              icon={<Wallet className="h-4 w-4" />}
              label="Phải trả giáo viên"
              value={formatHoa(teacherLiability.totalTeacherLiabilityHoa)}
              description="Thu nhập giáo viên phát sinh từ lịch học và khóa học"
              tone="text-amber-600"
            />
            <CashflowLine
              icon={<Banknote className="h-4 w-4" />}
              label="Đã chuyển cho giáo viên"
              value={formatVND(cashRevenue.bankOutVnd)}
              description="XGate ghi nhận chuyển ra hoặc yêu cầu rút đã hoàn tất"
              tone="text-rose-600"
            />
            <CashflowLine
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Tiền ròng trong ngân hàng"
              value={formatVND(cashRevenue.netCashVnd)}
              description="Tiền đã nạp trừ tiền đã chuyển ra"
              tone={cashRevenue.netCashVnd >= 0 ? "text-emerald-600" : "text-rose-600"}
            />
            <CashflowLine
              icon={<Clock3 className="h-4 w-4" />}
              label="Chi trả đang chờ"
              value={formatVND(
                teacherLiability.pendingPayoutVnd +
                  teacherLiability.processingPayoutVnd,
              )}
              description="Đang chờ duyệt hoặc đang chuyển, chưa trừ khỏi ngân hàng nếu chưa hoàn tất"
              tone="text-amber-600"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Trạng thái rút tiền
            </CardTitle>
            <CardDescription>
              Theo dõi luồng chi trả cho giáo viên.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-6">
            <WithdrawalTile
              label="Chờ duyệt"
              count={withdrawalStats.pendingCount}
              amountHoa={withdrawalStats.pendingAmount}
              className="bg-amber-500/10 text-amber-700 dark:text-amber-300"
            />
            <WithdrawalTile
              label="Đang chuyển"
              count={withdrawalStats.processingCount}
              amountHoa={withdrawalStats.processingAmount}
              className="bg-blue-500/10 text-blue-700 dark:text-blue-300"
            />
            <WithdrawalTile
              label="Đã hoàn tất"
              count={withdrawalStats.completedCount}
              amountHoa={withdrawalStats.completedAmount}
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            />
            <WithdrawalTile
              label="Đã từ chối"
              count={withdrawalStats.rejectedCount}
              amountHoa={withdrawalStats.rejectedAmount}
              className="bg-rose-500/10 text-rose-700 dark:text-rose-300"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BreakdownCard
          title="Hoa chiết khấu được thu hồi"
          description="Hoa giữ lại từ booking/khóa học để đối soát, không cộng vào lợi nhuận tiền mặt."
          rows={profitBreakdown}
          totalHoa={recoveredDiscountHoa}
          emptyLabel="Chưa có hoa chiết khấu được thu hồi"
          palette={["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-pink-500", "bg-slate-500"]}
        />
        <BreakdownCard
          title="Cơ cấu khấu chi giáo viên"
          description="Thu nhập giáo viên phát sinh và các khoản chi trả liên quan."
          rows={liabilityBreakdown}
          totalHoa={
            teacherLiability.totalTeacherLiabilityHoa +
            teacherLiability.completedWithdrawalHoa +
            teacherLiability.processingWithdrawalHoa +
            teacherLiability.pendingWithdrawalHoa
          }
          emptyLabel="Chưa có khấu chi giáo viên"
          palette={["bg-amber-500", "bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-slate-500"]}
        />
      </div>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Lệnh nạp hoa {timeRangeLabel(timeRangeMode).toLowerCase()}
          </CardTitle>
          <CardDescription>
            Số lượng lệnh nạp hoàn thành, đang chờ, thất bại và đã hủy do hết hạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.08} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                />
                <Tooltip content={<CountTooltip />} />
                <Legend />
                <Bar dataKey="Hoàn thành" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Đang chờ" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Thất bại" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Đã hủy" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Lịch sử chuyển khoản XGate
          </CardTitle>
          <CardDescription>
            Số tiền thật, nội dung chuyển khoản, tài khoản nhận và user/order đã khớp để đối soát.
            {dateBounds ? " Bảng đang lọc theo khoảng ngày đã chọn." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {visibleBankTransferRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-3">XGate</th>
                    <th className="px-6 py-3 text-right">Số tiền</th>
                    <th className="px-6 py-3">Nội dung</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3">Người dùng khớp</th>
                    <th className="px-6 py-3">Tài khoản nhận</th>
                    <th className="px-6 py-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleBankTransferRecords.map((record) => (
                    <BankTransferRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Landmark className="h-9 w-9 opacity-30" />}
              title="Chưa có lịch sử chuyển khoản XGate"
              description="Khi cron hoặc webhook XGate chạy, hệ thống sẽ lưu số tiền thật, nội dung chuyển khoản, tài khoản nhận và mã ORDER khớp người dùng."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Lịch sử hạch toán gần đây
          </CardTitle>
          <CardDescription>
            Giao dịch phát sinh lợi nhuận hoặc khoản phải trả giáo viên trong hệ thống.
            {dateBounds ? " Bảng đang lọc theo khoảng ngày đã chọn." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {visibleRecentTransactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-3">Mã</th>
                    <th className="px-6 py-3">Loại</th>
                    <th className="px-6 py-3">Mô tả</th>
                    <th className="px-6 py-3 text-right">Số hoa</th>
                    <th className="px-6 py-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleRecentTransactions.map((transaction, index) => (
                    <TransactionRow
                      key={transaction.id ?? index}
                      transaction={transaction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<ReceiptText className="h-9 w-9 opacity-30" />}
              title="Chưa có giao dịch gần đây"
              description="Lịch sử hạch toán sẽ xuất hiện khi có lịch học, mua khóa học, mua gói hoặc chi trả giáo viên."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DateRangePicker({
  value,
  onChange,
  onClear,
}: {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  onClear: () => void;
}) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const fromDate = value?.from;
  const toDate = value?.to;
  const hasValue = Boolean(fromDate || toDate);

  const commitRange = (nextFrom?: Date, nextTo?: Date) => {
    if (!nextFrom && !nextTo) {
      onChange(undefined);
      return;
    }

    if (nextFrom && nextTo && startOfDay(nextFrom).getTime() > startOfDay(nextTo).getTime()) {
      onChange({ from: nextTo, to: nextFrom });
      return;
    }

    onChange({ from: nextFrom, to: nextTo });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-start rounded-full text-left font-semibold sm:w-[170px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-pink-500" />
            <span className="truncate">
              {fromDate ? formatShortDate(fromDate) : "Ngày bắt đầu"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={(date) => {
              commitRange(date, toDate);
              setFromOpen(false);
            }}
            defaultMonth={fromDate ?? toDate ?? new Date()}
            locale={vi}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="hidden text-xs font-bold uppercase tracking-widest text-muted-foreground sm:inline">
        đến
      </span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-start rounded-full text-left font-semibold sm:w-[170px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-pink-500" />
            <span className="truncate">
              {toDate ? formatShortDate(toDate) : "Ngày kết thúc"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={(date) => {
              commitRange(fromDate, date);
              setToOpen(false);
            }}
            defaultMonth={toDate ?? fromDate ?? new Date()}
            locale={vi}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onClear();
            setFromOpen(false);
            setToOpen(false);
          }}
          className="h-10 rounded-full px-3 text-xs text-muted-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Xóa lọc
        </Button>
      ) : null}
    </div>
  );
}

function DateRangeQueryCard({
  bounds,
  summary,
  transactions,
  transfers,
}: {
  bounds?: DateBounds;
  summary: DateRangeSummary;
  transactions: AdminRevenueRecentTransaction[];
  transfers: BankTransferRecord[];
}) {
  const rangeLabel = bounds
    ? `${formatShortDate(bounds.from)} - ${formatShortDate(bounds.to)}`
    : "Toàn bộ dữ liệu đang tải trên trang";

  return (
    <Card className="overflow-hidden border-pink-100/80 bg-pink-50/20 dark:border-pink-500/20 dark:bg-pink-500/5">
      <CardHeader className="border-b px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Truy vấn dòng tiền theo ngày
            </CardTitle>
            <CardDescription>
              Khoảng đang xem: {rangeLabel}. Chọn ngày ở bộ lọc phía trên để lọc bảng chuyển khoản và hạch toán.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="w-fit rounded-full border-pink-200 bg-white px-3 py-1 text-pink-600 dark:border-pink-500/30 dark:bg-background"
          >
            {formatNumber(summary.transactionCount)} hạch toán · {formatNumber(summary.transferCount)} chuyển khoản
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-4">
        <QueryMetric
          label="Tiền bank ghi nhận"
          value={formatVND(summary.bankInVnd)}
          helper={`${formatNumber(summary.matchedTransferCount)} lệnh đã khớp cộng ví`}
          tone="text-emerald-600"
        />
        <QueryMetric
          label="Lợi nhuận tiền mặt"
          value={formatVND(summary.bankInVnd - summary.bankOutVnd)}
          helper="Tiền bank ghi nhận trừ tiền chuyển ra"
          tone="text-blue-600"
        />
        <QueryMetric
          label="Phải trả giáo viên"
          value={formatHoa(summary.teacherLiabilityHoa)}
          helper={`≈ ${formatVND(hoaToVnd(summary.teacherLiabilityHoa))}`}
          tone="text-amber-600"
        />
        <QueryMetric
          label="Giao dịch trong bảng"
          value={formatNumber(transactions.length + transfers.length)}
          helper={`${formatNumber(transactions.length)} hạch toán, ${formatNumber(transfers.length)} chuyển khoản`}
          tone="text-pink-600"
        />
      </CardContent>
    </Card>
  );
}

function QueryMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  tone: "emerald" | "blue" | "rose" | "amber" | "slate";
}) {
  const toneClass = {
    emerald:
      "from-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300",
    blue: "from-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300",
    rose: "from-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300",
    amber:
      "from-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300",
    slate:
      "from-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-300",
  }[tone];

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${toneClass} via-background to-background`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black tracking-tight text-foreground">
          {value}
        </div>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusProgress({
  label,
  value,
  total,
  color,
  helper,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  helper: string;
}) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className="text-sm font-black">{formatNumber(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CashflowLine({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted ${tone}`}>
        {icon}
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function WithdrawalTile({
  label,
  count,
  amountHoa,
  className,
}: {
  label: string;
  count: number;
  amountHoa: number;
  className: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}>
      <p className="text-[11px] font-black uppercase tracking-widest opacity-75">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{formatNumber(count)}</p>
      <p className="mt-1 text-xs font-bold opacity-80">
        {formatHoa(amountHoa)} · ≈ {formatVND(hoaToVnd(amountHoa))}
      </p>
    </div>
  );
}

function BreakdownCard({
  title,
  description,
  rows,
  totalHoa,
  emptyLabel,
  palette,
}: {
  title: string;
  description: string;
  rows: SourceBreakdownItem[];
  totalHoa: number;
  emptyLabel: string;
  palette: string[];
}) {
  return (
    <Card>
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {rows.length ? (
          rows.map((row, index) => (
            <BreakdownRow
              key={row.key || row.label}
              label={row.label}
              valueHoa={row.amountHoa}
              valueVnd={row.amountVnd}
              totalHoa={totalHoa}
              color={palette[index % palette.length]}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm font-semibold text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  label,
  valueHoa,
  valueVnd,
  totalHoa,
  color,
}: {
  label: string;
  valueHoa: number;
  valueVnd: number;
  totalHoa: number;
  color: string;
}) {
  const percent = totalHoa > 0 ? Math.min(100, (valueHoa / totalHoa) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{label}</p>
        <div className="text-right">
          <p className="text-sm font-black">{formatHoa(valueHoa)}</p>
          <p className="text-[11px] text-muted-foreground">≈ {formatVND(valueVnd)}</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{percent.toFixed(1)}% tổng nhóm</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function BankTransferRow({ record }: { record: BankTransferRecord }) {
  const matchedUser =
    record.matchedUserName || record.matchedUserEmail || "Chưa khớp user";
  const receiverInfo = [
    record.receiverBankName?.toUpperCase(),
    record.receiverAccount,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-6 py-4">
        <div className="font-mono text-xs font-bold">
          {shortTransferId(record.xgateTransactionId)}
        </div>
        <div className="mt-1 text-[11px] font-medium text-muted-foreground">
          {record.currency || "VND"} · {record.source || "XGate"}
        </div>
      </td>
      <td className="px-6 py-4 text-right font-black text-emerald-600">
        {formatVND(record.amountVnd)}
      </td>
      <td className="max-w-[280px] px-6 py-4">
        <div className="truncate font-mono text-xs font-bold">
          {record.content || "-"}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {record.matchedOrderId || "Không có mã ORDER"}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge
          variant="outline"
          className={`${xgateResultClass(record.processingResult)} rounded-full px-2.5 py-1 text-[10px] font-bold uppercase`}
        >
          {xgateResultLabel(record.processingResult)}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-[220px] truncate text-sm font-bold">
          {matchedUser}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {record.creditedBlossoms
            ? `${formatHoa(record.creditedBlossoms)} đã cộng ví`
            : "Chưa có ghi nhận cộng ví"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-[180px] truncate font-mono text-xs font-bold">
          {receiverInfo || "-"}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Tài khoản nhận từ XGate
        </div>
      </td>
      <td className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">
        {formatDateTime(record.transactionDate || record.createdAt)}
      </td>
    </tr>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: AdminRevenueRecentTransaction;
}) {
  const isOutflow = isOutflowType(transaction.type);

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-6 py-4 font-mono text-xs font-bold">
        #{transaction.referenceId || transaction.id}
      </td>
      <td className="px-6 py-4">
        <Badge
          variant="outline"
          className={`${transactionTypeClass(transaction.type)} rounded-full px-2.5 py-1 text-[10px] font-bold uppercase`}
        >
          {transactionTypeLabel(transaction.type)}
        </Badge>
      </td>
      <td className="max-w-[360px] truncate px-6 py-4 text-muted-foreground">
        {transaction.description || "Giao dịch hệ thống"}
      </td>
      <td
        className={`px-6 py-4 text-right font-black ${
          isOutflow ? "text-rose-600" : "text-emerald-600"
        }`}
      >
        {isOutflow ? "-" : "+"}
        {formatHoa(Math.abs(transaction.amount || 0))}
      </td>
      <td className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">
        {formatDateTime(transaction.createdAt)}
      </td>
    </tr>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground">
      {icon}
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-xl text-xs">{description}</p>
    </div>
  );
}

function AnalyticsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="h-[460px] animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-[460px] animate-pulse rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}

function AnalyticsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed bg-muted/20 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive/70" />
        <div>
          <h3 className="text-lg font-bold">Không thể tải báo cáo admin</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Dịch vụ thống kê đang bận hoặc kết nối tới backend bị lỗi.
          </p>
        </div>
        <Button onClick={onRetry} variant="outline" className="rounded-full">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    </div>
  );
}

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background p-3 shadow-lg">
      <p className="mb-2 text-xs font-black">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex min-w-[180px] items-center justify-between gap-4 text-xs">
            <span className="font-semibold" style={{ color: item.color }}>
              {item.name}
            </span>
            <span className="font-black">{formatVND(Number(item.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background p-3 shadow-lg">
      <p className="mb-2 text-xs font-black">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex min-w-[160px] items-center justify-between gap-4 text-xs">
            <span className="font-semibold" style={{ color: item.color }}>
              {item.name}
            </span>
            <span className="font-black">{formatNumber(Number(item.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildFinancialChartData({
  mode,
  selectedYear,
  monthly,
  daily,
  weekly,
  yearly,
  dateBounds,
}: {
  mode: TimeRangeMode;
  selectedYear: number;
  monthly: MonthlyFinancialSummary[];
  daily: FinancialPeriodSummary[];
  weekly: FinancialPeriodSummary[];
  yearly: FinancialPeriodSummary[];
  dateBounds?: DateBounds;
}): FinancialChartRow[] {
  if (mode === "year") {
    return (yearly.length ? yearly : [])
      .filter((item) => periodIntersectsDateBounds(item, dateBounds))
      .slice()
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
      .map((item) => financialPeriodRow(item, item.year ?? 0));
  }

  if (mode === "day") {
    return daily
      .filter((item) => item.year === selectedYear)
      .filter((item) => periodIntersectsDateBounds(item, dateBounds))
      .slice()
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
      .map((item) => financialPeriodRow(item, dateSortKey(item.periodKey)));
  }

  if (mode === "week") {
    return weekly
      .filter((item) => item.year === selectedYear)
      .filter((item) => periodIntersectsDateBounds(item, dateBounds))
      .slice()
      .sort((a, b) => (a.week ?? 0) - (b.week ?? 0))
      .map((item) => financialPeriodRow(item, item.week ?? 0));
  }

  const byKey = new Map(
    monthly.map((item) => [`${item.year}-${item.month}`, item]),
  );

  return MONTHS.filter((month) =>
    monthIntersectsDateBounds(selectedYear, month, dateBounds),
  ).map((month) => {
    const current = byKey.get(`${selectedYear}-${month}`);
    const bankInVnd = current?.bankInVnd ?? 0;
    const bankOutVnd = current?.bankOutVnd ?? 0;

    return {
      date: `T${month}`,
      sortKey: month,
      "Tiền nạp vào": bankInVnd,
      "Tiền chuyển ra": bankOutVnd,
      "Lợi nhuận tiền mặt": bankInVnd - bankOutVnd,
      "Phải trả giáo viên": hoaToVnd(current?.teacherLiabilityHoa ?? 0),
    };
  });
}

function financialPeriodRow(
  item: FinancialPeriodSummary,
  sortKey: number,
): FinancialChartRow {
  const bankInVnd = item.bankInVnd ?? 0;
  const bankOutVnd = item.bankOutVnd ?? 0;

  return {
    date: item.label,
    sortKey,
    "Tiền nạp vào": bankInVnd,
    "Tiền chuyển ra": bankOutVnd,
    "Lợi nhuận tiền mặt": bankInVnd - bankOutVnd,
    "Phải trả giáo viên": hoaToVnd(item.teacherLiabilityHoa ?? 0),
  };
}

function buildPaymentChartData({
  mode,
  selectedYear,
  monthly,
  daily,
  weekly,
  yearly,
  dateBounds,
}: {
  mode: TimeRangeMode;
  selectedYear: number;
  monthly: MonthlyPaymentStatus[];
  daily: PaymentPeriodStatus[];
  weekly: PaymentPeriodStatus[];
  yearly: PaymentPeriodStatus[];
  dateBounds?: DateBounds;
}): PaymentChartRow[] {
  if (mode === "year") {
    return yearly
      .filter((item) => periodIntersectsDateBounds(item, dateBounds))
      .slice()
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
      .map((item) => paymentPeriodRow(item, item.year ?? 0));
  }

  if (mode === "day") {
    return daily
      .filter((item) => item.year === selectedYear)
      .filter((item) => periodIntersectsDateBounds(item, dateBounds))
      .slice()
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
      .map((item) => paymentPeriodRow(item, dateSortKey(item.periodKey)));
  }

  if (mode === "week") {
    return weekly
      .filter((item) => item.year === selectedYear)
      .filter((item) => periodIntersectsDateBounds(item, dateBounds))
      .slice()
      .sort((a, b) => (a.week ?? 0) - (b.week ?? 0))
      .map((item) => paymentPeriodRow(item, item.week ?? 0));
  }

  const byKey = new Map(
    monthly.map((item) => [`${item.year}-${item.month}`, item]),
  );

  return MONTHS.filter((month) =>
    monthIntersectsDateBounds(selectedYear, month, dateBounds),
  ).map((month) => {
    const current = byKey.get(`${selectedYear}-${month}`);

    return {
      date: `T${month}`,
      sortKey: month,
      "Hoàn thành": current?.successCount ?? 0,
      "Đang chờ": current?.pendingCount ?? 0,
      "Thất bại": current?.failedCount ?? 0,
      "Đã hủy": current?.cancelledCount ?? 0,
    };
  });
}

function paymentPeriodRow(
  item: PaymentPeriodStatus,
  sortKey: number,
): PaymentChartRow {
  return {
    date: item.label,
    sortKey,
    "Hoàn thành": item.successCount ?? 0,
    "Đang chờ": item.pendingCount ?? 0,
    "Thất bại": item.failedCount ?? 0,
    "Đã hủy": item.cancelledCount ?? 0,
  };
}

function buildDailyFinancialSummaries(
  bankTransfers: BankTransferRecord[],
  transactions: AdminRevenueRecentTransaction[],
): FinancialPeriodSummary[] {
  const dailyMap = new Map<
    string,
    {
      date: Date;
      bankInVnd: number;
      bankOutVnd: number;
      profitHoa: number;
      teacherLiabilityHoa: number;
      bookingProfitHoa: number;
      courseProfitHoa: number;
      packageProfitHoa: number;
      subscriptionProfitHoa: number;
    }
  >();

  bankTransfers.forEach((record) => {
    const date = parseRecordDate(record.transactionDate, record.createdAt);
    if (!date) return;
    const accumulator = dailyFinancialAccumulator(dailyMap, date);
    if (record.type === "out") {
      accumulator.bankOutVnd += record.amountVnd ?? 0;
    } else if (record.type === "in") {
      accumulator.bankInVnd += record.amountVnd ?? 0;
    }
  });

  transactions.forEach((transaction) => {
    const date = parseRecordDate(transaction.createdAt);
    if (!date) return;
    const effect = transactionFinancialEffect(transaction);
    const accumulator = dailyFinancialAccumulator(dailyMap, date);
    accumulator.teacherLiabilityHoa += effect.teacherLiabilityHoa;
    accumulator.bookingProfitHoa += effect.bookingProfitHoa;
    accumulator.courseProfitHoa += effect.courseProfitHoa;
    accumulator.packageProfitHoa += effect.packageProfitHoa;
    accumulator.subscriptionProfitHoa += effect.subscriptionProfitHoa;
  });

  dailyMap.forEach((item) => {
    item.profitHoa = vndToHoaEquivalent(item.bankInVnd - item.bankOutVnd);
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, item]) => ({
      periodType: "DAY",
      periodKey,
      label: formatShortDate(item.date),
      year: item.date.getFullYear(),
      month: item.date.getMonth() + 1,
      week: null,
      startDate: periodKey,
      endDate: periodKey,
      bankInVnd: item.bankInVnd,
      bankOutVnd: item.bankOutVnd,
      profitHoa: item.profitHoa,
      teacherLiabilityHoa: item.teacherLiabilityHoa,
      bookingProfitHoa: item.bookingProfitHoa,
      courseProfitHoa: item.courseProfitHoa,
      packageProfitHoa: item.packageProfitHoa,
      subscriptionProfitHoa: item.subscriptionProfitHoa,
    }));
}

function buildDailyPaymentStatuses(
  bankTransfers: BankTransferRecord[],
): PaymentPeriodStatus[] {
  const dailyMap = new Map<
    string,
    {
      date: Date;
      successCount: number;
      pendingCount: number;
      failedCount: number;
      cancelledCount: number;
      successAmount: number;
      pendingAmount: number;
      failedAmount: number;
      cancelledAmount: number;
    }
  >();

  bankTransfers.forEach((record) => {
    if (record.type !== "in") return;
    const date = parseRecordDate(record.transactionDate, record.createdAt);
    if (!date) return;
    const amountHoa = record.creditedBlossoms ?? Math.round((record.amountVnd ?? 0) / HOA_TO_VND);
    const key = formatDateKey(date);
    const accumulator =
      dailyMap.get(key) ??
      {
        date: startOfDay(date),
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
        cancelledCount: 0,
        successAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        cancelledAmount: 0,
      };

    if (record.processingResult === "TOPUP_SUCCESS") {
      accumulator.successCount += 1;
      accumulator.successAmount += amountHoa;
    } else if (record.processingResult === "ERROR" || record.processingResult === "IGNORED") {
      accumulator.failedCount += 1;
      accumulator.failedAmount += amountHoa;
    } else {
      accumulator.pendingCount += 1;
      accumulator.pendingAmount += amountHoa;
    }

    dailyMap.set(key, accumulator);
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, item]) => ({
      periodType: "DAY",
      periodKey,
      label: formatShortDate(item.date),
      year: item.date.getFullYear(),
      month: item.date.getMonth() + 1,
      week: null,
      startDate: periodKey,
      endDate: periodKey,
      successCount: item.successCount,
      pendingCount: item.pendingCount,
      failedCount: item.failedCount,
      cancelledCount: item.cancelledCount,
      successAmount: item.successAmount,
      pendingAmount: item.pendingAmount,
      failedAmount: item.failedAmount,
      cancelledAmount: item.cancelledAmount,
    }));
}

function dailyFinancialAccumulator(
  dailyMap: Map<
    string,
    {
      date: Date;
      bankInVnd: number;
      bankOutVnd: number;
      profitHoa: number;
      teacherLiabilityHoa: number;
      bookingProfitHoa: number;
      courseProfitHoa: number;
      packageProfitHoa: number;
      subscriptionProfitHoa: number;
    }
  >,
  date: Date,
) {
  const key = formatDateKey(date);
  const current = dailyMap.get(key);
  if (current) return current;

  const next = {
    date: startOfDay(date),
    bankInVnd: 0,
    bankOutVnd: 0,
    profitHoa: 0,
    teacherLiabilityHoa: 0,
    bookingProfitHoa: 0,
    courseProfitHoa: 0,
    packageProfitHoa: 0,
    subscriptionProfitHoa: 0,
  };
  dailyMap.set(key, next);
  return next;
}

function buildDateRangeSummary(
  bankTransfers: BankTransferRecord[],
  transactions: AdminRevenueRecentTransaction[],
): DateRangeSummary {
  const summary: DateRangeSummary = {
    bankInVnd: 0,
    bankOutVnd: 0,
    profitHoa: 0,
    teacherLiabilityHoa: 0,
    bookingProfitHoa: 0,
    courseProfitHoa: 0,
    packageProfitHoa: 0,
    subscriptionProfitHoa: 0,
    transferCount: bankTransfers.length,
    matchedTransferCount: 0,
    transactionCount: transactions.length,
  };

  bankTransfers.forEach((record) => {
    if (record.type === "out") {
      summary.bankOutVnd += record.amountVnd ?? 0;
    } else if (record.type === "in") {
      summary.bankInVnd += record.amountVnd ?? 0;
    }
    if (record.processingResult === "TOPUP_SUCCESS") {
      summary.matchedTransferCount += 1;
    }
  });

  transactions.forEach((transaction) => {
    const effect = transactionFinancialEffect(transaction);
    summary.teacherLiabilityHoa += effect.teacherLiabilityHoa;
    summary.bookingProfitHoa += effect.bookingProfitHoa;
    summary.courseProfitHoa += effect.courseProfitHoa;
    summary.packageProfitHoa += effect.packageProfitHoa;
    summary.subscriptionProfitHoa += effect.subscriptionProfitHoa;
  });

  summary.profitHoa = vndToHoaEquivalent(summary.bankInVnd - summary.bankOutVnd);

  return summary;
}

function transactionFinancialEffect(transaction: AdminRevenueRecentTransaction) {
  const effect = {
    profitHoa: 0,
    teacherLiabilityHoa: 0,
    bookingProfitHoa: 0,
    courseProfitHoa: 0,
    packageProfitHoa: 0,
    subscriptionProfitHoa: 0,
  };

  if (isStatisticsSeedTransaction(transaction)) {
    return effect;
  }

  const amount = transaction.amount ?? 0;
  const spentAmount = spendAmount(amount);
  const positiveAmount = Math.max(amount, 0);

  switch (transaction.type) {
    case "PLATFORM_FEE":
      effect.bookingProfitHoa = positiveAmount;
      break;
    case "COURSE_PLATFORM_FEE":
    case "COURSE_ADMIN_PROFIT":
      effect.courseProfitHoa = positiveAmount;
      break;
    case "COURSE_PAYMENT":
      effect.courseProfitHoa = spentAmount;
      break;
    case "COURSE_INCOME":
      effect.teacherLiabilityHoa = positiveAmount;
      break;
    case "BOOKING_INCOME":
    case "BOOKING_PAYMENT":
      effect.teacherLiabilityHoa = positiveAmount;
      break;
    case "PACKAGE_PURCHASE":
      break;
    case "SUBSCRIPTION":
    case "SUBSCRIPTION_RENEW":
      break;
    case "BOOKING_CANCEL_PENALTY":
      effect.bookingProfitHoa = spentAmount;
      break;
    case "WITHDRAWAL_FEE":
      break;
    default:
      break;
  }

  return effect;
}

function isStatisticsSeedTransaction(transaction: AdminRevenueRecentTransaction) {
  const description = transaction.description ?? "";
  return (
    description.startsWith("Thanh toán booking ") ||
    description.startsWith("Thu nhập từ booking ") ||
    description.startsWith("Phí nền tảng booking ")
  );
}

function filterBankTransferRecordsByDate(
  records: BankTransferRecord[],
  bounds?: DateBounds,
) {
  if (!bounds) return records;
  return records.filter((record) => {
    const date = parseRecordDate(record.transactionDate, record.createdAt);
    return date ? isWithinDateBounds(date, bounds) : false;
  });
}

function filterTransactionsByDate(
  transactions: AdminRevenueRecentTransaction[],
  bounds?: DateBounds,
) {
  if (!bounds) return transactions;
  return transactions.filter((transaction) => {
    const date = parseRecordDate(transaction.createdAt);
    return date ? isWithinDateBounds(date, bounds) : false;
  });
}

function normalizeDateBounds(range?: DateRange): DateBounds | undefined {
  if (!range?.from && !range?.to) return undefined;
  const fromSource = range.from ?? range.to;
  const toSource = range.to ?? range.from;
  if (!fromSource || !toSource) return undefined;

  const from = startOfDay(fromSource);
  const to = endOfDay(toSource);

  if (from.getTime() <= to.getTime()) {
    return { from, to };
  }

  return { from: startOfDay(toSource), to: endOfDay(fromSource) };
}

function periodIntersectsDateBounds(
  item: { startDate?: string; endDate?: string; year?: number | null },
  bounds?: DateBounds,
) {
  if (!bounds) return true;
  const start = parseRecordDate(item.startDate ?? (item.year ? `${item.year}-01-01` : undefined));
  const end = parseRecordDate(item.endDate ?? (item.year ? `${item.year}-12-31` : undefined));
  if (!start || !end) return true;
  return startOfDay(start).getTime() <= bounds.to.getTime() && endOfDay(end).getTime() >= bounds.from.getTime();
}

function monthIntersectsDateBounds(
  year: number,
  month: number,
  bounds?: DateBounds,
) {
  if (!bounds) return true;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return start.getTime() <= bounds.to.getTime() && end.getTime() >= bounds.from.getTime();
}

function parseRecordDate(...values: Array<string | undefined | null>) {
  for (const value of values) {
    if (!value) continue;
    const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }

    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    }
  }
  return undefined;
}

function isWithinDateBounds(date: Date, bounds: DateBounds) {
  const time = date.getTime();
  return time >= bounds.from.getTime() && time <= bounds.to.getTime();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return format(date, "dd/MM/yyyy", { locale: vi });
}

function dateSortKey(periodKey: string) {
  return Number(periodKey.replace(/\D/g, "")) || 0;
}

function spendAmount(amount: number) {
  return amount < 0 ? -amount : 0;
}

function vndToHoaEquivalent(amountVnd: number) {
  return Math.trunc((amountVnd || 0) / HOA_TO_VND);
}

function timeRangeLabel(mode: TimeRangeMode) {
  if (mode === "day") return "Theo ngày";
  if (mode === "week") return "Theo tuần";
  if (mode === "year") return "Theo năm";
  return "Theo tháng";
}

function fallbackProfitBreakdown(summary: ProfitSummary): SourceBreakdownItem[] {
  return [
    breakdown("booking_fee", "Chiết khấu booking đã thu hồi", summary.bookingPlatformFeeHoa),
    breakdown("booking_penalty", "Hoa phạt/hủy đã thu hồi", summary.cancellationPenaltyProfitHoa),
    breakdown("course_fee", "Chiết khấu khóa học đã thu hồi", summary.coursePlatformFeeHoa),
    breakdown("course_admin", "Hoa khóa học admin đã thu hồi", summary.adminCourseProfitHoa),
    breakdown("course_legacy", "Hoa khóa học cũ chưa tách", summary.legacyCourseProfitHoa),
  ];
}

function fallbackLiabilityBreakdown(summary: TeacherLiabilitySummary): SourceBreakdownItem[] {
  return [
    breakdown("booking_teacher", "Thu nhập giáo viên từ lịch học", summary.bookingTeacherIncomeHoa),
    breakdown("course_teacher", "Thu nhập giáo viên khóa học", summary.courseTeacherIncomeHoa),
    breakdown("withdraw_completed", "Đã chi trả giáo viên", summary.completedWithdrawalHoa),
    breakdown("withdraw_processing", "Chi trả đang xử lý", summary.processingWithdrawalHoa),
    breakdown("withdraw_pending", "Chi trả đang chờ", summary.pendingWithdrawalHoa),
  ];
}

function breakdown(key: string, label: string, amountHoa: number): SourceBreakdownItem {
  return {
    key,
    label,
    amountHoa: amountHoa ?? 0,
    amountVnd: hoaToVnd(amountHoa ?? 0),
  };
}

function exportAdminAnalyticsCsv(stats: AdminRevenueStatsResponse) {
  const lines = [
    ["nhom", "chi_tieu", "gia_tri"],
    ["tong_quan", "tien_nguoi_dung_da_nap_vnd", String(stats.cashRevenue?.grossTopupVnd ?? 0)],
    ["tong_quan", "tien_rong_ngan_hang_vnd", String(stats.cashRevenue?.netCashVnd ?? 0)],
    ["tong_quan", "loi_nhuan_tien_mat_vnd", String(stats.profitSummary?.totalProfitVndEquivalent ?? 0)],
    ["tong_quan", "phai_tra_giao_vien_hoa", String(stats.teacherLiabilitySummary?.totalTeacherLiabilityHoa ?? 0)],
    ["tong_quan", "lenh_nap_hoan_thanh", String(stats.paymentStatusStats?.successCount ?? 0)],
    ["tong_quan", "lenh_nap_dang_cho", String(stats.paymentStatusStats?.pendingCount ?? 0)],
    ["tong_quan", "lenh_nap_that_bai", String(stats.paymentStatusStats?.failedCount ?? 0)],
    ["tong_quan", "lenh_nap_da_huy", String(stats.paymentStatusStats?.cancelledCount ?? 0)],
    ["tong_quan", "da_chi_tra_giao_vien_hoa", String(stats.withdrawalStatusStats?.completedAmount ?? 0)],
    ["tong_quan", "chi_tra_dang_cho_hoa", String(stats.withdrawalStatusStats?.pendingAmount ?? 0)],
    ...((stats.monthlyFinancialSummaries ?? []).map((item) => [
      "tai_chinh_theo_thang",
      `${item.month}/${item.year}`,
      [
        `tien_nap_vnd=${item.bankInVnd ?? 0}`,
        `tien_chuyen_ra_vnd=${item.bankOutVnd ?? 0}`,
        `loi_nhuan_tien_mat_vnd=${(item.bankInVnd ?? 0) - (item.bankOutVnd ?? 0)}`,
        `phai_tra_giao_vien_hoa=${item.teacherLiabilityHoa ?? 0}`,
      ].join("; "),
    ])),
    ...((stats.profitBreakdown ?? []).map((item) => [
      "hoa_chiet_khau_thu_hoi",
      item.label,
      `${item.amountHoa ?? 0} hoa / ${item.amountVnd ?? 0} VND`,
    ])),
    ...((stats.liabilityBreakdown ?? []).map((item) => [
      "co_cau_phai_tra_giao_vien",
      item.label,
      `${item.amountHoa ?? 0} hoa / ${item.amountVnd ?? 0} VND`,
    ])),
    ...((stats.recentTransactions ?? []).map((item) => [
      "hach_toan",
      item.referenceId || String(item.id),
      `${item.type}=${item.amount ?? 0}`,
    ])),
    ...((stats.bankTransferRecords ?? []).map((item) => [
      "chuyen_khoan_xgate",
      item.xgateTransactionId || String(item.id),
      [
        `so_tien_vnd=${item.amountVnd ?? 0}`,
        `noi_dung=${item.content ?? ""}`,
        `ket_qua=${item.processingResult ?? ""}`,
        `ma_lenh=${item.matchedOrderId ?? ""}`,
        `nguoi_dung=${item.matchedUserName || item.matchedUserEmail || ""}`,
        `tai_khoan_nhan=${item.receiverBankName ?? ""}/${item.receiverAccount ?? ""}`,
      ].join("; "),
    ])),
  ];

  const csv = lines
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fuji-admin-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function transactionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PLATFORM_FEE: "Phí lịch học",
    COURSE_PAYMENT: "Mua khóa học",
    COURSE_PLATFORM_FEE: "Phí khóa học",
    COURSE_ADMIN_PROFIT: "Khóa học của admin",
    COURSE_INCOME: "Thu khóa học giáo viên",
    BOOKING_PAYMENT: "Lịch học",
    BOOKING_INCOME: "Thu lịch học giáo viên",
    PACKAGE_PURCHASE: "Gói hệ thống",
    SUBSCRIPTION: "Gói thành viên",
    SUBSCRIPTION_RENEW: "Gia hạn gói",
    BOOKING_CANCEL_PENALTY: "Phí hủy",
    WITHDRAWAL_FEE: "Phí rút",
  };

  return labels[type] ?? type;
}

function transactionTypeClass(type: string) {
  if (isOutflowType(type)) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
  }
  if (["COURSE_INCOME", "BOOKING_INCOME", "BOOKING_PAYMENT"].includes(type)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
  }
  if (["COURSE_PLATFORM_FEE", "COURSE_ADMIN_PROFIT", "PLATFORM_FEE"].includes(type)) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
}

function xgateResultLabel(result?: string) {
  const labels: Record<string, string> = {
    TOPUP_SUCCESS: "Đã cộng ví",
    PAYOUT_SUCCESS: "Đã chi trả",
    IGNORED: "Không khớp",
    ERROR: "Lỗi đối soát",
  };

  return labels[result || ""] ?? result ?? "Chưa rõ";
}

function xgateResultClass(result?: string) {
  if (result === "TOPUP_SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (result === "PAYOUT_SUCCESS") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
  }
  if (result === "ERROR") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
  }
  if (result === "IGNORED") {
    return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
}

function isOutflowType(type: string) {
  return ["COURSE_PAYMENT", "PACKAGE_PURCHASE", "SUBSCRIPTION", "SUBSCRIPTION_RENEW", "BOOKING_CANCEL_PENALTY"].includes(type);
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatHoa(amount: number) {
  return `${formatNumber(amount)} hoa`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatPercent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(value || 0);
}

function hoaToVnd(amountHoa: number) {
  return (amountHoa || 0) * HOA_TO_VND;
}

function shortTransferId(value?: string) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
